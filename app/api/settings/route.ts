import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/storeService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("API GET settings error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.siteName) {
      return NextResponse.json({ error: 'Missing siteName' }, { status: 400 });
    }
    const settings = await saveSettings({
      siteName: body.siteName,
      logoUrl: body.logoUrl || '',
      metaDescription: body.metaDescription || '',
      googleAnalyticsId: body.googleAnalyticsId || '',
      googleSearchConsoleId: body.googleSearchConsoleId || '',
      googleAdsId: body.googleAdsId || '',
      newsletterTitle: body.newsletterTitle || '',
      newsletterSubtitle: body.newsletterSubtitle || '',
      newsletterPlaceholder: body.newsletterPlaceholder || '',
      newsletterButtonText: body.newsletterButtonText || '',
      newsletterUnsubscribe: body.newsletterUnsubscribe || '',
      newsletterPrivacyText: body.newsletterPrivacyText || ''
    });
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("API POST settings error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}
