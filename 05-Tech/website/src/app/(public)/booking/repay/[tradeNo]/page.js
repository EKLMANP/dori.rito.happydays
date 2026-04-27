'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import BookingSummary from '@/components/booking/BookingSummary';

/**
 * 重新選擇付款方式頁面。
 * 入口：付款待繳款 email 中的「重新選擇付款方式」按鈕。
 * URL: /booking/repay/[tradeNo]?token=<hmac>
 */
export default function RepayPage({ params }) {
    const { tradeNo } = use(params);
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [info, setInfo] = useState(null);
    const [error, setError] = useState(null);
    const [paymentFormHtml, setPaymentFormHtml] = useState(null);
    const [bookingData, setBookingData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!tradeNo || !token) {
            setError('連結缺少必要參數');
            return;
        }
        fetch(`/api/booking/repay?tradeNo=${encodeURIComponent(tradeNo)}&token=${token}`)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || '驗證失敗');
                setInfo(data);
                setBookingData(data.bookingData);
            })
            .catch((err) => setError(err.message));
    }, [tradeNo, token]);

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
            if (!res.ok) throw new Error(data.error || '建立新訂單失敗');
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
                    <h1 className="text-lg font-semibold text-red-800 mb-2">無法繼續付款</h1>
                    <p className="text-sm text-red-700">{error}</p>
                    <a href="/booking" className="inline-block mt-4 text-sm text-orange-600 hover:underline">
                        重新預約 →
                    </a>
                </div>
            </main>
        );
    }

    if (!info) {
        return (
            <main className="max-w-xl mx-auto px-6 py-16 text-center text-gray-500">
                載入訂單中…
            </main>
        );
    }

    return (
        <main className="max-w-xl mx-auto px-6 py-12">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">重新選擇付款方式</h1>
                <p className="text-sm text-gray-600 mt-2">
                    確認後，原本的付款代碼將作廢，並產生新的訂單編號。
                </p>
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
