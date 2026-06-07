import { NextRequest, NextResponse } from 'next/server';
import { getCarousels, saveCarousel, deleteCarousel } from '@/lib/storeService.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const carousels = await getCarousels();
    return NextResponse.json(carousels);
  } catch (error: any) {
    console.error("API GET carousels error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch carousels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.title) {
      return NextResponse.json({ error: 'Missing title field' }, { status: 400 });
    }
    const carousel = await saveCarousel(body);
    return NextResponse.json(carousel);
  } catch (error: any) {
    console.error("API POST carousels error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to save carousel' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing carousel id' }, { status: 400 });
    }
    await deleteCarousel(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE carousels error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete carousel' },
      { status: 500 }
    );
  }
}
