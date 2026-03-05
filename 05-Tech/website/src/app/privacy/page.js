import { BRAND } from '@/lib/constants';

export const metadata = {
    title: '隱私權政策',
    description: 'Dori & Rito Happydays 隱私權政策說明',
    alternates: { canonical: '/privacy' },
};

const lastUpdated = '2026 年 2 月';

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
                        content: `本網站（doriritohappydays.com）在您訂閱電子報、填寫諮詢表單或瀏覽本網站時，可能蒐集以下資料：
- 電子郵件地址（電子報訂閱）
- 狗狗行為相關資訊（諮詢問卷）
- 網站瀏覽行為資料（Google Analytics）`,
                    },
                    {
                        title: '二、資料使用目的',
                        content: `我們蒐集您的個人資料僅用於以下目的：
- 發送 Dori & Rito 每週電子報（需您主動同意訂閱）
- 提供訓犬服務諮詢及課程安排
- 改善網站功能與使用者體驗
我們不會將您的個人資料出售、出租或以任何方式提供給第三方用於行銷目的。`,
                    },
                    {
                        title: '三、Cookie 與追蹤技術',
                        content: `本網站使用 Google Analytics 蒐集匿名的網站使用統計數據，以幫助我們了解訪客行為並改善內容。
您可以透過瀏覽器設定拒絕 Cookie，但這可能影響部分網站功能的正常運作。`,
                    },
                    {
                        title: '四、資料保存與安全',
                        content: `您的個人資料存放在安全的雲端伺服器，並採用業界標準的安全措施保護。我們僅在提供服務所需的期間內保存您的資料。`,
                    },
                    {
                        title: '五、您的權利',
                        content: `依據中華民國個人資料保護法，您有權：
- 查閱您的個人資料
- 要求更正不正確的資料
- 要求刪除您的資料
- 取消訂閱電子報（每封電子報底部均有取消連結）

如需行使上述權利，請聯繫：${BRAND.email}`,
                    },
                    {
                        title: '六、政策更新',
                        content: `我們可能不定期更新本隱私權政策。重大變更時將透過電子報通知訂閱者。繼續使用本網站即表示您同意最新版本的隱私權政策。`,
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
