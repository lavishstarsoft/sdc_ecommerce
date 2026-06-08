import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Fetch all subscribers
export async function GET(request: NextRequest) {
  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(subscribers);
  } catch (error: any) {
    console.error('Fetch subscribers API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred fetching subscribers' }, { status: 500 });
  }
}

// DELETE: Delete a subscriber by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing subscriber id' }, { status: 400 });
    }

    await prisma.newsletterSubscriber.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Subscriber deleted successfully' });
  } catch (error: any) {
    console.error('Delete subscriber API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred deleting the subscriber' }, { status: 500 });
  }
}
