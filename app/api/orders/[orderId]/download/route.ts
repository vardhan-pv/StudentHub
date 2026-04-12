import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, validateAuthHeader } from '@/lib/api-response';
import { generateDownloadUrl } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const authHeader = request.headers.get('authorization');
    const { valid, token } = validateAuthHeader(authHeader || '');

    if (!valid) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    const tokenData = verifyToken(token!);
    if (!tokenData || typeof tokenData === 'string') {
      return NextResponse.json(
        errorResponse('Invalid token'),
        { status: 401 }
      );
    }

    const userId = (tokenData as any).userId;
    const { db } = await connectToDatabase();

    // Get order
    const order = await db.collection('orders').findOne({
      _id: orderId,
    });

    if (!order) {
      return NextResponse.json(
        errorResponse('Order not found'),
        { status: 404 }
      );
    }

    // Verify buyer
    if (order.buyerId.toString() !== userId) {
      return NextResponse.json(
        errorResponse('Forbidden'),
        { status: 403 }
      );
    }

    // Check if order is completed
    if (order.status !== 'completed') {
      return NextResponse.json(
        errorResponse('Order not completed'),
        { status: 400 }
      );
    }

    // Check download limit
    if (order.downloadCount >= order.maxDownloads) {
      return NextResponse.json(
        errorResponse('Download limit exceeded'),
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > order.expiresAt) {
      return NextResponse.json(
        errorResponse('Download link expired'),
        { status: 400 }
      );
    }

    // Get project
    const project = await db.collection('projects').findOne({
      _id: order.projectId,
    });

    if (!project) {
      return NextResponse.json(
        errorResponse('Project not found'),
        { status: 404 }
      );
    }

    // Generate signed URL
    const downloadUrl = await generateDownloadUrl(project.fileKey);

    // Increment download count
    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      {
        $inc: { downloadCount: 1 },
        $set: { updatedAt: new Date() },
      }
    );

    // Increment project downloads
    await db.collection('projects').updateOne(
      { _id: order.projectId },
      { $inc: { downloads: 1 } }
    );

    return NextResponse.json(
      successResponse(
        {
          downloadUrl,
          fileName: project.fileName,
          expiresIn: 3600, // 1 hour
        },
        'Download URL generated successfully'
      )
    );
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      errorResponse('Failed to generate download URL'),
      { status: 500 }
    );
  }
}
