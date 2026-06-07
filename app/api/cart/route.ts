import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

// GET: Fetch user's cart items
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('sdc_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json([], { status: 401 });
    }

    const payload = verifyToken(sessionCookie.value);
    if (!payload) {
      return NextResponse.json([], { status: 401 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: payload.userId },
      include: { product: true },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(cartItems);
  } catch (error: any) {
    console.error('Fetch cart API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred fetching the cart' }, { status: 500 });
  }
}

// POST: Add to cart or update item quantity
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('sdc_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(sessionCookie.value);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { productId, quantity = 1, action = 'add' } = body;
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid productId' }, { status: 400 });
    }

    const productExists = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!productExists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const userId = payload.userId;

    if (action === 'update') {
      const targetQty = Number(quantity);
      if (targetQty <= 0) {
        await prisma.cartItem.delete({
          where: { userId_productId: { userId, productId } }
        });
      } else {
        await prisma.cartItem.upsert({
          where: { userId_productId: { userId, productId } },
          update: { quantity: targetQty },
          create: { userId, productId, quantity: targetQty }
        });
      }
    } else {
      // action = 'add'
      const addQty = Number(quantity);
      if (addQty <= 0) {
        await prisma.cartItem.deleteMany({
          where: { userId, productId }
        });
      } else {
        await prisma.cartItem.upsert({
          where: { userId_productId: { userId, productId } },
          update: { quantity: { increment: addQty } },
          create: { userId, productId, quantity: addQty }
        });
      }
    }

    const updatedCart = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(updatedCart);
  } catch (error: any) {
    console.error('Update cart API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred updating the cart' }, { status: 500 });
  }
}

// DELETE: Remove an item or clear cart
export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('sdc_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(sessionCookie.value);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const userId = payload.userId;

    if (productId) {
      // Delete single item
      await prisma.cartItem.deleteMany({
        where: { userId, productId }
      });
    } else {
      // Clear entire cart
      await prisma.cartItem.deleteMany({
        where: { userId }
      });
    }

    const updatedCart = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(updatedCart);
  } catch (error: any) {
    console.error('Delete cart API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred deleting cart items' }, { status: 500 });
  }
}
