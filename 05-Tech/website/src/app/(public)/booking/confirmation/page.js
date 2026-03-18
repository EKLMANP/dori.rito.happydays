'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

/**
 * Booking Confirmation — Thank You Page
 *
 * Displayed after ECPay redirects client back with successful payment.
 * Query params: ?order=MERCHANT_TRADE_NO&status=pending (optional)
 *
 * If status=pending (webhook hasn't processed yet), polls for completion.
 */
export default function BookingConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">載入中...</p>
                </div>
            </div>
        }>
            <ConfirmationContent />
        </Suspense>
    );
}

function ConfirmationContent() {
    const searchParams = useSearchParams();
    const orderNo = searchParams.get('order');
    const initialStatus = searchParams.get('status'); // 'pending' if webhook hasn't fired yet
    const [status, setStatus] = useState(initialStatus === 'pending' ? 'pending' : 'loading');

    useEffect(() => {
        if (!orderNo) {
            setStatus('error');
            return;
        }

        // Track page view
        trackEvent('booking_complete', { booking_id: orderNo });

        // If pending, poll for webhook completion; otherwise assume success
        // (ECPay only redirects here after successful payment)
        if (status === 'pending') {
            let attempts = 0;
            const maxAttempts = 10;

            const poll = setInterval(async () => {
                attempts++;
                try {
                    const res = await fetch(`/api/booking/status?order=${orderNo}`);
                    const data = await res.json();
                    if (data.processed) {
                        clearInterval(poll);
                        setStatus('success');
                    } else if (attempts >= maxAttempts) {
                        clearInterval(poll);
                        // After max attempts, show success anyway — ECPay already confirmed
                        setStatus('success');
                    }
                } catch {
                    if (attempts >= maxAttempts) {
                        clearInterval(poll);
                        setStatus('success');
                    }
                }
            }, 2000);

            return () => clearInterval(poll);
        } else {
            // Non-pending: ECPay redirected here, payment succeeded
            setStatus('success');
        }
    }, [orderNo]); // eslint-disable-line react-hooks/exhaustive-deps

    if (status === 'loading' || status === 'pending') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">確認付款狀態中...</p>
                    <p className="text-xs text-gray-400 mt-1">Processing your payment...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
                <div className="max-w-lg mx-auto px-4 py-16 text-center">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">❌</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">找不到訂單</h1>
                        <p className="text-gray-500 mb-2">
                            無法找到對應的預約訂單，請確認連結是否正確。
                        </p>
                        <p className="text-sm text-gray-400 mb-6">
                            Order not found. Please check the link.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/booking"
                                className="px-6 py-3 bg-brand-orange text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                            >
                                重新預約
                            </Link>
                            <Link
                                href="/contact"
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                聯繫我們
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Success state ──
    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
            <div className="max-w-lg mx-auto px-4 py-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    {/* Success icon */}
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🎉</span>
                    </div>

                    {/* Header — brand orange */}
                    <h1 className="text-2xl font-bold text-brand-orange mb-4">
                        付款成功！
                    </h1>

                    {/* Bilingual body */}
                    <div className="text-left space-y-3 mb-6">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            感謝你的預約，已經同步發送線上諮詢的 Google 日曆邀請，麻煩也加入我們的 LINE 官方帳號 &amp; 傳個訊息或貼圖，方便老師與你聯繫喔！
                        </p>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Thank you for your booking! A Google Calendar invite for the online consultation has been sent. As a final step, please join our LINE Official Account &amp; drop us a message to facilitate communication with the instructor.
                        </p>
                    </div>

                    {/* LINE CTA button */}
                    <a
                        href="https://lin.ee/j1DjGlk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 shadow-lg mb-6"
                        style={{ backgroundColor: '#06C755' }}
                    >
                        {/* LINE icon */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                        加入 LINE 官方帳號
                    </a>

                    {/* Order reference */}
                    {orderNo && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="text-xs text-gray-400 mb-1">訂單編號 Order Reference</p>
                            <p className="text-sm font-mono font-medium text-gray-700">
                                {orderNo}
                            </p>
                        </div>
                    )}

                    {/* Next steps */}
                    <div className="text-left space-y-4 mb-8">
                        <h2 className="text-lg font-bold text-gray-800">接下來 Next Steps</h2>

                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-sm">📅</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">Google 日曆邀請</p>
                                <p className="text-xs text-gray-500">
                                    已發送 Google Calendar 邀請（含 Google Meet 連結），請查看 Email
                                </p>
                                <p className="text-xs text-gray-400">
                                    A Google Calendar invite with Google Meet link has been sent to your email.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm">💬</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">加入 LINE 官方帳號</p>
                                <p className="text-xs text-gray-500">
                                    加入後傳個訊息或貼圖，方便老師跟你聯繫
                                </p>
                                <p className="text-xs text-gray-400">
                                    Join our LINE and send a sticker so the instructor can reach you.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-sm">💻</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">準備線上諮詢</p>
                                <p className="text-xs text-gray-500">
                                    諮詢時間前請準備好穩定的網路，使用 Google Meet 連結加入
                                </p>
                                <p className="text-xs text-gray-400">
                                    Please ensure a stable internet connection and join via the Google Meet link.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/"
                            className="px-6 py-3 bg-brand-orange text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            回到首頁
                        </Link>
                        <a
                            href="https://www.instagram.com/dori.rito.happydays/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            追蹤 IG
                        </a>
                    </div>
                </div>

                {/* Security note */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">
                        付款由綠界科技 ECPay 安全處理
                    </p>
                </div>
            </div>
        </div>
    );
}
