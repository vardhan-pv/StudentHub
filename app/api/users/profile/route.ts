import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';
import { successResponse, errorResponse, validateAuthHeader } from '@/lib/api-response';
import { z } from 'zod';

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  bio: z.string().max(500).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { valid, token } = validateAuthHeader(authHeader || '');

    if (!valid) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    }

    const tokenData = await verifyToken(token!);
    if (!tokenData || typeof tokenData === 'string') {
      return NextResponse.json(errorResponse('Invalid token'), { status: 401 });
    }

    const userId = (tokenData as any).userId;
    const { supabase } = await import('@/lib/supabase');

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      console.error(validation.error);
      return NextResponse.json(errorResponse('Invalid data provided'), { status: 400 });
    }

    // Map body to DB fields
    const updateData: any = {};
    if (validation.data.fullName !== undefined) updateData.full_name = validation.data.fullName;
    if (validation.data.bio !== undefined) updateData.bio = validation.data.bio;
    if (validation.data.avatar !== undefined) updateData.avatar = validation.data.avatar;

    // Update user in Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError || !updatedUser) {
      console.error('Supabase profile update error:', updateError);
      return NextResponse.json(errorResponse('Failed to update profile'), { status: 500 });
    }

    return NextResponse.json(successResponse({ user: {
      userId: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      fullName: updatedUser.full_name,
      role: updatedUser.role,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
    } }, 'Profile updated successfully'));
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(errorResponse('Failed to update profile'), { status: 500 });
  }
}
