import { setRequestLocale, getTranslations } from 'next-intl/server';
import { BRAND } from '@/lib/constants';
import { buildAlternates } from '@/lib/metadata';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'metadata.privacy' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates({ locale, path: '/privacy' }),
    };
}

const SECTIONS = {
    'zh-TW': {
        lastUpdated: '2026 年 3 月',
        sections: [
            {
                title: '一、資料蒐集說明',
                content: `本網站（doriritohappydays.com）在您使用我們的服務時，可能蒐集以下資料：
- 電子郵件地址（電子報訂閱、預約確認）
- 個人聯絡資訊（姓名、手機號碼、地址 — 預約諮詢問卷）
- 狗狗行為相關資訊（諮詢問卷中的狗狗資料、行為問題描述）
- 付款交易紀錄（訂單編號、金額、付款時間 — 信用卡資料由第三方金流處理，本站不經手）
- 網站瀏覽行為資料（透過 Google Analytics 蒐集匿名統計數據）`,
            },
            {
                title: '二、資料使用目的',
                content: `我們蒐集您的個人資料僅用於以下目的：
- 發送 Dori & Rito Happydays 電子報（需您主動確認訂閱）
- 提供訓犬服務諮詢及課程安排
- 處理線上付款與預約確認
- 發送預約確認信、Google 日曆邀請及課前資料
- 客戶關係管理與課後追蹤
- 改善網站功能與使用者體驗

我們不會將您的個人資料出售、出租或以任何方式提供給第三方用於行銷目的。`,
            },
            {
                title: '三、第三方服務',
                content: `為提供完整的服務體驗，我們使用以下第三方服務處理您的資料：
- ECPay 綠界科技 — 線上付款處理（受 PCI DSS 國際安全標準保護）
- Google Calendar — 預約排程管理與 Google Meet 視訊連結
- Mailgun — 電子郵件發送（確認信、預約通知）
- Ghost CMS — 電子報內容管理與發送
- Google Analytics — 網站匿名使用統計分析
- Notion — 客戶關係管理

上述各服務均受其自身隱私權政策約束，我們僅提供服務必要的最少資料。`,
            },
            {
                title: '四、付款資料安全',
                content: `您的付款安全是我們的首要考量：
- 所有線上付款均透過 ECPay 綠界科技安全處理
- 本站不儲存、不經手、不傳輸任何信用卡卡號或安全碼
- ECPay 符合 PCI DSS（支付卡產業資料安全標準）國際認證
- 我們僅保留訂單編號、交易金額及付款時間等必要交易紀錄，用於對帳及客戶服務`,
            },
            {
                title: '五、Cookie 與追蹤技術',
                content: `本網站使用 Google Analytics 蒐集匿名的網站使用統計數據，幫助我們了解訪客行為並改善網站內容。這些資料不包含可識別個人身份的資訊。

您可以透過瀏覽器設定拒絕 Cookie，但這可能影響部分網站功能的正常運作。`,
            },
            {
                title: '六、資料保存期間',
                content: `- 預約及交易紀錄：依中華民國相關法規保存必要期間（至少五年）
- 客戶諮詢資料：服務期間及服務結束後一年內保存，供課後追蹤使用
- 電子報訂閱資料：保存至您取消訂閱為止
- 網站瀏覽資料：依 Google Analytics 預設保存期間`,
            },
            {
                title: '七、您的權利',
                content: `依據中華民國個人資料保護法，您享有以下權利：
- 查閱您的個人資料
- 要求更正不正確的資料
- 要求刪除您的個人資料
- 取消訂閱電子報（每封電子報底部均有取消連結）
- 要求停止蒐集、處理或利用您的個人資料

如需行使上述權利，請聯繫：${BRAND.email}
我們將於收到請求後 30 日內回覆處理。`,
            },
            {
                title: '八、政策更新',
                content: `我們可能不定期更新本隱私權政策。重大變更時將透過電子報或網站公告通知。繼續使用本網站即表示您同意最新版本的隱私權政策。`,
            },
        ],
    },
    en: {
        lastUpdated: 'March 2026',
        sections: [
            {
                title: '1. What we collect',
                content: `When you use our services on doriritohappydays.com, we may collect:
- Email address (newsletter subscription, booking confirmations)
- Personal contact details (name, phone number, address — consultation questionnaire)
- Information about your dog's behaviour (questionnaire responses, behaviour descriptions)
- Payment transaction records (order number, amount, timestamp — card details are handled by our payment processor, never by us)
- Anonymous website usage data (via Google Analytics)`,
            },
            {
                title: '2. How we use your data',
                content: `We use your personal data only for:
- Sending the Dori & Rito Happydays newsletter (requires your active opt-in confirmation)
- Providing dog training consultations and scheduling sessions
- Processing online payments and booking confirmations
- Sending confirmation emails, Google Calendar invites, and pre-session materials
- Client relationship management and post-session follow-up
- Improving website functionality and user experience

We never sell, rent, or share your personal data with third parties for marketing purposes.`,
            },
            {
                title: '3. Third-party services',
                content: `To deliver our services, we use the following third-party platforms:
- ECPay — online payment processing (PCI DSS certified)
- Google Calendar — scheduling and Google Meet video links
- Mailgun — transactional email delivery (confirmations, notifications)
- Ghost CMS — newsletter content management
- Google Analytics — anonymous website usage statistics
- Notion — client relationship management

Each service is governed by its own privacy policy. We share only the minimum data required for each service to function.`,
            },
            {
                title: '4. Payment security',
                content: `Your payment security is our top priority:
- All online payments are processed securely through ECPay
- We never store, handle, or transmit any credit card numbers or security codes
- ECPay is PCI DSS (Payment Card Industry Data Security Standard) certified
- We retain only order numbers, transaction amounts, and timestamps for reconciliation and customer service`,
            },
            {
                title: '5. Cookies and tracking',
                content: `We use Google Analytics to collect anonymous website usage statistics that help us understand visitor behaviour and improve our content. This data contains no personally identifiable information.

You can disable cookies in your browser settings, though some website features may not function correctly as a result.`,
            },
            {
                title: '6. Data retention',
                content: `- Booking and transaction records: retained for the period required by applicable law (minimum 5 years)
- Client consultation data: retained during the service period and for one year afterwards for follow-up purposes
- Newsletter subscription data: retained until you unsubscribe
- Website analytics data: per Google Analytics default retention settings`,
            },
            {
                title: '7. Your rights',
                content: `You have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your personal data
- Unsubscribe from the newsletter at any time (every email includes an unsubscribe link)
- Request that we stop collecting, processing, or using your personal data

To exercise any of these rights, please contact: ${BRAND.email}
We will respond within 30 days of receiving your request.`,
            },
            {
                title: '8. Policy updates',
                content: `We may update this Privacy Policy from time to time. For significant changes, we will notify you via newsletter or a notice on our website. Continued use of the site after any update constitutes your acceptance of the revised policy.`,
            },
        ],
    },
};

export default async function PrivacyPage({ params }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('legal.privacy');

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
