import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, validateAuthHeader } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { valid, token } = validateAuthHeader(authHeader || '');

    if (!valid) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    const tokenData = await verifyToken(token!);
    if (!tokenData || typeof tokenData === 'string') {
      return NextResponse.json(
        errorResponse('Invalid token'),
        { status: 401 }
      );
    }

    const userId = (tokenData as any).userId;
    const userRole = (tokenData as any).role;

    const { supabase } = await import('@/lib/supabase');
    
    // Get seller's projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('seller_id', userId);

    if (projectsError) throw projectsError;

    const totalProjects = projects?.length || 0;
    const totalDownloads = projects?.reduce((sum, p) => sum + (p.downloads || 0), 0) || 0;

    // Get completed orders for seller (Earnings)
    const { data: sellerOrders, error: sellerOrdersError } = await supabase
      .from('orders')
      .select('*, projects(title), users:buyer_id(username)')
      .eq('seller_id', userId)
      .eq('status', 'completed');

    if (sellerOrdersError) throw sellerOrdersError;

    const totalSales = sellerOrders?.length || 0;
    const totalEarnings = sellerOrders?.reduce((sum, o) => sum + Number(o.price), 0) || 0;

    // Get recent sales (last 30 days) - for now just latest 10
    const recentSales = sellerOrders?.slice(0, 10).map((order: any) => ({
      projectTitle: order.projects?.title || 'Unknown Project',
      buyerUsername: order.users?.username || 'Unknown Buyer',
      amount: Number(order.price),
      date: order.created_at,
    })) || [];

    // Get top projects
    const topProjects = [...(projects || [])]
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, 5)
      .map((p) => ({
        title: p.title,
        downloads: p.downloads,
        price: p.price,
        rating: p.rating,
      }));

    // Get user's purchases (as a buyer)
    const { data: purchases, error: purchasesError } = await supabase
      .from('orders')
      .select('*, projects(title)')
      .eq('buyer_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (purchasesError) throw purchasesError;

    const formattedPurchases = purchases?.map((order: any) => ({
      orderId: order.id,
      projectTitle: order.projects?.title || 'Unknown Project',
      amount: Number(order.price),
      date: order.created_at,
      projectId: order.project_id,
    })) || [];

    return NextResponse.json(
      successResponse({
        stats: {
          totalProjects,
          totalSales,
          totalDownloads,
          totalEarnings,
          averageProjectPrice: totalProjects > 0 ? projects!.reduce((sum, p) => sum + Number(p.price), 0) / totalProjects : 0,
        },
        recentSales,
        topProjects,
        purchases: formattedPurchases,
        userRole,
      })
    );
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch dashboard data'),
      { status: 500 }
    );
  }
}
