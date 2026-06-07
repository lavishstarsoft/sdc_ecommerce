import { NextResponse } from 'next/server';
import { isPrismaConfigured } from '@/lib/store-types';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isPrismaConfigured()) {
    return NextResponse.json({
      ok: false,
      database: 'not_configured',
      message:
        'DATABASE_URL is not set on the server. Add it in Vercel → Settings → Environment Variables, then redeploy.',
    });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    const [productCount, bannerCount, categoryCount] = await Promise.all([
      prisma.product.count(),
      prisma.banner.count(),
      prisma.category.count(),
    ]);

    return NextResponse.json({
      ok: true,
      database: 'connected',
      counts: {
        products: productCount,
        banners: bannerCount,
        categories: categoryCount,
      },
    });
  } catch (error: any) {
    console.error('Health check DB error:', error);
    return NextResponse.json(
      {
        ok: false,
        database: 'error',
        message: error?.message || 'Database connection failed',
        hint: 'Use Supabase Session pooler (port 5432). Run: npm run db:push',
      },
      { status: 503 }
    );
  }
}
