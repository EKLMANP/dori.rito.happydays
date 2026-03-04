import { getLatestPosts } from '@/lib/ghost';
import { localBusinessSchema, faqSchema } from '@/lib/schema';
import { BRAND, FAQS, TALLY } from '@/lib/constants';
import NewsletterCTA from '@/components/NewsletterCTA';
import FAQSection from '@/components/FAQSection';
import BlogCard from '@/components/BlogCard';
import Link from 'next/link';

export const metadata = {
  title: `${BRAND.nameShort} | KPA 認證正向訓犬師`,
  description: BRAND.description,
  alternates: { canonical: '/' },
};

export const revalidate = 60; // ISR: revalidate every 60 seconds

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

      {/* 英雄區 (Hero Section) */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden hero-bg bg-paw-texture">
        {/* 裝飾用背景腳印 (桌面版) */}
        <div className="absolute top-20 left-10 text-orange-200 opacity-20 rotate-12 hidden lg:block animate-float pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 13c-3.3 0-6-2.7-6-6 0-1.7.7-3.2 1.8-4.2l.2-.2c1.1-1 2.5-1.6 4-1.6s2.9.6 4 1.6l.2.2c1.1 1 1.8 2.5 1.8 4.2 0 3.3-2.7 6-6 6zM5 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm14 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
          </svg>
        </div>

        {/* 手機版背景 */}
        <div className="absolute inset-0 md:hidden pointer-events-none">
          <img src="https://iili.io/qfrfmxf.jpg" className="w-full h-full object-cover" alt="Mobile Background" />
          <div className="absolute inset-0 bg-white/75" />
        </div>

        <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-2 items-center gap-10 py-16 relative z-10">
          <div className="order-1 flex flex-col items-center md:items-start text-center md:text-left">
            {/* Highlight with background */}
            <div className="bg-orange-100 text-brand-orange px-6 py-2 rounded-full inline-block font-black mb-10 tracking-widest text-sm sm:text-base shadow-sm">
              以科學為基礎・以正向為核心 🐾
            </div>

            {/* 三行標題排版 */}
            <h1 className="flex flex-col gap-3 md:gap-5 mb-10">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">終於，你和你的</span>
              <span className="text-5xl sm:text-6xl lg:text-7xl font-black text-brand-orange bg-orange-50/80 px-4 py-1 rounded-2xl w-fit self-center md:self-start shadow-sm">敏感狗狗</span>
              <span className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 whitespace-nowrap tracking-tight">也可以安心散步，快樂相處了</span>
            </h1>

            <div className="text-gray-600 text-lg md:text-xl mb-12 max-w-lg leading-relaxed font-medium">
              用理解代替控制，用引導替代壓制。<br />
              你不是失敗的飼主，你只是需要一套真正適合敏感犬的方式。
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 w-full">
              <a href={TALLY.consultUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-white px-10 py-4 rounded-full font-black shadow-xl text-lg tracking-wide text-center cursor-pointer">
                預約諮詢
              </a>
            </div>
          </div>

          {/* 桌機版圖片區 */}
          <div className="hidden md:flex relative justify-center items-center h-full order-2">
            <div className="relative">
              <img src="https://iili.io/qfrfmxf.jpg"
                alt="Eric & Pennee 與狗狗的親密互動"
                className="rounded-[50px] shadow-2xl object-cover w-full max-w-md md:max-w-xl h-[400px] md:h-[600px] border-8 border-white" />

              {/* 懸浮標章 */}
              <div className="absolute bottom-10 -left-6 md:-left-16 bg-white p-6 rounded-[32px] shadow-2xl flex items-center gap-4 z-20 border border-orange-50 animate-float pointer-events-none">
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-inner">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div className="whitespace-nowrap">
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Professional & Positive</div>
                  <div className="text-xl font-black text-gray-800 tracking-tight">100% 無恐懼訓練</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部有機波浪分隔 */}
        <svg className="wave-divider" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0,64L48,64C96,64,192,64,288,58.7C384,53,480,43,576,42.7C672,43,768,53,864,64C960,75,1056,85,1152,85.3C1248,85,1344,75,1392,69.3L1440,64L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z" />
        </svg>
      </section>

      {/* 客戶評價區 */}
      <section className="py-24 bg-white overflow-hidden relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-brand-orange font-black tracking-widest mb-3 uppercase text-sm">Customer Reviews</h3>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900">牠們都找回了平靜</h2>
            <div className="w-20 h-1.5 bg-orange-200 mx-auto mt-6 rounded-full" />
          </div>

          {/* Carousel 滑動容器 */}
          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-5 md:gap-8 md:grid md:grid-cols-3 md:overflow-visible items-stretch pb-10 px-2 lg:px-4">

            {/* 評價 1: 波比 */}
            <div className="review-card flex-shrink-0 w-[85vw] snap-center bg-gray-50 p-6 md:p-8 rounded-[48px] border border-gray-100 flex flex-col h-auto md:w-full">
              <div className="min-h-[auto] md:min-h-[520px] flex flex-col text-gray-700">
                <div className="flex text-brand-orange text-xl mb-4">
                  ★★★★★
                </div>
                <p className="font-bold text-gray-800 text-xl mb-3">波比一對一家教分享</p>
                <p className="text-gray-600 italic leading-relaxed text-sm lg:text-base mb-6">
                  波比之前有嚴重的<span className="text-brand-orange font-bold">分離焦慮</span>，只要兩分鐘看不到我，就會在客廳焦慮大便甚至吃掉。只要我們一離開，他就會在家裡<span className="text-brand-orange font-bold">不斷吠叫</span>，可以連續叫好幾個小時，還會緊張到一直流口水。那段時間真的身心俱疲，也很無助。真的很謝謝老師，幫我們一步一步拆解問題，從建立安全感、調整出門儀式，到拉長獨處時間。<span className="text-brand-orange font-bold">現在波比可以自己在家待上幾個小時；出門也變得非常穩定放鬆</span>。我終於真正認識、理解自己的狗狗了，也重新找回跟他相處的安心感。
                </p>
              </div>

              <div className="aspect-[3/4] rounded-[36px] overflow-hidden shadow-inner mb-6 flex-shrink-0">
                <img src="https://iili.io/qfrpctS.jpg" alt="波比" className="w-full h-full object-cover" />
              </div>

              <div className="mt-auto border-t border-gray-200 pt-6">
                <div className="font-black text-lg text-gray-900">波比媽媽 ❤️</div>
                <div className="text-xs text-brand-orange font-bold uppercase mt-1 tracking-wider">分離焦慮 / 吠叫問題</div>
              </div>
            </div>

            {/* 評價 2: 阿寶妞 */}
            <div className="review-card flex-shrink-0 w-[85vw] snap-center bg-gray-50 p-6 md:p-8 rounded-[48px] border border-gray-100 flex flex-col h-auto md:w-full">
              <div className="min-h-[auto] md:min-h-[520px] flex flex-col text-gray-700 text-left">
                <div className="flex text-brand-orange text-xl mb-4">
                  ★★★★★
                </div>
                <p className="font-bold text-gray-800 text-xl mb-3">阿寶妞一對一家教分享</p>
                <p className="text-gray-600 italic leading-relaxed text-sm lg:text-base mb-6">
                  阿寶妞本身比較膽小，出門散步時<span className="text-brand-orange font-bold">看到狗狗或路人，或客人來家裡會一直吠叫</span>，搭電梯時只要有人進出也會吠叫。真的很開心遇見 Eric 老師，<span className="text-brand-orange font-bold">老師的教學方式非常有趣又有系統</span>，不是頭痛醫頭、腳痛醫腳，而是從吃、睡、玩、學四個面向全面調整。課程結束後的<span className="text-brand-orange font-bold">改變真的讓人很驚喜</span>，現在阿寶妞可以<span className="text-brand-orange font-bold">安心地散步，搭電梯時居然不再對進出的人吠叫，訪客來家裡也能穩定相處</span>、不再亂叫。更神奇的是，<span className="text-brand-orange font-bold">原本沒有特別請老師協助處理的行為問題，也在過程中默默被改善了</span>。真的很感謝這堂課，不只解決了問題，也讓我們更了解自己的狗狗。
                </p>
              </div>

              <div className="aspect-[3/4] rounded-[36px] overflow-hidden shadow-inner mb-6 flex-shrink-0">
                <img src="https://iili.io/qf4gNyu.jpg" alt="阿寶妞" className="w-full h-full object-cover" />
              </div>

              <div className="mt-auto border-t border-gray-200 pt-6">
                <div className="font-black text-lg text-gray-900 text-left">阿寶妞媽媽 ❤️</div>
                <div className="text-xs text-brand-orange font-bold uppercase mt-1 text-left tracking-wider">散步吠叫 / 電梯警戒</div>
              </div>
            </div>

            {/* 評價 3: Lulu */}
            <div className="review-card flex-shrink-0 w-[85vw] snap-center bg-gray-50 p-6 md:p-8 rounded-[48px] border border-gray-100 flex flex-col h-auto md:w-full">
              <div className="min-h-[auto] md:min-h-[520px] flex flex-col text-gray-700">
                <div className="flex text-brand-orange text-xl mb-4">
                  ★★★★★
                </div>
                <p className="font-bold text-gray-800 text-xl mb-3">Lulu 行為調整心得</p>
                <p className="text-gray-600 italic leading-relaxed text-sm lg:text-base mb-6">
                  Lulu 的吠叫問題已經困擾我們很久了，只要一出門看到人或看到狗就會大叫。<span className="text-brand-orange font-bold">試過很多方法都沒有用</span>，一度動過放棄的念頭。曾經以為養狗是一件很開心的事，卻因為不知道該怎麼訓練 Lulu，常常覺得自己是個失敗的飼主。還好遇到 Pennee 老師，<span className="text-brand-orange font-bold">老師很耐心地講解狗狗行為背後的原因，解開了我多年來的疑惑</span>，也教我用理解的角度去看待狗狗與訓練。慢慢地，<span className="text-brand-orange font-bold">Lulu 的穩定度真的進步了很多</span>。上課過程中，老師不只關心狗狗的情緒，也很在意身為毛孩媽媽的我的感受，她的耐心與鼓勵成了我最大的支持與力量，讓我重新找回陪伴狗狗的信心。
                </p>
              </div>

              <div className="aspect-[3/4] rounded-[36px] overflow-hidden shadow-inner mb-6 flex-shrink-0">
                <img src="https://iili.io/qf6TBcb.jpg" alt="Lulu" className="w-full h-full object-cover" />
              </div>

              <div className="mt-auto border-t border-gray-200 pt-6">
                <div className="font-black text-lg text-gray-900 text-left">Lulu 媽媽 ❤️</div>
                <div className="text-xs text-brand-orange font-bold uppercase mt-1 text-left tracking-wider">外出吠叫 / 心理建設</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-4 md:hidden">
            <div className="w-10 h-2.5 rounded-full bg-orange-500 shadow-sm" />
            <div className="w-2.5 h-2.5 rounded-full bg-orange-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-orange-200" />
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
