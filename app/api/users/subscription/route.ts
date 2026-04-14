import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';
import { successResponse, errorResponse } from '@/lib/api-response';

export const SUBSCRIPTION_LIMITS: Record<string, number> = {
  free: 1,
  pro: 10,
  max: Infinity,
};

export const SUBSCRIPTION_PRICES: Record<string, number> = {
  free: 0,
  pro: 499,
  max: 999,
};

// GET /api/users/subscription - Get current subscription
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const tokenData = await verifyToken(token);
    if (!tokenData) return NextResponse.json(errorResponse('Invalid session'), { status: 401 });

    const userId = (tokenData as any).userId;
    const { supabase } = await import('@/lib/supabase');

    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier, purchases_count')
      .eq('id', userId)
      .single();

    if (!user || error) return NextResponse.json(errorResponse('User not found'), { status: 404 });

    const tier = user.subscription_tier || 'free';
    const purchasesCount = user.purchases_count || 0;
    const limit = SUBSCRIPTION_LIMITS[tier];

    return NextResponse.json(successResponse({
      tier,
      purchasesCount,
      purchasesLimit: limit === Infinity ? null : limit,
      canPurchase: limit === Infinity || purchasesCount < limit,
    }));
  } catch (error) {
    console.error('Subscription GET error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

// POST /api/users/subscription - Upgrade plan (simulated)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const tokenData = await verifyToken(token);
    if (!tokenData) return NextResponse.json(errorResponse('Invalid session'), { status: 401 });

    const userId = (tokenData as any).userId;
    const body = await request.json();
    const { tier } = body;

    if (!['free', 'pro', 'max'].includes(tier)) {
      return NextResponse.json(errorResponse('Invalid subscription tier'), { status: 400 });
    }

    const { supabase } = await import('@/lib/supabase');

    const { data: user, error: upgradeError } = await supabase
      .from('users')
      .update({ subscription_tier: tier })
      .eq('id', userId)
      .select('subscription_tier, purchases_count')
      .single();

    if (upgradeError) {
      console.error('Subscription upgrade error:', upgradeError);
      return NextResponse.json(errorResponse('Failed to upgrade subscription'), { status: 500 });
    }

    const limit = SUBSCRIPTION_LIMITS[tier];

    return NextResponse.json(successResponse({
      tier,
      purchasesCount: user.purchases_count || 0,
      purchasesLimit: limit === Infinity ? null : limit,
      canPurchase: true,
    }, `Successfully upgraded to ${tier} plan!`));
  } catch (error) {
    console.error('Subscription POST error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
