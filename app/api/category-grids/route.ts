import { NextRequest, NextResponse } from 'next/server';
import { getCategoryGrids, saveCategoryGrid, deleteCategoryGrid } from '@/lib/storeService.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const grids = await getCategoryGrids();
    return NextResponse.json(grids);
  } catch (error: any) {
    console.error("API GET category grids error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch category grids' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.title || !body.items || !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Missing required category grid fields' }, { status: 400 });
    }
    const grid = await saveCategoryGrid(body);
    return NextResponse.json(grid);
  } catch (error: any) {
    console.error("API POST category grid error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to save category grid' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing category grid id' }, { status: 400 });
    }
    await deleteCategoryGrid(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE category grid error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category grid' },
      { status: 500 }
    );
  }
}
