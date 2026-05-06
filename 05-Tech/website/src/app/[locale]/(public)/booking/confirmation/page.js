'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BRAND } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';

export default function BookingConfirmationPage() {
    const t = useTranslations('booking');
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">{t('page.loading')}</p>
                </div>
            </div>
        }>
            <ConfirmationContent />
        </Suspense>
    );
}

function classifyPaymentType(paymentInfo) {
    const type = paymentInfo?.paymentType || '';
    if (type.startsWith('ATM') || type.startsWith('WebATM')) return 'ATM';
    if (type === 'CVS' || type.startsWith('CVS_')) return 'CVS';
    if (type === 'BARCODE' || type.startsWith('BARCODE_')) return 'BARCODE';
    return 'OTHER';
}

function PendingPaymentView({ orderNo, orderData }) {
    const t = useTranslations('booking.confirmation.pending');
    const tConfirm = useTranslations('booking.confirmation');
    const info = orderData?.paymentInfo || {};
    const kind = classifyPaymentType(info);
    const price = orderData?.price;

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
            <div className="max-w-lg mx-auto px-4 py-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">⏳</span>
                    </div>
                    <h1 className="text-2xl font-bold text-amber-700 mb-6">
                        {t('title')}
                    </h1>

                    {kind === 'ATM' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
                            <p className="text-xs text-gray-500 mb-1">{t('bankCode')}</p>
                            <p className="text-lg font-mono font-bold text-gray-800 mb-3">{info.bankCode || '—'}</p>
                            <p className="text-xs text-gray-500 mb-1">{t('virtualAccount')}</p>
                            <p className="text-lg font-mono font-bold text-gray-800 mb-3 break-all">{info.vAccount || '—'}</p>
                            <p className="text-xs text-gray-500 mb-1">{t('amount')}</p>
                            <p className="text-lg font-bold text-gray-800 mb-3">NT$ {price ?? '—'}</p>
                            <p className="text-xs text-gray-500 mb-1">{t('payBefore')}</p>
                            <p className="text-sm font-medium text-amber-700">{info.expireDate || '—'}</p>
                        </div>
                    )}

                    {kind === 'CVS' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
                            <p className="text-xs text-gray-500 mb-1">{t('cvsCode')}</p>
                            <p className="text-xl font-mono font-bold text-gray-800 mb-3 break-all">{info.paymentNo || '—'}</p>
                            <p className="text-xs text-gray-500 mb-1">{t('amount')}</p>
                            <p className="text-lg font-bold text-gray-800 mb-3">NT$ {price ?? '—'}</p>
                            <p className="text-xs text-gray-500 mb-1">{t('payBefore')}</p>
                            <p className="text-sm font-medium text-amber-700">{info.expireDate || '—'}</p>
                            {info.paymentURL && (
                                <a href={info.paymentURL} target="_blank" rel="noopener noreferrer"
                                    className="inline-block mt-3 text-sm text-brand-orange underline">
                                    查看繳費說明 →
                                </a>
                            )}
                        </div>
                    )}

                    {kind === 'BARCODE' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
                            <p className="text-xs text-gray-500 mb-2">{t('barcode')} — {t('barcodeDesc')}</p>
                            {[info.barcode1, info.barcode2, info.barcode3].filter(Boolean).map((b, i) => (
                                <p key={i} className="text-xs font-mono text-gray-700 mb-1 break-all">
                                    Code{i + 1}: {b}
                                </p>
                            ))}
                            <p className="text-xs text-gray-500 mt-3 mb-1">{t('amount')}</p>
                            <p className="text-lg font-bold text-gray-800 mb-3">NT$ {price ?? '—'}</p>
                            <p className="text-xs text-gray-500 mb-1">{t('payBefore')}</p>
                            <p className="text-sm font-medium text-amber-700">{info.expireDate || '—'}</p>
                            {info.paymentURL && (
                                <a href={info.paymentURL} target="_blank" rel="noopener noreferrer"
                                    className="inline-block mt-3 text-sm text-brand-orange underline">
                                    查看繳費說明 →
                                </a>
                            )}
                        </div>
                    )}

                    <div className="text-left text-sm text-gray-600 leading-relaxed mb-6">
                        <p>{t('afterPayment')}</p>
                    </div>

                    {orderNo && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="text-xs text-gray-400 mb-1">{tConfirm('success.orderRef')}</p>
                            <p className="text-sm font-mono font-medium text-gray-700">{orderNo}</p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/" className="px-6 py-3 bg-brand-orange text-white rounded-xl font-medium hover:opacity-90">
                            {t('homeBtn')}
                        </Link>
                        <Link href="/contact" className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">
                            {t('contactBtn')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ConfirmationContent() {
    const t = useTranslations('booking.confirmation');
    const searchParams = useSearchParams();
    const orderNo = searchParams.get('order');
    const [status, setStatus] = useState('loading');
    const [orderData, setOrderData] = useState(null);

    useEffect(() => {
        if (!orderNo) {
            setStatus('error');
            return;
        }

        trackEvent('booking_complete', { booking_id: orderNo });

        let cancelled = false;
        let attempts = 0;
        const maxAttempts = 15;

        async function check() {
            try {
                const res = await fetch(`/api/booking/status?order=${orderNo}`);
                const data = await res.json();
                if (cancelled) return;

                if (data.status === 'paid') {
                    setOrderData(data);
                    setStatus('success');
                    return true;
                }
                if (data.status === 'pending_payment') {
                    setOrderData(data);
                    setStatus('pending_payment');
                    return true;
                }
            } catch {
                /* network error, retry */
            }
            return false;
        }

        (async () => {
            const done = await check();
            if (done || cancelled) return;
            const poll = setInterval(async () => {
                attempts++;
                const ok = await check();
                if (ok || attempts >= maxAttempts) {
                    clearInterval(poll);
                    if (!ok && !cancelled) setStatus('error');
                }
            }, 2000);
        })();

        return () => { cancelled = true; };
    }, [orderNo]); // eslint-disable-line react-hooks/exhaustive-deps

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">…</p>
                </div>
            </div>
        );
    }

    if (status === 'pending_payment') {
        return <PendingPaymentView orderNo={orderNo} orderData={orderData} />;
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
                <div className="max-w-lg mx-auto px-4 py-16 text-center">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">❌</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('error.notFound')}</h1>
                        <p className="text-gray-500 mb-6">{t('error.notFoundDesc')}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/booking" className="px-6 py-3 bg-brand-orange text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
                                {t('error.bookAgainBtn')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success
    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
            <div className="max-w-lg mx-auto px-4 py-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🎉</span>
                    </div>

                    <h1 className="text-2xl font-bold text-brand-orange mb-4">
                        {t('success.title')}
                    </h1>

                    <p className="text-sm text-gray-700 leading-relaxed mb-6 text-left">
                        {t('success.message')}
                    </p>

                    {/* LINE CTA button */}
                    <a
                        href={BRAND.lineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 shadow-lg mb-6"
                        style={{ backgroundColor: '#06C755' }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                        {t('success.lineBtn')}
                    </a>

                    {orderNo && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="text-xs text-gray-400 mb-1">{t('success.orderRef')}</p>
                            <p className="text-sm font-mono font-medium text-gray-700">{orderNo}</p>
                        </div>
                    )}

                    <div className="text-left space-y-4 mb-8">
                        <h2 className="text-lg font-bold text-gray-800">{t('success.nextSteps')}</h2>

                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-sm">📅</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">{t('success.calendarStep')}</p>
                                <p className="text-xs text-gray-500">{t('success.calendarDesc')}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm">💬</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">{t('success.lineStep')}</p>
                                <p className="text-xs text-gray-500">{t('success.lineDesc')}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-sm">💻</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">{t('success.prepStep')}</p>
                                <p className="text-xs text-gray-500">{t('success.prepDesc')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/" className="px-6 py-3 bg-brand-orange text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
                            {t('success.homeBtn')}
                        </Link>
                        <a
                            href={BRAND.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            {t('success.igBtn')}
                        </a>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">{t('success.ecpayNote')}</p>
                </div>
            </div>
        </div>
    );
}
