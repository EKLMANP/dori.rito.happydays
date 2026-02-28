import { BRAND } from '@/lib/constants';
import NewsletterCTA from '@/components/NewsletterCTA';

export const metadata = {
  title: `${BRAND.nameShort} | 官網即將上線`,
  description: "我們正在為您與敏感狗狗打造最棒的正向訓練資源，敬請期待！",
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden hero-bg bg-paw-texture py-20 px-6">
        {/* 背景裝飾 */}
        <div className="absolute top-20 left-10 text-orange-200 opacity-20 rotate-12 animate-float pointer-events-none hidden md:block">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 13c-3.3 0-6-2.7-6-6 0-1.7.7-3.2 1.8-4.2l.2-.2c1.1-1 2.5-1.6 4-1.6s2.9.6 4 1.6l.2.2c1.1 1 1.8 2.5 1.8 4.2 0 3.3-2.7 6-6 6zM5 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm14 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
          </svg>
        </div>

        <div className="container mx-auto max-w-3xl text-center relative z-10 flex flex-col items-center">

          {/* LOGO 顯示 */}
          <div className="mb-12">
            <img src="https://iili.io/qf6QsVe.png" alt="Dori & Rito Logo" className="h-20 md:h-28 grayscale opacity-90 mx-auto" />
          </div>

          <div className="bg-orange-100 text-brand-orange px-6 py-2 rounded-full inline-block font-black mb-10 tracking-widest text-sm shadow-sm">
            COMING SOON
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 leading-tight">
            Dori & Rito <br className="md:hidden" />官網即將上線
          </h1>

          <p className="text-gray-600 text-lg md:text-xl mb-16 leading-relaxed font-medium max-w-2xl">
            我們正在為您與您的敏感狗狗打造最棒的正向訓練資源與文章庫。<br />
            準備在一場無恐懼的學習旅程中，與狗狗重新找回平靜吧！
          </p>

          <div className="w-full bg-white/70 backdrop-blur-md p-8 md:p-12 rounded-[48px] shadow-sm border border-orange-50/50">
            <NewsletterCTA variant="inline" />
          </div>

          {/* Social Links */}
          <div className="mt-16 flex justify-center gap-6">
            <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-orange transition-colors font-bold">
              <img src="/images/ig-logo.png" alt="IG" className="w-6 h-6 grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
              追蹤我們的最新動態
            </a>
          </div>

        </div>
      </section>
    </>
  );
}
