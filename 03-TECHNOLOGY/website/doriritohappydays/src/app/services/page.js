import { BRAND, FAQS, TALLY } from '@/lib/constants';
import { serviceSchema, faqSchema } from '@/lib/schema';
import FAQSection from '@/components/FAQSection';
import NewsletterCTA from '@/components/NewsletterCTA';

export const metadata = {
    title: '一對一正向訓犬服務',
    description: 'KPA、CATCH 認證訓犬師提供到府及線上一對一訓犬服務。解決吠叫、分離焦慮、暴衝等行為問題，6-8 週課程，課後持續追蹤。',
    alternates: { canonical: '/services' },
};

const STEPS = [
    { step: '01', title: '填寫行為諮詢問卷', desc: '透過詳細的問卷，讓我們深入了解你家毛孩的狀況與你的期望。' },
    { step: '02', title: '釐清訓練優先順序', desc: '我們會透過 LINE 溝通，排定前三個最需要改善的核心問題。' },
    { step: '03', title: '30 分鐘線上免費諮詢', desc: '提出客製化解決方案，制定 6-8 週的課程大綱。' },
    { step: '04', title: '一對一到府授課', desc: '訓犬師親至家中，在最熟悉的環境進行個人化訓練指導。' },
    { step: '05', title: '課後跟進與支援', desc: '訓練摘要、作業、每 3 天追蹤進度，LINE 即時回覆疑問。' },
];

const SERVICE_FAQS = [
    {
        question: '訓犬費用大概多少？',
        answer: '費用依問題複雜程度和服務方式（到府/線上）有所不同。建議先填寫免費諮詢問卷，我們會根據你的情況提供最合適的方案和報價。',
    },
    {
        question: '到府服務範圍有哪些縣市？',
        answer: '到府服務目前主要涵蓋台北市和新北市。其他縣市的朋友歡迎詢問線上訓犬服務，效果同樣顯著！',
    },
    {
        question: '課程需要多久才能看到效果？',
        answer: '多數客戶在第 2-3 堂課即可看到明顯改善。完整的 6-8 週課程能讓行為改變更穩固持久。課後作業和追蹤是成功的關鍵。',
    },
    {
        question: '你們的訓練方式是正向訓練嗎？',
        answer: '是的，我們嚴格採用 KPA 和 CATCH 認證的正向強化訓練法，絕對不使用懲罰、電擊項圈或任何令狗狗恐懼的方法。',
    },
    ...FAQS.slice(0, 1),
];

export default function ServicesPage() {
    const jsonLd = [serviceSchema(), faqSchema(SERVICE_FAQS)];

    return (
        <>
            {jsonLd.map((schema, i) => (
                <script key={i} type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            ))}

            {/* Hero */}
            <section className="hero-bg bg-paw-texture py-16 px-6 text-center relative overflow-hidden">
                {/* 裝飾用背景腳印 (桌面版) */}
                <div className="absolute top-10 left-10 text-orange-200 opacity-20 rotate-12 hidden lg:block animate-float pointer-events-none">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 13c-3.3 0-6-2.7-6-6 0-1.7.7-3.2 1.8-4.2l.2-.2c1.1-1 2.5-1.6 4-1.6s2.9.6 4 1.6l.2.2c1.1 1 1.8 2.5 1.8 4.2 0 3.3-2.7 6-6 6zM5 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm14 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                    </svg>
                </div>
                <div className="container mx-auto max-w-2xl relative z-10">
                    <div className="bg-orange-100 text-brand-orange px-6 py-2 rounded-full inline-block font-black mb-6 tracking-widest text-sm sm:text-base shadow-sm border border-orange-200">
                        🏅 KPA & CATCH 認證
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">一對一正向訓犬服務</h1>
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                        每隻狗都是獨一無二的，我們的訓練也是。<br />
                        客製化方案，解決你最在意的行為問題。
                    </p>
                </div>
            </section>

            {/* Service Process Steps */}
            <section className="section bg-white">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>我們的服務流程</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {STEPS.map((step, i) => (
                            <div key={step.step} style={{
                                display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
                                position: 'relative', paddingBottom: i < STEPS.length - 1 ? '2rem' : '0',
                            }}>
                                {/* Timeline Line */}
                                {i < STEPS.length - 1 && (
                                    <div style={{
                                        position: 'absolute', left: '1.5rem', top: '3.5rem',
                                        width: '2px', height: 'calc(100% - 2rem)',
                                        background: 'var(--color-border)',
                                    }} />
                                )}
                                {/* Step Number Badge */}
                                <div style={{
                                    width: '3rem', height: '3rem', flexShrink: 0,
                                    borderRadius: '50%', background: 'var(--color-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 900, fontSize: '0.9rem',
                                    zIndex: 1,
                                }}>
                                    {step.step}
                                </div>
                                <div style={{ paddingTop: '0.5rem' }}>
                                    <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {step.title}
                                    </h3>
                                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Plans */}
            <section className="section" style={{ background: 'var(--color-cream)' }}>
                <div className="container">
                    <h2 style={{ textAlign: 'center', marginBottom: '0.75rem' }}>訓練方案</h2>
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '3rem' }}>
                        所有方案皆包含每週課後追蹤與 LINE 即時支援
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
                        {[
                            { weeks: '6 週', label: '基礎行為改善', items: ['6 次到府/線上課程', '每週課後追蹤', '專屬訓練手冊', 'LINE 隨時支援'] },
                            { weeks: '8 週', label: '深度行為重建', items: ['8 次到府/線上課程', '每 3 天進度追蹤', '深度評估報告', 'LINE 即時支援', '結業認證'], recommended: true },
                        ].map((plan) => (
                            <div key={plan.weeks} className="card" style={{
                                borderTop: `4px solid ${plan.recommended ? 'var(--color-primary)' : 'var(--color-sage)'}`,
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                            }}>
                                {plan.recommended && (
                                    <span style={{
                                        position: 'absolute', top: '-1px', right: '1.5rem',
                                        background: 'var(--color-primary)', color: 'white',
                                        padding: '0.25rem 0.75rem', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                                        fontSize: '0.75rem', fontWeight: 700,
                                    }}>最多人選擇</span>
                                )}
                                <h3 style={{ marginBottom: '0.25rem', marginTop: plan.recommended ? '1.5rem' : '0' }}>{plan.weeks}方案</h3>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{plan.label}</p>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                                    {plan.items.map((item) => (
                                        <li key={item} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <div style={{ marginTop: 'auto' }}>
                                    <a href={TALLY.consultUrl} target="_blank" rel="noopener noreferrer"
                                        className={`btn ${plan.recommended ? 'btn-primary' : 'btn-outline'}`}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                        id={`services-cta-plan-${plan.weeks}`}>
                                        預約諮詢
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        費用依問題複雜程度不同，填寫問卷後我們會提供客製化報價
                    </p>
                </div>
            </section>

            {/* FAQ */}
            <FAQSection faqs={SERVICE_FAQS} title="常見問題" />

            <NewsletterCTA variant="full" />
        </>
    );
}
