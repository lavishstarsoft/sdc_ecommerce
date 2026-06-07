import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

// GET: Retrieve user's saved addresses
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

    const addresses = await prisma.address.findMany({
      where: { userId: payload.userId, isDeleted: false },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(addresses);
  } catch (error: any) {
    console.error('Fetch addresses API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred fetching addresses' }, { status: 500 });
  }
}

// POST: Add new address
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

    const { name, phone, street, city, state, pincode, landmark, country = 'India', type = 'Home', isDefault = false } = body;
    if (!name || !phone || !street || !city || !state || !pincode) {
      return NextResponse.json({ error: 'Missing required address fields' }, { status: 400 });
    }

    const userId = payload.userId;

    // Use transaction if setting as default address to reset others
    const result = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false }
        });
      }

      // Check if user has no address, make this default automatically
      const addressCount = await tx.address.count({ where: { userId, isDeleted: false } });
      const makeDefault = addressCount === 0 ? true : isDefault;

      const newAddress = await tx.address.create({
        data: {
          userId,
          name,
          phone,
          street,
          city,
          state,
          pincode,
          landmark,
          country,
          type,
          isDefault: makeDefault
        }
      });

      return newAddress;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Create address API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred creating address' }, { status: 500 });
  }
}

// DELETE: Remove address
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
    const addressId = url.searchParams.get('id');
    if (!addressId) {
      return NextResponse.json({ error: 'Missing address ID' }, { status: 400 });
    }

    const userId = payload.userId;

    // Check ownership
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId, isDeleted: false }
    });
    if (!address) {
      return NextResponse.json({ error: 'Address not found or unauthorized' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Soft-delete the address
      await tx.address.update({
        where: { id: addressId },
        data: { isDeleted: true, isDefault: false }
      });

      // If we deleted the default address, set another address as default
      if (address.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId, isDeleted: false },
          orderBy: { createdAt: 'desc' }
        });
        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true }
          });
        }
      }
    });

    const addresses = await prisma.address.findMany({
      where: { userId, isDeleted: false },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(addresses);
  } catch (error: any) {
    console.error('Delete address API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred deleting address' }, { status: 500 });
  }
}
