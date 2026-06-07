import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear cookie
    response.cookies.delete('sdc_session');
    
    return response;
  } catch (error: any) {
    console.error('Logout API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during logout' }, { status: 500 });
  }
}
