import { TALLY } from '@/lib/constants';

export const metadata = {
    title: '合作洽詢',
    description: '與 Dori & Rito 品牌合作、媒體採訪或講座邀約，歡迎填寫合作表單，我們將盡快與您聯繫。',
    alternates: { canonical: '/contact' },
};

export default function ContactPage() {
    return (
        <>
            {/* Hero */}
            <section className="hero-bg bg-paw-texture py-16 px-6 text-center relative overflow-hidden">
                {/* 裝飾用背景腳印 (桌面版) */}
                <div className="absolute top-10 left-10 text-orange-200 opacity-20 rotate-12 hidden lg:block animate-float pointer-events-none">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 13c-3.3 0-6-2.7-6-6 0-1.7.7-3.2 1.8-4.2l.2-.2c1.1-1 2.5-1.6 4-1.6s2.9.6 4 1.6l.2.2c1.1 1 1.8 2.5 1.8 4.2 0 3.3-2.7 6-6 6zM5 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm14 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                    </svg>
                </div>
                <div className="container mx-auto max-w-2xl relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 text-gray-900">合作洽詢</h1>
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                        歡迎各類合作提案！請填寫以下表單，我們將在 2 個工作天內回覆。
                    </p>
                </div>
            </section>

            {/* Collaboration Form */}
            <section className="bg-white py-16 px-6 relative z-10">
                <div className="container mx-auto max-w-4xl">
                    {/* Tally Form Embed */}
                    <div className="bg-gray-50 rounded-[48px] px-8 pb-6 md:px-12 md:pb-8 pt-0 border border-gray-100 flex flex-col w-full md:w-1/2 mx-auto relative overflow-hidden">
                        <div className="relative w-full mt-0 md:-mt-4">
                            <iframe
                                src={`${TALLY.partnerUrl}?transparentBackground=1`}
                                width="100%"
                                height="750"
                                frameBorder="0"
                                marginHeight="0"
                                marginWidth="0"
                                title="合作洽詢表單"
                                id="contact-tally-form"
                                className="rounded-2xl border-none"
                                loading="lazy"
                            />
                            {/* Overlay to hide Tally watermark */}
                            <div className="absolute bottom-0 left-0 w-full h-[50px] bg-gray-50 pointer-events-none z-10" aria-hidden="true"></div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
