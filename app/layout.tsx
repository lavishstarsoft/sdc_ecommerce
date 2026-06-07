import type { Metadata } from 'next';
import { getSettings } from '@/lib/storeService';
import Script from 'next/script';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings();
    const verification: any = {};
    if (settings.googleSearchConsoleId) {
      verification.google = settings.googleSearchConsoleId;
    }
    return {
      title: settings.siteName || 'Saidurga Computers',
      description: settings.metaDescription || 'Your trusted partner for all computer sales, services, and accessories.',
      verification,
    };
  } catch (error) {
    console.error("Failed to generate layout metadata:", error);
    return {
      title: 'Saidurga Computers',
      description: 'Your trusted partner for all computer sales, services, and accessories.',
    };
  }
}

export default async function RootLayout({children}: {children: React.ReactNode}) {
  let settings;
  try {
    settings = await getSettings();
  } catch (e) {
    console.error("Failed to load settings in RootLayout:", e);
  }

  return (
    <html lang="en">
      <head>
        {settings?.googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.googleAnalyticsId}');
              `}
            </Script>
          </>
        )}
        {settings?.googleAdsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAdsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-ads" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.googleAdsId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
