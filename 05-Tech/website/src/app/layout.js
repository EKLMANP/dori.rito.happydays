import './globals.css';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BRAND } from '@/lib/constants';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <head>
        {/* Google Analytics 4 */}
        {GA_ID && (
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
      </head>
      <body>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
