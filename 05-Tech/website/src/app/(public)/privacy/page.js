import { BRAND } from '@/lib/constants';

export const metadata = {
    title: '隱私權政策',
    description: 'Dori & Rito Happydays 隱私權政策 — 了解我們如何蒐集、使用及保護您的個人資料',
    alternates: { canonical: '/privacy' },
};

const lastUpdated = '2026 年 3 月';

export default function PrivacyPage() {
    return (
        <section className="section bg-white">
            <div className="container" style={{ maxWidth: '800px' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>隱私權政策</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '3rem', fontSize: '0.9rem' }}>
                    最後更新：{lastUpdated}
                </p>

                {[
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
                ].map((section) => (
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
                    <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>聯絡我們</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                        如有任何隱私權相關問題，請聯繫：<br />
                        <a href={`mailto:${BRAND.email}`} style={{ color: 'var(--color-primary)' }}>{BRAND.email}</a>
                    </p>
                </div>
            </div>
        </section>
    );
}
