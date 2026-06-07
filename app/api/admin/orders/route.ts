import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
type AdminOrderStatus = (typeof ORDER_STATUSES)[number];

const isAdminOrderStatus = (value: unknown): value is AdminOrderStatus => {
  return typeof value === 'string' && ORDER_STATUSES.includes(value as AdminOrderStatus);
};

const orderInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  },
  address: true,
  items: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          imageUrl: true
        }
      }
    }
  }
} as const;

// GET: Fetch all purchased orders for admin review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : undefined;

    const orders = await prisma.order.findMany({
      where: status && status !== 'ALL' && isAdminOrderStatus(status) ? { status } : undefined,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      ...(Number.isFinite(limit) && limit && limit > 0 ? { take: limit } : {})
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch admin orders API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred fetching orders' }, { status: 500 });
  }
}

// PATCH: Update order status or tracking details
export async function PATCH(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { orderId, status, shippingLink } = body;
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const updateData: any = {};

    if (status !== undefined) {
      if (!isAdminOrderStatus(status)) {
        return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
      }
      updateData.status = status;
    }

    if (shippingLink !== undefined) {
      if (shippingLink !== null && typeof shippingLink !== 'string') {
        return NextResponse.json({ error: 'Invalid shippingLink' }, { status: 400 });
      }
      updateData.shippingLink = shippingLink;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: orderInclude
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('Update admin order API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred updating the order' }, { status: 500 });
  }
}
