import { setRequestLocale, getTranslations } from 'next-intl/server';
import { BRAND } from '@/lib/constants';
import { buildAlternates } from '@/lib/metadata';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'metadata.terms' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates({ locale, path: '/terms' }),
    };
}

const SECTIONS = {
    'zh-TW': {
        lastUpdated: '2026 年 3 月',
        sections: [
            {
                title: '一、服務內容',
                content: `Dori & Rito Happydays（以下簡稱「本團隊」）提供正向訓犬服務，包含：
- 一對一到府訓犬課程
- 一對一線上訓犬課程（透過 Google Meet 視訊進行）
- 線上行為諮詢

所有服務均由取得 KPA（Karen Pryor Academy）及 CATCH（Companion Animal Training and Handling）認證之專業訓犬師執行，以正向增強（positive reinforcement）為核心訓練方法。`,
            },
            {
                title: '二、預約流程',
                content: `1. 透過本團隊官網（doriritohappydays.com）填寫諮詢問卷
2. 選擇可用時段
3. 線上完成付款後，預約即正式成立
4. 付款成功後，您將收到：
   - 預約確認電子郵件
   - Google 日曆邀請（含課程時間）
   - Google Meet 視訊連結（線上課程適用）
   - 課前準備資料（如適用）

預約僅在付款完成後方為成立，未完成付款之時段選擇不構成預約。`,
            },
            {
                title: '三、付款方式與條款',
                content: `- 所有線上付款均透過 ECPay 綠界科技安全處理
- 支援信用卡付款（Visa、Mastercard、JCB）
- 所有價格以新台幣（NTD）計價，並於預約頁面明確標示
- 付款成功後即視為預約正式成立
- 本站不儲存、不經手任何信用卡號碼或安全碼
- ECPay 綠界科技符合 PCI DSS（支付卡產業資料安全標準）國際認證
- 如遇付款異常，請聯繫本團隊協助確認`,
            },
            {
                title: '四、取消與退款政策',
                content: `取消政策：
- 課程開始 24 小時前取消或改期：可免費取消，全額退款或安排改期
- 課程開始前 24 小時內取消：恕不退款
- 未事先通知而缺席（no-show）：視同已完成課程，不予退款

改期政策：
- 課程開始 24 小時前可免費改期一次
- 改期需視訓犬師時段可用性安排
- 多次臨時改期（累計超過 2 次）可能影響後續課程安排之優先順序

退款方式：
- 符合退款條件之款項，將透過原付款方式退回
- 退款處理時間約 7 至 14 個工作天（視發卡銀行而定）
- 如因本團隊訓犬師因素無法進行已預約之課程，將由本團隊主動聯繫，提供全額退款或免費改期

取消或改期請聯繫：${BRAND.email}`,
            },
            {
                title: '五、訓練效果說明',
                content: `- 訓練效果因狗狗個體差異（品種、年齡、性格、健康狀況）、飼主配合程度及日常練習頻率而有所不同
- 本團隊無法保證於特定時間內達到特定訓練結果
- 本團隊承諾提供最專業的正向訓練建議，並於課程期間及課後提供持續支援
- 飼主需依訓犬師建議進行日常練習，方能達到最佳訓練成效`,
            },
            {
                title: '六、拍攝與肖像使用',
                content: `- 課程中如需拍攝影片或照片作為教學記錄用途，將事先取得您的同意
- 如您不希望相關影像用於社群媒體或行銷素材，請於課前或課程中告知
- 您可隨時要求移除已發布之相關影像
- 未經您同意，本團隊不會將您或您寵物的影像用於商業用途`,
            },
            {
                title: '七、智慧財產權',
                content: `- 本團隊提供之所有課程內容、教材、講義、影片及訓練計畫均受中華民國著作權法保護
- 未經本團隊書面授權，不得複製、散佈、轉載或以任何形式公開使用上述內容
- 課程中拍攝之教學影片僅供個人學習使用，不得上傳至公開平台或分享予第三方`,
            },
            {
                title: '八、免責聲明',
                content: `- 訓練過程中，狗狗之行為不可完全預測，飼主需確保自身及狗狗之安全
- 飼主有義務於課前據實告知狗狗之健康狀況、行為紀錄（包含但不限於攻擊史、恐懼反應、醫療狀況）
- 到府課程期間，飼主需確保訓練環境之安全性
- 因飼主隱瞞狗狗重要行為或健康資訊而導致之事故，本團隊不承擔相關責任
- 本團隊保留因安全考量而中止或調整課程內容之權利`,
            },
            {
                title: '九、管轄法律與爭議處理',
                content: `- 本服務條款受中華民國法律管轄並依其解釋
- 如有爭議，雙方同意先以友善協商方式解決
- 協商不成時，雙方同意以臺灣臺北地方法院為第一審管轄法院`,
            },
        ],
    },
    en: {
        lastUpdated: 'March 2026',
        sections: [
            {
                title: '1. Services',
                content: `Dori & Rito Happydays ("we", "us", "our") provides positive dog training services including:
- In-person 1-on-1 training sessions
- Online 1-on-1 training sessions (via Google Meet)
- Online behaviour consultations

All services are delivered by trainers certified by KPA (Karen Pryor Academy) and/or CATCH (Companion Animal Training and Handling), using positive reinforcement as the core training methodology.`,
            },
            {
                title: '2. Booking process',
                content: `1. Complete the consultation questionnaire on our website (doriritohappydays.com)
2. Select an available time slot
3. Complete online payment — your booking is confirmed once payment is successful
4. After successful payment, you will receive:
   - A booking confirmation email
   - A Google Calendar invite with your session time
   - A Google Meet link (for online sessions)
   - Pre-session preparation materials (where applicable)

A time slot is not reserved until payment is completed.`,
            },
            {
                title: '3. Payment',
                content: `- All online payments are processed securely through ECPay
- We accept credit cards (Visa, Mastercard, JCB)
- All prices are in New Taiwan Dollars (TWD) and clearly displayed on the booking page
- Your booking is confirmed once payment is successfully processed
- We never store or handle any credit card numbers or security codes
- ECPay is PCI DSS (Payment Card Industry Data Security Standard) certified
- If you experience any payment issues, please contact us`,
            },
            {
                title: '4. Cancellation and refunds',
                content: `Cancellation policy:
- More than 24 hours before your session: free cancellation — full refund or reschedule
- Less than 24 hours before your session: non-refundable
- No-show (no advance notice): treated as a completed session, no refund

Rescheduling:
- Sessions may be rescheduled once, free of charge, if requested more than 24 hours in advance
- Rescheduling is subject to trainer availability
- Multiple last-minute reschedules (more than 2 total) may affect scheduling priority

Refund method:
- Eligible refunds are returned via the original payment method
- Processing time is approximately 7–14 business days (depending on your bank)
- If we need to cancel a session due to trainer unavailability, we will contact you proactively and offer a full refund or free reschedule

To cancel or reschedule: ${BRAND.email}`,
            },
            {
                title: '5. Training outcomes',
                content: `- Results vary depending on the individual dog (breed, age, temperament, health), owner consistency, and daily practice frequency
- We cannot guarantee specific outcomes within a specific timeframe
- We commit to providing expert positive training guidance and ongoing support throughout and after the programme
- For best results, owners must follow trainer recommendations and practise regularly between sessions`,
            },
            {
                title: '6. Photography and image use',
                content: `- We will seek your consent before recording or photographing sessions for educational documentation
- If you do not wish for any images to be used on social media or marketing materials, please inform us before or during the session
- You may request removal of published images at any time
- We will not use images of you or your pet for commercial purposes without your explicit consent`,
            },
            {
                title: '7. Intellectual property',
                content: `- All session content, handouts, training plans, and materials we provide are protected by copyright
- You may not copy, distribute, republish, or publicly share any of this content without our written permission
- Session recordings are for your personal learning use only and must not be uploaded to public platforms or shared with third parties`,
            },
            {
                title: '8. Disclaimer',
                content: `- Dog behaviour cannot be fully predicted; owners are responsible for the safety of themselves and their dog during all sessions
- Owners must disclose relevant health and behaviour history (including but not limited to bite history, fear responses, and medical conditions) before the session begins
- For in-person sessions, owners are responsible for ensuring a safe training environment
- We are not liable for incidents arising from undisclosed behaviour or health information
- We reserve the right to pause or modify session content for safety reasons`,
            },
            {
                title: '9. Governing law',
                content: `- These Terms are governed by and construed in accordance with the laws of the Republic of China (Taiwan)
- Both parties agree to first attempt to resolve disputes through good-faith negotiation
- If negotiation fails, both parties agree that the Taipei District Court in Taiwan shall have first-instance jurisdiction`,
            },
        ],
    },
};

export default async function TermsPage({ params }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('legal.terms');

    const { lastUpdated, sections } = SECTIONS[locale] ?? SECTIONS['zh-TW'];

    return (
        <section className="section bg-white">
            <div className="container" style={{ maxWidth: '800px' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>{t('title')}</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '3rem', fontSize: '0.9rem' }}>
                    {t('lastUpdated', { date: lastUpdated })}
                </p>

                {sections.map((section) => (
                    <div key={section.title} style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>{section.title}</h2>
                        <div style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                            {section.content}
                        </div>
                    </div>
                ))}

                <div style={{
                    background: 'var(--color-cream)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    marginTop: '2rem',
                }}>
                    <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{t('contactTitle')}</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                        {t('contactText')}<br />
                        <a href={`mailto:${BRAND.email}`} style={{ color: 'var(--color-primary)' }}>{BRAND.email}</a>
                    </p>
                </div>
            </div>
        </section>
    );
}
