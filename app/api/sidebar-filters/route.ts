import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('filterType');
    const enabledOnly = searchParams.get('enabledOnly') === 'true';

    const where: any = {};
    if (filterType) where.filterType = filterType;
    if (enabledOnly) where.isEnabled = true;

    const filters = await prisma.sidebarFilter.findMany({
      where,
      orderBy: { displayOrder: 'asc' }
    });
    return NextResponse.json(filters);
  } catch (error: any) {
    console.error("API GET sidebar-filters error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sidebar filters' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, filterType, label, config, isEnabled, displayOrder } = body;

    if (!filterType || !label) {
      return NextResponse.json({ error: 'Missing required fields: filterType, label' }, { status: 400 });
    }

    const orderValue = typeof displayOrder === 'number' ? displayOrder : parseInt(String(displayOrder || '0'));
    const enabledValue = !!isEnabled;

    let filter;
    if (id) {
      filter = await prisma.sidebarFilter.update({
        where: { id },
        data: {
          filterType,
          label,
          config: config ?? null,
          isEnabled: enabledValue,
          displayOrder: isNaN(orderValue) ? 0 : orderValue
        }
      });
    } else {
      filter = await prisma.sidebarFilter.create({
        data: {
          filterType,
          label,
          config: config ?? null,
          isEnabled: enabledValue,
          displayOrder: isNaN(orderValue) ? 0 : orderValue
        }
      });
    }

    return NextResponse.json(filter);
  } catch (error: any) {
    console.error("API POST sidebar-filters error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to save sidebar filter' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    await prisma.sidebarFilter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE sidebar-filters error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete sidebar filter' },
      { status: 500 }
    );
  }
}
