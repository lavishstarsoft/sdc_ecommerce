import { NextRequest, NextResponse } from 'next/server';
import { getBanners, saveBanner, deleteBanner } from '@/lib/storeService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const banners = await getBanners();
    return NextResponse.json(banners);
  } catch (error: any) {
    console.error("API GET banners error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.image_url) {
      return NextResponse.json({ error: 'Missing image_url' }, { status: 400 });
    }
    const banner = await saveBanner(body);
    return NextResponse.json(banner);
  } catch (error: any) {
    console.error("API POST banners error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to save banner' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing banner id' }, { status: 400 });
    }
    await deleteBanner(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE banners error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
