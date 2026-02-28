import { organizationSchema } from '@/lib/schema';
import { BRAND, TALLY } from '@/lib/constants';
import NewsletterCTA from '@/components/NewsletterCTA';

export const metadata = {
    title: '關於我們',
    description: 'Dori & Rito 是台灣擁有 KPA、CATCH 雙認證的正向訓犬師團隊。了解我們的品牌故事、訓練理念與認證資格。',
    alternates: { canonical: '/about' },
};

// Placeholder trainer data — to be updated with real photos when provided
const TRAINERS = [
    {
        name: 'Pennee（潘老師）',
        title: 'KPA CTP 認證訓犬師',
        certifications: ['KPA CTP（Karen Pryor Academy Certified Training Partner）', 'CATCH CTC（Certified Training & Counseling Program）'],
        specialty: '分離焦慮、幼犬教育、多犬家庭',
        bio: '擁有多年正向訓練實務經驗，專精於高敏感犬與分離焦慮案例。相信每隻狗都有能力學習，每個行為背後都有原因。',
        emoji: '🧡',
    },
    {
        name: 'Eric（艾瑞克）',
        title: 'KPA CTP 認證訓犬師',
        certifications: ['KPA CTP（Karen Pryor Academy Certified Training Partner）'],
        specialty: '反應性犬、暴衝、基礎訓練',
        bio: '專注於幫助反應性犬與暴衝問題，透過科學化的正向強化方法，讓狗狗在輕鬆愉快的環境中學習新行為。',
        emoji: '💙',
    },
];

export default function AboutPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
            />

            {/* Hero */}
            <section style={{
                background: 'linear-gradient(160deg, var(--color-cream) 0%, var(--color-sage) 100%)',
                padding: '5rem 1.5rem 4rem',
                textAlign: 'center',
            }}>
                <div className="container" style={{ maxWidth: '640px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🐾</div>
                    <h1 style={{ marginBottom: '1rem' }}>關於 Dori & Rito</h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                        我們是一個以正向訓練為核心的訓犬師團隊，<br />
                        相信每隻狗都值得被理解，而不只是被服從。
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="section bg-white">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ marginBottom: '1rem' }}>我們的理念</h2>
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '1rem' }}>
                                我們相信，訓犬不應該依賴懲罰和恐懼。真正穩定的行為改變，來自於讓狗狗在正向的環境中主動選擇正確的行為。
                            </p>
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                                透過科學驗證的正向強化訓練法，我們不只幫助毛孩改變行為，更幫助你理解毛孩，建立更深厚的信任關係。
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {['純正向訓練', '科學基礎', '個別化方案', '持續支援'].map((tag) => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                            </div>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-primary-light) 100%)',
                            borderRadius: 'var(--radius-xl)',
                            padding: '3rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                        }}>
                            {[
                                { number: '2+', label: '年訓犬實務經驗' },
                                { number: '100+', label: '服務毛孩家庭' },
                                { number: '100%', label: '正向強化訓練' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{stat.number}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Trainer Profiles */}
            <section className="section" style={{ background: 'var(--color-cream)' }}>
                <div className="container">
                    <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>訓犬師團隊</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {TRAINERS.map((trainer) => (
                            <div key={trainer.name} className="card">
                                {/* Avatar Placeholder */}
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: `linear-gradient(135deg, var(--color-primary), var(--color-sage))`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '2.5rem', marginBottom: '1.25rem',
                                }}>
                                    {trainer.emoji}
                                </div>
                                <h3 style={{ marginBottom: '0.25rem' }}>{trainer.name}</h3>
                                <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    {trainer.title}
                                </p>
                                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '1rem', fontSize: '0.95rem' }}>
                                    {trainer.bio}
                                </p>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>🏅 認證資格</p>
                                    {trainer.certifications.map((cert) => (
                                        <p key={cert} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>• {cert}</p>
                                    ))}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>🎯 專長領域</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{trainer.specialty}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section bg-sage" style={{ textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: '500px' }}>
                    <h2 style={{ marginBottom: '1rem' }}>認識我們之後，想見見你的毛孩嗎？</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.7 }}>
                        填寫免費諮詢問卷，讓我們了解你家毛孩的情況
                    </p>
                    <a href={TALLY.consultUrl} target="_blank" rel="noopener noreferrer"
                        className="btn btn-primary btn-lg" id="about-cta">
                        🐶 預約免費諮詢
                    </a>
                </div>
            </section>

            <NewsletterCTA variant="full" />
        </>
    );
}
