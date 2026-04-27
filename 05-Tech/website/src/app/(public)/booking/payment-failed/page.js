'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const VARIANTS = {
    expired: {
        icon: '⏰',
        title: '繳費期限已過',
        titleColor: 'text-red-800',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        body: '很抱歉，您的繳費期限已過，訂單已自動取消。如仍需預約，請重新填寫預約表單。',
        cta: { label: '重新預約', href: '/booking', style: 'bg-orange-500 hover:bg-orange-600 text-white' },
    },
    declined: {
        icon: '💳',
        title: '付款未成功',
        titleColor: 'text-orange-800',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        body: '您的付款未成功完成。我們已寄出一封包含「重新選擇付款方式」按鈕的 email，請查收並依指示完成付款。如未收到，請聯絡我們。',
        cta: { label: '查看預約記錄', href: '/booking', style: 'bg-orange-500 hover:bg-orange-600 text-white' },
    },
    unknown: {
        icon: '⚠️',
        title: '付款發生問題',
        titleColor: 'text-gray-800',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        body: '付款過程中發生未知錯誤，請聯絡我們以協助處理。',
        cta: null,
    },
};

function PaymentFailedContent() {
    const params = useSearchParams();
    const reason = params.get('reason') || 'unknown';
    const email = params.get('email');
    const variant = VARIANTS[reason] || VARIANTS.unknown;

    return (
        <main className="max-w-xl mx-auto px-6 py-16">
            <div className={`${variant.bgColor} border ${variant.borderColor} rounded-xl p-8`}>
                <div className="text-4xl mb-4">{variant.icon}</div>
                <h1 className={`text-xl font-bold ${variant.titleColor} mb-3`}>{variant.title}</h1>
                <p className="text-sm text-gray-700 leading-relaxed">
                    {variant.body}
                    {reason === 'declined' && email && (
                        <span className="block mt-2 font-medium">Email：{email}</span>
                    )}
                </p>

                <div className="mt-6 flex flex-col gap-3">
                    {variant.cta && (
                        <a
                            href={variant.cta.href}
                            className={`inline-block text-center px-6 py-3 rounded-lg font-semibold text-sm ${variant.cta.style}`}
                        >
                            {variant.cta.label}
                        </a>
                    )}
                    <a
                        href="https://lin.ee/j1DjGlk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-center px-6 py-3 rounded-lg font-semibold text-sm bg-green-500 hover:bg-green-600 text-white"
                    >
                        LINE 聯絡客服
                    </a>
                </div>
            </div>
        </main>
    );
}

export default function PaymentFailedPage() {
    return (
        <Suspense fallback={<div className="max-w-xl mx-auto px-6 py-16 text-center text-gray-500">載入中…</div>}>
            <PaymentFailedContent />
        </Suspense>
    );
}
