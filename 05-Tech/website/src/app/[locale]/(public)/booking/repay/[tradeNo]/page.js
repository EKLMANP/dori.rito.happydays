'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import BookingSummary from '@/components/booking/BookingSummary';

export default function RepayPage({ params }) {
    const { tradeNo } = use(params);
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const t = useTranslations('booking.repay');

    const [info, setInfo] = useState(null);
    const [error, setError] = useState(null);
    const [paymentFormHtml, setPaymentFormHtml] = useState(null);
    const [bookingData, setBookingData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!tradeNo || !token) {
            setError(t('invalidLink'));
            return;
        }
        fetch(`/api/booking/repay?tradeNo=${encodeURIComponent(tradeNo)}&token=${token}`)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || t('invalidLink'));
                setInfo(data);
                setBookingData(data.bookingData);
            })
            .catch((err) => setError(err.message));
    }, [tradeNo, token]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleConfirmRepay() {
        setIsProcessing(true);
        setError(null);
        try {
            const res = await fetch('/api/booking/repay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tradeNo, token }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || t('cannotProceed'));
            setPaymentFormHtml(data.paymentFormHtml);
            setBookingData(data.bookingData);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    }

    if (error) {
        return (
            <main className="max-w-xl mx-auto px-6 py-16">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h1 className="text-lg font-semibold text-red-800 mb-2">{t('cannotProceed')}</h1>
                    <p className="text-sm text-red-700">{error}</p>
                    <Link href="/booking" className="inline-block mt-4 text-sm text-brand-orange hover:underline">
                        {t('bookAgainBtn')}
                    </Link>
                </div>
            </main>
        );
    }

    if (!info) {
        return (
            <main className="max-w-xl mx-auto px-6 py-16 text-center text-gray-500">
                {t('loading')}
            </main>
        );
    }

    return (
        <main className="max-w-xl mx-auto px-6 py-12">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
                <p className="text-sm text-gray-600 mt-2">{t('warning')}</p>
            </header>

            <BookingSummary
                bookingData={bookingData}
                paymentFormHtml={paymentFormHtml}
                isProcessing={isProcessing}
                onBack={() => window.history.back()}
                onSubmitPayment={handleConfirmRepay}
            />
        </main>
    );
}
