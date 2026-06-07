import { NextRequest, NextResponse } from 'next/server';
import { getProducts, saveProduct, deleteProduct } from '@/lib/storeService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error: any) {
    console.error("API GET products error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.title || !body.price || !body.image_url || !body.category) {
      return NextResponse.json({ error: 'Missing required product fields' }, { status: 400 });
    }
    const product = await saveProduct(body);
    return NextResponse.json(product);
  } catch (error: any) {
    console.error("API POST products error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to save product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
    }
    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE products error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
