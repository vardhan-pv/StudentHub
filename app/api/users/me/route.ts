import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    }

    const tokenData = await verifyToken(token);
    if (!tokenData) {
      return NextResponse.json(errorResponse('Invalid or expired session'), { status: 401 });
    }

    const userId = (tokenData as any).userId;
    const { supabase } = await import('@/lib/supabase');

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, full_name, role, avatar, bio, subscription_tier, purchases_count')
      .eq('id', userId)
      .single();

    if (!user || error) {
      return NextResponse.json(errorResponse('User not found'), { status: 404 });
    }

    return NextResponse.json(successResponse({
      userId: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      subscriptionTier: user.subscription_tier || 'free',
      purchasesCount: user.purchases_count || 0,
    }));
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
