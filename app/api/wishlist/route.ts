import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

// GET: Fetch the user's wishlist mapping (productId -> true)
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('sdc_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({});
    }

    const payload = verifyToken(sessionCookie.value);
    if (!payload) {
      return NextResponse.json({});
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: payload.userId },
      select: { productId: true }
    });

    const mapping: Record<string, boolean> = {};
    for (const item of items) {
      mapping[item.productId] = true;
    }

    return NextResponse.json(mapping);
  } catch (error: any) {
    console.error('Fetch wishlist API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred fetching the wishlist' }, { status: 500 });
  }
}

// POST: Add, remove, or toggle a product in the user's wishlist
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

    const { productId, action = 'toggle' } = body;
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid productId' }, { status: 400 });
    }

    // Check if the product exists in the DB
    const productExists = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!productExists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const userId = payload.userId;

    // Check current wishlist item status
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    if (action === 'remove' || (action === 'toggle' && existingItem)) {
      if (existingItem) {
        await prisma.wishlistItem.delete({
          where: {
            userId_productId: { userId, productId }
          }
        });
      }
    } else if (action === 'add' || (action === 'toggle' && !existingItem)) {
      if (!existingItem) {
        await prisma.wishlistItem.create({
          data: { userId, productId }
        });
      }
    }

    // Retrieve the updated wishlist items mapping
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true }
    });

    const mapping: Record<string, boolean> = {};
    for (const item of items) {
      mapping[item.productId] = true;
    }

    return NextResponse.json(mapping);
  } catch (error: any) {
    console.error('Modify wishlist API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred updating the wishlist' }, { status: 500 });
  }
}
