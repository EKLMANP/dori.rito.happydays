'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BRAND } from '@/lib/constants';

// Maps URL ?reason= values to i18n keys and visual styles
const VARIANT_META = {
    expired: {
        i18nKey: 'expired',
        icon: '⏰',
        titleColor: 'text-red-800',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        showBookAgain: true,
    },
    declined: {
        i18nKey: 'failed',
        icon: '💳',
        titleColor: 'text-orange-800',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        showBookAgain: true,
    },
    unknown: {
        i18nKey: 'error',
        icon: '⚠️',
        titleColor: 'text-gray-800',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        showBookAgain: false,
    },
};

function PaymentFailedContent() {
    const t = useTranslations('booking.failed');
    const params = useSearchParams();
    const reason = params.get('reason') || 'unknown';
    const email = params.get('email');

    const meta = VARIANT_META[reason] || VARIANT_META.unknown;
    const copy = t.raw(meta.i18nKey);

    return (
        <main className="max-w-xl mx-auto px-6 py-16">
            <div className={`${meta.bgColor} border ${meta.borderColor} rounded-xl p-8`}>
                <div className="text-4xl mb-4">{meta.icon}</div>
                <h1 className={`text-xl font-bold ${meta.titleColor} mb-3`}>{copy.title}</h1>
                <p className="text-sm text-gray-700 leading-relaxed">
                    {copy.message}
                    {reason === 'declined' && email && (
                        <span className="block mt-2 font-medium">Email: {email}</span>
                    )}
                </p>

                <div className="mt-6 flex flex-col gap-3">
                    {meta.showBookAgain && (
                        <Link
                            href="/booking"
                            className="inline-block text-center px-6 py-3 rounded-lg font-semibold text-sm bg-brand-orange hover:opacity-90 text-white"
                        >
                            {t('bookAgainBtn')}
                        </Link>
                    )}
                    <a
                        href={BRAND.lineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-center px-6 py-3 rounded-lg font-semibold text-sm bg-green-500 hover:bg-green-600 text-white"
                    >
                        {t('contactBtn')}
                    </a>
                </div>
            </div>
        </main>
    );
}

export default function PaymentFailedPage() {
    const t = useTranslations('booking');
    return (
        <Suspense fallback={<div className="max-w-xl mx-auto px-6 py-16 text-center text-gray-500">{t('page.loading')}</div>}>
            <PaymentFailedContent />
        </Suspense>
    );
}
