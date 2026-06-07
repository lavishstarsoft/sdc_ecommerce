import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isPrismaConfigured, getProducts } from '@/lib/storeService.server';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    let product = null;
    
    if (isPrismaConfigured()) {
      try {
        product = await prisma.product.findUnique({
          where: { id }
        });
      } catch (err) {
        console.warn("Prisma findUnique failed, falling back to local store:", err);
      }
    }
    
    if (!product) {
      const products = await getProducts();
      product = products.find(p => p.id === id) || null;
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const p = product as any;
    const mappedProduct = {
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      mrp: p.mrp || null,
      image_url: p.imageUrl || p.image_url || null,
      category: p.category,
      brand: p.brand || "Saidurga Premium",
      warranty: p.warranty || "1 Year SDC Store warranty card",
      dimensions: p.dimensions || "45 x 30 x 12 cm",
      weight: p.weight || "1.8 Kilograms",
      specs_layout: p.specsLayout || p.specs_layout || "TABLE",
      specs_content: p.specsContent || p.specs_content || "",
      image_url_2: p.imageUrl2 || p.image_url_2 || null,
      image_url_3: p.imageUrl3 || p.image_url_3 || null,
      gallery_images: p.galleryImages || p.gallery_images || [],
      offers: p.offers || null,
      free_delivery: p.freeDelivery ?? p.free_delivery ?? true,
      delivery_charge: p.deliveryCharge ?? p.delivery_charge ?? 0,
      delivery_slabs: p.deliverySlabs ?? p.delivery_slabs ?? [],
      return_policy: p.returnPolicy || p.return_policy || null,
      allow_cod: p.allowCOD ?? p.allow_cod ?? true,
      allow_online: p.allowOnline ?? p.allow_online ?? true,
    };

    return NextResponse.json(mappedProduct);
  } catch (error: any) {
    console.error("API GET single product error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
