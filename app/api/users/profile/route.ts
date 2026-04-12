import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, validateAuthHeader } from '@/lib/api-response';
import { ObjectId } from 'mongodb';
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

    const tokenData = verifyToken(token!);
    if (!tokenData || typeof tokenData === 'string') {
      return NextResponse.json(errorResponse('Invalid token'), { status: 401 });
    }

    const userId = (tokenData as any).userId;
    const { db } = await connectToDatabase();

    let userObjectId: any = userId;
    try {
      userObjectId = new ObjectId(userId);
    } catch {
      // Fallback
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      console.error(validation.error);
      return NextResponse.json(errorResponse('Invalid data provided'), { status: 400 });
    }

    // Filter out undefined values to avoid overwriting with undefined
    const validData: any = {};
    if (validation.data.fullName !== undefined) validData.fullName = validation.data.fullName;
    if (validation.data.bio !== undefined) validData.bio = validation.data.bio;
    if (validation.data.avatar !== undefined) validData.avatar = validation.data.avatar;

    // Update user
    await db.collection('users').updateOne(
      { _id: userObjectId },
      { 
        $set: { 
          ...validData,
          updatedAt: new Date()
        } 
      }
    );

    // Fetch updated user to return
    const updatedUser = await db.collection('users').findOne({ _id: userObjectId });

    return NextResponse.json(successResponse({ user: {
      userId: updatedUser!._id.toString(),
      email: updatedUser!.email,
      username: updatedUser!.username,
      fullName: updatedUser!.fullName,
      role: updatedUser!.role,
      bio: updatedUser!.bio,
      avatar: updatedUser!.avatar,
    } }, 'Profile updated successfully'));
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(errorResponse('Failed to update profile'), { status: 500 });
  }
}
