import './globals.css';
import Script from 'next/script';
import { BRAND } from '@/lib/constants';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com'),
  title: {
    default: `${BRAND.nameShort} | 專業正向訓犬服務`,
    template: `%s | ${BRAND.nameShort}`,
  },
  description: BRAND.description,
  keywords: ['正向訓犬', '訓犬師', 'KPA認證', '分離焦慮', '幼犬訓練', '反應性犬', '暴衝', '吠叫', '台北訓犬'],
  authors: [{ name: BRAND.nameShort }],
  creator: BRAND.nameShort,
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    siteName: BRAND.name,
    title: `${BRAND.nameShort} | 專業正向訓犬服務`,
    description: BRAND.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.nameShort} | 專業正向訓犬服務`,
    description: BRAND.description,
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <head>
        {/* Google Tag Manager — unified tag management */}
        {GTM_ID && (
          <Script id="gtm-init" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `}
          </Script>
        )}

        {/* Google Analytics 4 (fallback if no GTM) */}
        {!GTM_ID && GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        {/* Facebook Pixel — enable by setting NEXT_PUBLIC_FB_PIXEL_ID */}
        {/* Mixpanel — enable by setting NEXT_PUBLIC_MIXPANEL_TOKEN */}
      </head>
      <body>
        {/* GTM noscript fallback */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        {children}
      </body>
    </html>
  );
}
