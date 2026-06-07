import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const menuOnly = searchParams.get('menuOnly') === 'true';

    const whereClause = menuOnly ? { showInMenu: true } : {};

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { displayOrder: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("API GET categories error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, showInMenu, displayOrder } = body;

    if (!name) {
      return NextResponse.json({ error: 'Missing category name' }, { status: 400 });
    }

    const orderValue = typeof displayOrder === 'number' ? displayOrder : parseInt(displayOrder || '0');

    let category;
    if (id) {
      // Update
      category = await prisma.category.update({
        where: { id },
        data: {
          name,
          showInMenu: !!showInMenu,
          displayOrder: isNaN(orderValue) ? 0 : orderValue
        }
      });
    } else {
      // Create
      category = await prisma.category.create({
        data: {
          name,
          showInMenu: !!showInMenu,
          displayOrder: isNaN(orderValue) ? 0 : orderValue
        }
      });
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("API POST categories error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to save category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
    }
    await prisma.category.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE categories error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
