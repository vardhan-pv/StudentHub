import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { db } = await connectToDatabase();
    
    // Find user by username
    const user = await db.collection('users').findOne(
      { username },
      { projection: { password: 0, email: 0, role: 0, updatedAt: 0 } }
    );

    if (!user) {
      return NextResponse.json(
        errorResponse('User not found'),
        { status: 404 }
      );
    }

    // Find user's active projects
    const projects = await db.collection('projects')
      .find({ sellerUsername: username })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      successResponse({
        user: {
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          createdAt: user.createdAt,
        },
        projects,
      })
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch profile'),
      { status: 500 }
    );
  }
}
