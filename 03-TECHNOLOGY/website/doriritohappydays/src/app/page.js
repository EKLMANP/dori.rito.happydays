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

      {/* 為什麼選擇我們 */}
      <section className="py-24 bg-gray-50/50 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <h3 className="text-brand-orange font-black tracking-widest mb-3 uppercase text-sm">Our Philosophy</h3>
          <h2 className="text-3xl md:text-5xl font-black mb-16 text-gray-900">為什麼選擇我們？</h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-10 rounded-[50px] bg-white hover:shadow-xl transition-all border border-orange-50 group text-center review-card">
              <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300">🔬</div>
              <h4 className="text-2xl font-black mb-4 text-gray-900">科學實證</h4>
              <p className="text-gray-600 leading-relaxed font-medium">運用動物行為學與心理學，絕不採取過時的處罰與高壓手段，讓狗狗在安全感中學習。</p>
            </div>
            <div className="p-10 rounded-[50px] bg-white hover:shadow-xl transition-all border border-orange-50 group text-center review-card">
              <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300">🧡</div>
              <h4 className="text-2xl font-black mb-4 text-gray-900">正向訓練</h4>
              <p className="text-gray-600 leading-relaxed font-medium">以獎勵取代懲罰，增強狗狗的自信心與對環境的信任，讓訓練變成一種愉快的親子遊戲。</p>
            </div>
            <div className="p-10 rounded-[50px] bg-white hover:shadow-xl transition-all border border-orange-50 group text-center review-card">
              <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300">🤝</div>
              <h4 className="text-2xl font-black mb-4 text-gray-900">雙向溝通</h4>
              <p className="text-gray-600 leading-relaxed font-medium">不僅訓練狗狗，更教導飼主觀察狗狗的「安定訊號」，讓你們從此能夠讀懂彼此的心聲。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 訓練理念區 (Eric & Pennee) */}
      <section id="about-section" className="py-24 bg-white relative">
        <div className="absolute top-10 left-10 text-9xl font-black hidden lg:block uppercase text-gray-50 tracking-widest select-none pointer-events-none">
          BOND
        </div>

        <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-16 items-start">
          <div className="md:col-span-5 relative">
            <div className="relative">
              <img src="https://i.postimg.cc/cCmVvZ17/Gemini-Generated-Image-elzircelzircelzi-(1).jpg"
                alt="Coach" className="w-full h-auto rounded-[60px] shadow-2xl relative z-10 border-8 border-white" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-orange-100 rounded-full -z-10 animate-float opacity-50 pointer-events-none" />
            </div>

            {/* 桌機版顯示標章 */}
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
                  <li className="flex items-center gap-3 text-left"><span className="text-brand-orange">●</span> 對人對狗激動/吠叫</li>
                  <li className="flex items-center gap-3 text-left"><span className="text-brand-orange">●</span> 護食/分離焦慮/啃咬</li>
                  <li className="flex items-center gap-3 text-left"><span className="text-brand-orange">●</span> 散步拉扯/無法專心</li>
                  <li className="flex items-center gap-3 text-left"><span className="text-brand-orange">●</span> 害怕環境/容易受驚</li>
                  <li className="flex items-center gap-3 text-left"><span className="text-brand-orange">●</span> 無法獨處/黏人焦慮</li>
                  <li className="flex items-center gap-3 text-brand-orange font-black text-left"><span className="text-brand-orange">🐾</span> 重新找回信任連結</li>
                </ul>
              </div>

              <p className="mt-10 font-medium">我們追求的，不只是「乖狗狗」。職是更穩定的情緒、更安心的生活，還有你們之間真正的信任與連結。</p>
            </div>

            <div className="mt-14 flex flex-col items-center md:items-start">
              {/* 簽名縮小處理 */}
              <div className="signature text-4xl md:text-5xl text-gray-800">Eric & Pennee</div>
              <div className="text-sm text-gray-400 mt-3 uppercase tracking-[0.2em] font-black">Certified Professional Trainers</div>

              {/* 手機圖示 */}
              <div className="mt-10 flex md:hidden gap-8">
                <img src="https://i.postimg.cc/zGJwTcTg/CATCH-CCDT-Seal-Blue-300.png" className="h-16" alt="CATCH CCDT" />
                <img src="https://i.postimg.cc/P52WyQM8/kpa-badge-ctp-2012-10-01-300x194.png" className="h-16" alt="KPA CTP" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 呼籲行動 */}
      <section className="py-24 bg-primary relative overflow-hidden text-white text-center px-6">
        <div className="absolute -bottom-20 -right-20 opacity-10 rotate-12 animate-float pointer-events-none">
          <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
          </svg>
        </div>

        <div className="container mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-10 leading-tight text-white">準備好與您的狗狗<br />開啟新關係了嗎？</h2>
          <p className="text-xl md:text-2xl mb-14 opacity-90 max-w-2xl mx-auto text-center font-medium">現在預約專業行為諮詢，讓我們協助您找回輕鬆自在的相處時光。</p>
          <a href={TALLY.consultUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-brand-orange px-16 py-6 rounded-full font-black text-2xl shadow-2xl hover:bg-orange-50 hover:-translate-y-2 transition-all text-center">
            預約諮詢 ➔
          </a>
        </div>
      </section>

      {/* ── Latest Blog Posts ── */}
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

      {/* ── Newsletter CTA ── */}
      <NewsletterCTA variant="full" />

      {/* ── FAQ ── */}
      <FAQSection />
    </>
  );
}
