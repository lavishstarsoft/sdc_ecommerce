import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        address: {
          select: {
            name: true,
            city: true,
            state: true,
            pincode: true,
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ valid: false, reason: 'Order not found' }, { status: 404 });
    }

    // Check if order is cancelled
    // Once order status is CANCELLED, the label validation fails
    if (order.status === 'CANCELLED') {
      return NextResponse.json({
        valid: false,
        orderId: order.id,
        status: order.status,
        reason: `This shipping label is inactive. The order has been cancelled.`
      });
    }

    // Otherwise, order is PENDING or PROCESSING (Ready to Ship)
    return NextResponse.json({
      valid: true,
      orderId: order.id,
      status: order.status,
      recipient: order.address.name,
      destination: `${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
      createdAt: order.createdAt,
    });
  } catch (error: any) {
    console.error('Validate order API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred validating the order' },
      { status: 500 }
    );
  }
}
