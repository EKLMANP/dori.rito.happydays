import { getLatestPosts } from '@/lib/ghost';
import { localBusinessSchema, faqSchema } from '@/lib/schema';
import { BRAND, FAQS, PRICING_PLANS, TESTIMONIALS } from '@/lib/constants';
import NewsletterCTA from '@/components/NewsletterCTA';
import FAQSection from '@/components/FAQSection';
import BlogCard from '@/components/BlogCard';
import Link from 'next/link';

export const metadata = {
  title: `${BRAND.nameShort} | KPA 認證正向訓犬師`,
  description: BRAND.description,
  alternates: { canonical: '/' },
};

export const revalidate = 60;

export default async function HomePage() {
  const latestPosts = await getLatestPosts(3);
  const jsonLd = [localBusinessSchema(), faqSchema(FAQS)];

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* ────────── Hero Section ────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden hero-bg bg-paw-texture">
        <div className="absolute top-20 left-10 text-orange-200 opacity-20 rotate-12 hidden lg:block animate-float pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 13c-3.3 0-6-2.7-6-6 0-1.7.7-3.2 1.8-4.2l.2-.2c1.1-1 2.5-1.6 4-1.6s2.9.6 4 1.6l.2.2c1.1 1 1.8 2.5 1.8 4.2 0 3.3-2.7 6-6 6zM5 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm14 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
          </svg>
        </div>

        <div className="absolute inset-0 md:hidden pointer-events-none">
          <img src="https://iili.io/qfrfmxf.jpg" className="w-full h-full object-cover" alt="Mobile Background" />
          <div className="absolute inset-0 bg-white/75" />
        </div>

        <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-2 items-center gap-10 py-16 relative z-10">
          <div className="order-1 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="bg-orange-100 text-brand-orange px-6 py-2 rounded-full inline-block font-black mb-10 tracking-widest text-sm sm:text-base shadow-sm">
              以科學為基礎・以正向為核心 🐾
            </div>

            <h1 className="flex flex-col gap-3 md:gap-5 mb-10">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">終於，你和你的</span>
              <span className="text-5xl sm:text-6xl lg:text-7xl font-black text-brand-orange bg-orange-50/80 px-4 py-1 rounded-2xl w-fit self-center md:self-start shadow-sm">敏感狗狗</span>
              <span className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 whitespace-nowrap tracking-tight">也可以安心散步，快樂相處了</span>
            </h1>

            <div className="text-gray-600 text-lg md:text-xl mb-12 max-w-lg leading-relaxed font-medium">
              不用再自己亂猜<br />
              給你狗狗「真正適合」的一對一專業訓練指導
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 w-full">
              <a href="#analysis-section" className="btn-orange text-white px-10 py-3.5 md:px-12 md:py-5 rounded-full font-black shadow-xl text-base md:text-lg tracking-wide w-fit mx-auto md:mx-0 text-center transition-all">
                立即預約課程
              </a>
            </div>
          </div>

          <div className="hidden md:flex relative justify-center items-center h-full order-2">
            <div className="relative">
              <img src="https://iili.io/qfrfmxf.jpg"
                alt="Eric & Pennee 與狗狗的親密互動"
                className="rounded-[50px] shadow-2xl object-cover w-full max-w-md md:max-w-xl h-[400px] md:h-[600px] border-8 border-white" />

              <div className="absolute bottom-10 -left-6 md:-left-16 bg-white p-6 rounded-[32px] shadow-2xl flex items-center gap-4 z-20 border border-orange-50 animate-float pointer-events-none">
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-inner">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div className="whitespace-nowrap">
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">專業・正向・充滿樂趣</div>
                  <div className="text-xl font-black text-gray-800 tracking-tight">100% 無恐懼訓練</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <svg className="wave-divider" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0,64L48,64C96,64,192,64,288,58.7C384,53,480,43,576,42.7C672,43,768,53,864,64C960,75,1056,85,1152,85.3C1248,85,1344,75,1392,69.3L1440,64L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z" />
        </svg>
      </section>

      {/* ────────── 分析痛點區塊 (Pain Point) ────────── */}
      <section id="analysis-section" className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">你已經試過很多方法了，<br className="hidden md:block" />為什麼還是沒用？</h2>
              <div className="w-24 h-1.5 bg-orange-400 mx-auto mt-6 rounded-full shadow-sm" />
            </div>

            <div className="space-y-8 text-lg md:text-xl text-slate-600 leading-relaxed text-left">
              <p className="font-black text-slate-800 text-2xl md:text-3xl mb-10 text-center">不是因為你不夠努力。</p>
              <p>而是那些方法，<span className="text-orange-600 font-black">根本不是為你的狗設計的</span>。</p>
              <p>你可能看過影片、試過各種練習，但如果沒有人認真看過你家狗的<span className="border-b-4 border-orange-100 font-bold">日常作息、過去經歷、品種特性、還有牠現在的情緒狀態</span>，問題的根源就永遠找不到。</p>

              <div className="bg-orange-50 p-8 rounded-[40px] border-l-8 border-orange-400 my-10">
                <p className="font-black text-slate-900 mb-4">訓練卡關，不是你的錯。是資訊不夠貼近你們的狀況。</p>
                <p>這就是為什麼這堂線上「課程」跟你試過的那些方法不一樣。</p>
              </div>

              <p>這不是一堂線上分享會，而是先做<span className="text-slate-900 font-black underline decoration-orange-200 decoration-4">完整的行為評估</span>，再給你一份<span className="text-slate-900 font-black underline decoration-orange-200 decoration-4">專屬計畫</span>——讓你知道現在的問題是什麼、為什麼會發生、以及接下來該怎麼做。</p>
              <p className="font-black text-slate-800 pt-6">不會給你「回家多練習」這種籠統的回答，而是真正搞清楚方向。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── 期待改變與方案區 (Pricing) ────────── */}
      <section id="session-section" className="py-24 bg-orange-50/50 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">✨ 你可以期待的改變</h2>
              <p className="text-gray-500 mt-4 text-lg">完成這堂課程後，你會明顯感受到：</p>
              <div className="w-24 h-1.5 bg-orange-400 mx-auto mt-6 rounded-full shadow-sm" />
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[60px] shadow-xl border border-orange-100 relative">
              <div className="absolute -top-5 right-10 bg-slate-900 text-white px-8 py-2 rounded-full font-black shadow-lg">
                60 分鐘線上 1 對 1 線上課程
              </div>

              <div className="space-y-10">
                {[
                  { title: '不再被狗狗的情緒牽著走', desc: '知道牠為什麼激動，也知道該怎麼做' },
                  { title: '面對爆衝、吠叫，有一套「真的做得到」的方法', desc: '不是理論，是你每天都用得上的實戰技巧' },
                  { title: '開始看懂狗狗的訊號', desc: '不再猜、不再亂試，減少挫折感' },
                  { title: '和狗狗的關係變得更穩定、更有安全感', desc: '不是壓制，而是真正的信任建立' },
                  { title: '你會更有自信', desc: '因為你知道——你在正確的軌道上努力' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <span className="text-orange-500 text-2xl flex-shrink-0 mt-1 font-bold">✔</span>
                    <div>
                      <h4 className="text-xl md:text-2xl font-black text-slate-800 mb-2">{item.title}</h4>
                      <p className="text-slate-600 leading-relaxed text-lg">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 pt-10 border-t border-orange-100 text-center">
                <p className="text-xl md:text-2xl font-black text-slate-800 mb-12 leading-relaxed">
                  如果你已經試過很多方法卻沒用，<br />
                  這次，我會讓你知道<span className="text-orange-600">「問題到底出在哪」</span>。
                </p>

                {/* 兩方案定價卡 */}
                <div className="grid md:grid-cols-2 gap-8 mt-12 text-left">
                  {/* 方案 1: 單次 */}
                  <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-200 flex flex-col hover:border-orange-200 transition-all">
                    <div className="mb-6">
                      <h5 className="text-2xl font-black text-slate-900 mb-2">{PRICING_PLANS[0].emoji} {PRICING_PLANS[0].name}</h5>
                      <div className="text-2xl font-black text-orange-500">👉 單次線上課程 ${PRICING_PLANS[0].price.toLocaleString()}</div>
                    </div>
                    <ul className="space-y-3 text-slate-600 font-bold flex-grow">
                      {PRICING_PLANS[0].features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2"><span className="text-orange-500">✔</span> {f}</li>
                      ))}
                    </ul>
                    <Link href={`/booking?service=${PRICING_PLANS[0].id}`} className="mt-8 bg-slate-800 text-white py-4 rounded-full font-black text-center hover:bg-slate-900 transition-all block">
                      立即預約課程
                    </Link>
                  </div>

                  {/* 方案 2: 突破成長 */}
                  <div className="bg-orange-50 p-8 rounded-[40px] border-4 border-orange-400 flex flex-col relative scale-100 md:scale-105 shadow-2xl z-10">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-8 py-1 rounded-full font-black text-base uppercase tracking-widest shadow-lg text-center">
                      {PRICING_PLANS[1].discount}
                    </div>
                    <div className="mb-6">
                      <h5 className="text-2xl font-black text-slate-900 mb-1">{PRICING_PLANS[1].emoji} {PRICING_PLANS[1].name}</h5>
                      <p className="text-orange-600 font-bold text-sm mb-2">{PRICING_PLANS[1].subtitle}</p>
                      <div className="flex items-end gap-3 justify-start">
                        <div className="text-3xl font-black text-orange-600">${PRICING_PLANS[1].price.toLocaleString()}</div>
                        <div className="text-lg text-gray-400 line-through mb-1">${PRICING_PLANS[1].originalPrice.toLocaleString()}</div>
                      </div>
                    </div>
                    <p className="text-orange-700 font-black text-sm mb-4 bg-orange-100/50 p-3 rounded-xl italic">「這不只是上課，是陪你一路做到改變。」</p>
                    <ul className="space-y-3 text-slate-700 font-bold flex-grow">
                      {PRICING_PLANS[1].features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2"><span className="text-orange-600">✔</span> {f}</li>
                      ))}
                      <li className="flex items-center gap-2 text-orange-600 font-black pt-2 border-t border-orange-200 mt-2">
                        <span>🎁</span> {PRICING_PLANS[1].bonus}
                      </li>
                    </ul>
                    <Link href={`/booking?service=${PRICING_PLANS[1].id}`} className="mt-8 btn-orange text-white py-4 rounded-full font-black text-center shadow-lg block">
                      立即預約課程
                    </Link>
                  </div>
                </div>

                {/* 課程安心保證 */}
                <div className="mt-20 p-8 md:p-12 rounded-[50px] bg-slate-50 border-2 border-slate-200 relative text-left">
                  <div className="absolute -top-5 left-8 bg-white border-2 border-slate-200 px-6 py-1 rounded-full font-black text-slate-700 text-sm">課程安心保證 🛡️</div>
                  <div className="space-y-6">
                    <p className="text-xl md:text-2xl font-black text-slate-800 leading-relaxed">如果 60 分鐘課程後，你還是沒有解開疑惑，<br className="hidden md:block" />或對下一步感到迷惘——</p>
                    <p className="text-slate-600 text-lg leading-relaxed">你可以繼續提問，我們會陪你把每一個問題講清楚、說明到你懂為止。<br className="hidden md:block" />我們不會讓你帶著疑問離開，而是陪你和毛孩一起做到：</p>
                    <div className="grid md:grid-cols-3 gap-6 pt-4">
                      <div className="flex items-center gap-3 text-slate-800 font-black">
                        <span className="text-orange-500 text-xl">✔</span> 更清楚問題在哪
                      </div>
                      <div className="flex items-center gap-3 text-slate-800 font-black">
                        <span className="text-orange-500 text-xl">✔</span> 更有信心面對狗狗
                      </div>
                      <div className="flex items-center gap-3 text-slate-800 font-black">
                        <span className="text-orange-500 text-xl">✔</span> 知道下一步該怎麼做
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── 課程流程說明 (Course Flow) ────────── */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-16">課程如何進行</h2>

          <div className="grid md:grid-cols-3 gap-12 relative max-w-6xl mx-auto">
            {[
              { step: '1', title: '老師會提前了解狗狗狀況', desc: '填寫諮詢問卷' },
              { step: '2', title: '進入預約頁面', desc: '選一個最適合你的時段\n並完成結帳' },
              { step: '3', title: '上課（線上見）', desc: '我們將在 Google Meet 上進行課程\n開啟與狗狗的新關係！' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center group relative">
                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center text-3xl font-black mb-8 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm z-10">
                  {item.step}
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-4">{item.title}</h4>
                <p className="text-slate-600 leading-relaxed px-4 text-sm md:text-base font-bold whitespace-pre-line">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── FAQ ────────── */}
      <FAQSection />

      {/* ────────── 客戶評價區 (Testimonials) ────────── */}
      <section className="py-24 bg-gray-50/50 overflow-hidden relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900">牠們都找回了平靜</h2>
            <div className="w-20 h-1.5 bg-orange-200 mx-auto mt-6 rounded-full" />
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-5 md:gap-8 md:grid md:grid-cols-3 md:overflow-visible items-stretch pb-10 px-2 lg:px-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="review-card flex-shrink-0 w-[85vw] snap-center bg-white p-6 md:p-8 rounded-[48px] border border-gray-100 flex flex-col h-auto md:w-full">
                <div className="min-h-[auto] md:min-h-[520px] flex flex-col text-gray-700">
                  <div className="flex text-brand-orange text-xl mb-4">
                    {'★'.repeat(t.rating)}
                  </div>
                  <p className="font-bold text-gray-800 text-xl mb-3">{t.title}</p>
                  <p className="text-gray-600 italic leading-relaxed text-sm lg:text-base mb-6" dangerouslySetInnerHTML={{ __html: t.text }} />
                </div>

                <div className="aspect-[3/4] rounded-[36px] overflow-hidden shadow-inner mb-6 flex-shrink-0">
                  <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                </div>

                <div className="mt-auto border-t border-gray-200 pt-6">
                  <div className="font-black text-lg text-gray-900">{t.name} ❤️</div>
                  <div className="text-xs text-brand-orange font-bold uppercase mt-1 tracking-wider">{t.tag}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3 mt-4 md:hidden">
            <div className="w-10 h-2.5 rounded-full bg-orange-500 shadow-sm" />
            <div className="w-2.5 h-2.5 rounded-full bg-orange-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-orange-200" />
          </div>
        </div>
      </section>

      {/* ────────── 為什麼選擇我們 (Why Choose Us) ────────── */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <h3 className="text-brand-orange font-black tracking-widest mb-3 uppercase text-sm">Our Philosophy</h3>
          <h2 className="text-3xl md:text-5xl font-black mb-16 text-gray-900">為什麼選擇我們？</h2>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { emoji: '🔬', title: '科學實證', desc: '運用動物行為學與心理學，絕不採取過時的處罰與高壓手段，讓狗狗在安全感中學習。' },
              { emoji: '🧡', title: '正向訓練', desc: '以獎勵取代懲罰，增強狗狗的自信心與對環境的信任，讓訓練變成一種愉快的親子遊戲。' },
              { emoji: '🤝', title: '雙向溝通', desc: '不僅訓練狗狗，更教導飼主觀察狗狗的「安定訊號」，讓你們從此能夠讀懂彼此的心聲。' },
            ].map((item, i) => (
              <div key={i} className="p-10 rounded-[50px] bg-gray-50 hover:shadow-xl transition-all border border-orange-50 group text-center review-card">
                <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300">{item.emoji}</div>
                <h4 className="text-2xl font-black mb-4 text-gray-900">{item.title}</h4>
                <p className="text-gray-600 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── 訓練理念區 / 關於我們 (About) ────────── */}
      <section id="about-section" className="py-24 bg-gray-50 relative">
        <div className="absolute top-10 left-10 text-9xl font-black hidden lg:block uppercase text-gray-100 tracking-widest select-none pointer-events-none">
          BOND
        </div>

        <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-16 items-start">
          <div className="md:col-span-5 relative">
            <div className="relative">
              <img src="https://i.postimg.cc/cCmVvZ17/Gemini-Generated-Image-elzircelzircelzi-(1).jpg"
                alt="Coach" className="w-full h-auto rounded-[60px] shadow-2xl relative z-10 border-8 border-white" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-orange-100 rounded-full -z-10 animate-float opacity-50 pointer-events-none" />
            </div>

            <div className="mt-12 hidden md:flex flex-wrap justify-start gap-10">
              <img src="https://i.postimg.cc/zGJwTcTg/CATCH-CCDT-Seal-Blue-300.png" className="h-20 transition-transform hover:scale-105" alt="CATCH CCDT" />
              <img src="https://i.postimg.cc/P52WyQM8/kpa-badge-ctp-2012-10-01-300x194.png" className="h-20 transition-transform hover:scale-105" alt="KPA CTP" />
            </div>
          </div>

          <div className="md:col-span-7 relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-12 leading-snug text-gray-900 text-left">
              <span className="inline-block border-b-8 border-orange-100 rounded-lg">訓練狗狗的聰明之道</span><br />
              從此改變您與牠的生活...
            </h2>

            <div className="space-y-6 text-gray-700 text-lg leading-relaxed max-w-2xl text-left">
              <p>我們是 <span className="font-bold text-gray-900">Eric & Pennee</span>，美國認證的專業犬隻訓練師，也是多莉與多姿的家人。</p>
              <p>我們很清楚，養一隻敏感、容易激動的狗狗是什麼感覺。吠叫、爆衝、焦慮、外出壓力大……那種無力感，我們也經歷過。</p>
              <p className="font-bold text-brand-orange italic underline decoration-orange-200 decoration-4 -underline-offset-2">養狗，應該是幸福的，而不是每天都在崩潰邊緣。</p>

              <div className="bg-orange-50/50 p-8 rounded-[48px] border-2 border-orange-100 shadow-sm mt-10">
                <p className="font-black mb-6 text-gray-900 text-xl flex items-center gap-2">
                  <span className="text-brand-orange">🐾</span> 我們會陪你一起改善：
                </p>
                <ul className="grid sm:grid-cols-2 gap-y-4 gap-x-8 text-base font-bold text-gray-800">
                  <li className="flex items-center gap-3"><span className="text-brand-orange">●</span> 對人對狗激動/吠叫</li>
                  <li className="flex items-center gap-3"><span className="text-brand-orange">●</span> 護食/分離焦慮/啃咬</li>
                  <li className="flex items-center gap-3"><span className="text-brand-orange">●</span> 散步拉扯/無法專心</li>
                  <li className="flex items-center gap-3"><span className="text-brand-orange">●</span> 害怕環境/容易受驚</li>
                  <li className="flex items-center gap-3"><span className="text-brand-orange">●</span> 無法獨處/黏人焦慮</li>
                  <li className="flex items-center gap-3 text-brand-orange font-black"><span>🐾</span> 重新找回信任連結</li>
                </ul>
              </div>

              <p className="mt-10 font-medium">我們追求的，不只是「乖狗狗」。而是更穩定的情緒、更安心的生活，還有你們之間真正的信任與連結。</p>
            </div>

            <div className="mt-14 flex flex-col items-center md:items-start">
              <div className="signature text-4xl md:text-5xl text-gray-800">Eric & Pennee</div>
              <div className="text-sm text-gray-400 mt-3 uppercase tracking-[0.2em] font-black">Certified Professional Trainers</div>

              <div className="mt-10 flex md:hidden gap-8">
                <img src="https://i.postimg.cc/zGJwTcTg/CATCH-CCDT-Seal-Blue-300.png" className="h-16" alt="CATCH CCDT" />
                <img src="https://i.postimg.cc/P52WyQM8/kpa-badge-ctp-2012-10-01-300x194.png" className="h-16" alt="KPA CTP" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── 呼籲行動 (CTA) ────────── */}
      <section className="py-24 bg-primary relative overflow-hidden text-white text-center px-6">
        <div className="absolute -bottom-20 -right-20 opacity-10 rotate-12 animate-float pointer-events-none">
          <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
          </svg>
        </div>

        <div className="container mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-10 leading-tight text-white">準備好與您的狗狗<br />開啟新關係了嗎？</h2>
          <p className="text-xl md:text-2xl mb-14 opacity-90 max-w-2xl mx-auto text-center font-medium">現在預約專業行為諮詢，讓我們協助您找回輕鬆自在的相處時光。</p>
          <Link href="/booking" className="inline-block bg-white text-brand-orange px-16 py-6 rounded-full font-black text-2xl shadow-2xl hover:bg-orange-50 hover:-translate-y-2 transition-all text-center">
            立即預約課程 ➔
          </Link>
        </div>
      </section>

      {/* ────────── Latest Blog Posts ────────── */}
      {latestPosts.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center mb-12 flex-wrap gap-4">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900">狗狗行為文章</h2>
              <Link href="/blog" className="px-6 py-2 rounded-full font-bold border-2 border-orange-200 text-gray-600 hover:bg-orange-50 hover:text-brand-orange transition-colors">查看所有文章 →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestPosts.map((post) => (
                <div key={post.id} className="review-card">
                  <BlogCard post={post} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ────────── Newsletter CTA ────────── */}
      <NewsletterCTA variant="full" />
    </>
  );
}
