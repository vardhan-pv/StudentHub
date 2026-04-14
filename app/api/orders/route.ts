import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';
import { successResponse, errorResponse } from '@/lib/api-response';
import { SUBSCRIPTION_LIMITS } from '@/app/api/users/subscription/route';
import { z } from 'zod';

const createOrderSchema = z.object({
  projectId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const tokenData = await verifyToken(token);
    if (!tokenData) return NextResponse.json(errorResponse('Invalid session'), { status: 401 });

    const userId = (tokenData as any).userId;
    const { supabase } = await import('@/lib/supabase');

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, projects(title)')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(successResponse({ orders }));
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(errorResponse('Failed to fetch orders'), { status: 500 });
  }
}

// POST /api/orders - Create order with subscription enforcement
export async function POST(request: NextRequest) {
  try {
    // Auth via cookie
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(errorResponse('Please log in to purchase a project'), { status: 401 });
    }

    const tokenData = await verifyToken(token);
    if (!tokenData) {
      return NextResponse.json(errorResponse('Invalid or expired session. Please log in again.'), { status: 401 });
    }

    const userId = (tokenData as any).userId;
    const body = await request.json();

    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) return NextResponse.json(errorResponse('Invalid order data'), { status: 400 });

    const { projectId } = validation.data;
    const { supabase } = await import('@/lib/supabase');

    // Get user with subscription info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_tier, purchases_count')
      .eq('id', userId)
      .single();

    if (!user || userError) return NextResponse.json(errorResponse('User not found'), { status: 404 });

    const tier = user.subscription_tier || 'free';
    const purchasesCount = user.purchases_count || 0;
    const limit = SUBSCRIPTION_LIMITS[tier];

    // Enforce subscription limits
    if (limit !== Infinity && purchasesCount >= limit) {
      const tierNames: Record<string, string> = { free: 'Free', pro: 'Pro', max: 'Max' };
      return NextResponse.json(
        errorResponse(
          `You've reached the ${tierNames[tier]} plan limit of ${limit} purchase${limit === 1 ? '' : 's'}. Upgrade your plan to buy more projects.`
        ),
        { 
          status: 403,
          headers: { 'X-Upgrade-Required': 'true', 'X-Current-Tier': tier }
        }
      );
    }

    // Check for duplicate purchase
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', userId)
      .eq('project_id', projectId)
      .single();

    if (existingOrder) {
      return NextResponse.json(errorResponse('You have already purchased this project'), { status: 409 });
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project || projectError) return NextResponse.json(errorResponse('Project not found'), { status: 404 });

    // Prevent self-purchase
    if (project.seller_id === userId) {
      return NextResponse.json(errorResponse('You cannot purchase your own project'), { status: 400 });
    }

    // Create order (simulated payment — status is 'completed')
    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert({
        buyer_id: userId,
        seller_id: project.seller_id,
        project_id: projectId,
        price: project.price,
        razorpay_order_id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        download_count: 0,
        max_downloads: 5,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Increment purchases_count
    await supabase
      .from('users')
      .update({ purchases_count: purchasesCount + 1 })
      .eq('id', userId);

    return NextResponse.json(
      successResponse(
        {
          orderId: order.id,
          projectTitle: project.title,
          sellerUsername: project.seller_username,
          sellerId: project.seller_id,
          amount: project.price,
          chatEnabled: true,
        },
        'Purchase successful! You can now chat with the seller.',
        201
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(errorResponse('Failed to create order'), { status: 500 });
  }
}
