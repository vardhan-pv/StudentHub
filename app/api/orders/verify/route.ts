import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import crypto from 'crypto';
import { z } from 'zod';

const verifySchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = verifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Invalid payment data'),
        { status: 400 }
      );
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = validation.data;

    // Verify signature
    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY || '')
      .update(message)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return NextResponse.json(
        errorResponse('Invalid payment signature'),
        { status: 400 }
      );
    }

    // Update order in database
    const { db } = await connectToDatabase();

    const result = await db.collection('orders').updateOne(
      { razorpayOrderId: razorpay_order_id },
      {
        $set: {
          status: 'completed',
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        errorResponse('Order not found'),
        { status: 404 }
      );
    }

    // Get order details
    const order = await db.collection('orders').findOne({
      razorpayOrderId: razorpay_order_id,
    });

    // Create notification for seller
    await db.collection('notifications').insertOne({
      userId: order.sellerId,
      type: 'sale',
      title: 'New Sale',
      message: `${order.buyerUsername} purchased "${order.projectTitle}" for ₹${order.price}`,
      relatedId: order._id,
      relatedType: 'order',
      read: false,
      createdAt: new Date(),
    });

    // Increment project downloads
    await db.collection('projects').updateOne(
      { _id: order.projectId },
      { $inc: { downloads: 0 } }
    );

    return NextResponse.json(
      successResponse(
        {
          orderId: order._id,
          status: 'completed',
          message: 'Payment verified successfully',
        },
        'Payment verified'
      )
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      errorResponse('Failed to verify payment'),
      { status: 500 }
    );
  }
}
