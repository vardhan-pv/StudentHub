import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, validateAuthHeader } from '@/lib/api-response';
import { z } from 'zod';

// Initialize Razorpay client when needed
const getRazorpayInstance = () => {
  try {
    // Razorpay would be imported dynamically when available
    return null;
  } catch {
    return null;
  }
};

const createOrderSchema = z.object({
  projectId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { valid, token } = validateAuthHeader(authHeader || '');

    if (!valid) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const tokenData = verifyToken(token!);
    if (!tokenData || typeof tokenData === 'string') {
      return NextResponse.json(errorResponse('Invalid token'), { status: 401 });
    }

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

// POST /api/orders - Create order
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { valid, token } = validateAuthHeader(authHeader || '');
    if (!valid) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const tokenData = verifyToken(token!);
    if (!tokenData || typeof tokenData === 'string') {
      return NextResponse.json(errorResponse('Invalid token'), { status: 401 });
    }

    const userId = (tokenData as any).userId;
    const body = await request.json();

    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) return NextResponse.json(errorResponse('Invalid order data'), { status: 400 });

    const { projectId } = validation.data;
    const { supabase } = await import('@/lib/supabase');

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project || projectError) return NextResponse.json(errorResponse('Project not found'), { status: 404 });

    // Mock Razorpay Order for demo purposes since real config is pending
    const razorpayOrderId = `order_${Math.random().toString(36).substr(2, 9)}`;

    // Create order in DB
    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert({
        buyer_id: userId,
        seller_id: project.seller_id,
        project_id: projectId,
        price: project.price,
        razorpay_order_id: razorpayOrderId,
        status: 'pending',
        download_count: 0,
        max_downloads: 5,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(
      successResponse(
        {
          orderId: order.id,
          razorpayOrderId,
          amount: project.price,
          projectTitle: project.title,
        },
        'Order created successfully',
        201
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(errorResponse('Failed to create order'), { status: 500 });
  }
}
