import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('sdc_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const payload = verifyToken(sessionCookie.value);
    if (!payload) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name
      }
    });
  } catch (error) {
    console.error('Check current user API error:', error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
