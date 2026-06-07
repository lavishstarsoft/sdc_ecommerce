import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/userAuth';
import { getDeliveryChargeForQuantity } from '@/lib/storeService';
// @ts-ignore
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

// GET: Retrieve user's order history
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

    const orders = await prisma.order.findMany({
      where: { userId: payload.userId },
      include: {
        address: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch orders API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred fetching orders' }, { status: 500 });
  }
}

// POST: Create order from cart
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

    const { addressId, paymentMethod = 'COD' } = body;
    if (!addressId) {
      return NextResponse.json({ error: 'Missing shipping address ID' }, { status: 400 });
    }

    const userId = payload.userId;

    // Verify address exists and belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId }
    });
    if (!address) {
      return NextResponse.json({ error: 'Invalid address select' }, { status: 400 });
    }

    // Get active cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }

    // Validate payment method compatibility with products
    if (paymentMethod === 'COD') {
      const hasRestricted = cartItems.some(item => !item.product.allowCOD);
      if (hasRestricted) {
        return NextResponse.json({ error: 'Cash on Delivery (COD) is not allowed for one or more items in your cart.' }, { status: 400 });
      }
    } else if (paymentMethod === 'ONLINE') {
      const hasRestricted = cartItems.some(item => !item.product.allowOnline);
      if (hasRestricted) {
        return NextResponse.json({ error: 'Online payment is not allowed for one or more items in your cart.' }, { status: 400 });
      }
    }

    // Calculate total amount including delivery charges
    const totalAmount = cartItems.reduce((total, item) => {
      const itemDeliveryCharge = getDeliveryChargeForQuantity(item.product as any, item.quantity);
      return total + ((item.product.price * item.quantity) + itemDeliveryCharge);
    }, 0);

    // Run order creation in transaction
    const finalOrder = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId,
          addressId,
          totalAmount,
          paymentMethod,
          paymentStatus: 'PENDING' // Set pending for both COD and ONLINE initially
        }
      });

      // Create order items
      await tx.orderItem.createMany({
        data: cartItems.map(item => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price
        }))
      });

      // Clear the user's cart
      await tx.cartItem.deleteMany({
        where: { userId }
      });

      return order;
    });

    // Fetch full order to return
    const detailedOrder = await prisma.order.findUnique({
      where: { id: finalOrder.id },
      include: {
        address: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (paymentMethod === 'ONLINE') {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!
        });

        const rpOrder = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // amount in paisa
          currency: 'INR',
          receipt: `receipt_order_${finalOrder.id}`
        });

        return NextResponse.json({
          ...detailedOrder,
          razorpayOrderId: rpOrder.id,
          razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        });
      } catch (rpErr: any) {
        console.error('Failed to create Razorpay order:', rpErr);
        // Rollback DB order creation if payment gateway fails
        await prisma.order.delete({ where: { id: finalOrder.id } });
        return NextResponse.json({ error: 'Failed to initialize online payment. Please try again.' }, { status: 500 });
      }
    }

    return NextResponse.json(detailedOrder);
  } catch (error: any) {
    console.error('Create order API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred creating order' }, { status: 500 });
  }
}
