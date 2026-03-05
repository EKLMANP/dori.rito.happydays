import { BRAND } from '@/lib/constants';

export const metadata = {
    title: '服務條款',
    description: 'Dori & Rito Happydays 服務條款',
    alternates: { canonical: '/terms' },
};

export default function TermsPage() {
    return (
        <section className="section bg-white">
            <div className="container" style={{ maxWidth: '800px' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>服務條款</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '3rem', fontSize: '0.9rem' }}>
                    最後更新：2026 年 2 月
                </p>

                {[
                    {
                        title: '一、服務內容',
                        content: `Dori & Rito Happydays 提供正向訓犬服務，包含：
- 一對一到府訓犬課程
- 一對一線上訓犬課程
- 免費線上諮詢

所有服務由 KPA 及 CATCH 認證訓犬師執行。`,
                    },
                    {
                        title: '二、預約與付款',
                        content: `- 正式課程需於諮詢確認後完成付款方可安排
- 付款後將安排課程時間並提供課前資料
- 付款方式以雙方確認為準`,
                    },
                    {
                        title: '三、取消與改期政策',
                        content: `請提前 24 小時以上通知取消或改期，以免影響後續安排。
多次臨時取消（超過 2 次）可能影響後續課程安排的優先順序。`,
                    },
                    {
                        title: '四、訓練效果說明',
                        content: `訓練效果因狗狗個體差異、飼主配合程度及練習頻率而有所不同。我們無法保證特定時間內達到特定結果，但承諾提供最專業的訓練建議與持續支援。`,
                    },
                    {
                        title: '五、拍攝與肖像使用',
                        content: `課程中如需拍攝影片或照片作為教學或紀錄用途，將事先取得您的同意。如您不希望相關影像用於社群媒體或行銷素材，請事先告知。`,
                    },
                    {
                        title: '六、限制條款',
                        content: `本條款受中華民國法律管轄。如有爭議，雙方同意以協商方式解決。`,
                    },
                ].map((section) => (
                    <div key={section.title} style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>{section.title}</h2>
                        <div style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                            {section.content}
                        </div>
                    </div>
                ))}

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '2rem' }}>
                    如有任何問題，請聯繫 <a href={`mailto:${BRAND.email}`} style={{ color: 'var(--color-primary)' }}>{BRAND.email}</a>
                </p>
            </div>
        </section>
    );
}
