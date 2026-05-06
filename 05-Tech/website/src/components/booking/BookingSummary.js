'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function BookingSummary({
    bookingData,
    paymentFormHtml,
    paypalInfo,
    isProcessing,
    onBack,
    onSubmitPayment,
    onSelectProvider,
}) {
    const t = useTranslations('booking.summary');

    const handleEcpayPayment = useCallback(() => {
        if (!paymentFormHtml) {
            onSubmitPayment?.();
            return;
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(paymentFormHtml, 'text/html');
        const sourceForm = doc.querySelector('form');
        if (!sourceForm) {
            console.error('[BookingSummary] No form found in paymentFormHtml');
            onSubmitPayment?.();
            return;
        }
        const form = document.createElement('form');
        form.method = sourceForm.method || 'POST';
        form.action = sourceForm.action;
        form.style.display = 'none';
        for (const input of sourceForm.querySelectorAll('input[type="hidden"]')) {
            const field = document.createElement('input');
            field.type = 'hidden';
            field.name = input.name;
            field.value = input.value;
            form.appendChild(field);
        }
        document.body.appendChild(form);
        form.submit();
    }, [paymentFormHtml, onSubmitPayment]);

    const showPicker = !paymentFormHtml && !paypalInfo;

    return (
        <div>
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{t('title')}</h3>
                <div className="space-y-3">
                    <SummaryRow label={t('service')} value={bookingData.serviceName} />
                    <SummaryRow label={t('date')} value={bookingData.slotDate} />
                    <SummaryRow label={t('time')} value={bookingData.slotTime} />
                    <SummaryRow label={t('customer')} value={bookingData.customerName} />
                    <SummaryRow label={t('dog')} value={bookingData.dogName} />
                    <div className="pt-3 border-t border-gray-200">
                        <SummaryRow
                            label={t('amount')}
                            value={
                                paypalInfo
                                    ? `${paypalInfo.currency} $${paypalInfo.value}`
                                    : `NT$ ${bookingData.price}`
                            }
                            bold
                        />
                    </div>
                </div>
            </div>

            {/* Stage A: payment method picker */}
            {showPicker && (
                <PaymentMethodPicker
                    isProcessing={isProcessing}
                    onSelectProvider={onSelectProvider}
                    t={t}
                />
            )}

            {/* Stage B-ECPay */}
            {paymentFormHtml && (
                <div className="mb-6">
                    <button
                        onClick={handleEcpayPayment}
                        disabled={isProcessing || !bookingData.price}
                        className={`w-full py-3.5 rounded-xl text-white font-bold text-base transition-all ${
                            isProcessing
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-brand-orange hover:opacity-90 shadow-lg shadow-orange-200/50'
                        }`}
                    >
                        {isProcessing ? '…' : `${t('payBtn')} ${bookingData.price}`}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2">
                        {t('ecpayNote')}
                    </p>
                </div>
            )}

            {/* Stage B-PayPal */}
            {paypalInfo && (
                <PaypalButtons paypalInfo={paypalInfo} t={t} />
            )}

            {/* Back */}
            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {t('backToCalendar')}
                </button>
            </div>

            {/* Security notice */}
            <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                    {t('securityNote')}
                </p>
            </div>
        </div>
    );
}

function PaymentMethodPicker({ isProcessing, onSelectProvider, t }) {
    return (
        <div className="mb-6 space-y-3">
            <p className="text-sm font-medium text-gray-700 mb-3">{t('paymentMethod')}</p>
            <button
                onClick={() => onSelectProvider?.('ecpay')}
                disabled={isProcessing}
                className={`w-full py-3.5 rounded-xl text-white font-bold text-base transition-all ${
                    isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-brand-orange hover:opacity-90 shadow-lg shadow-orange-200/50'
                }`}
            >
                {t('ecpayLabel')}
            </button>
            <button
                onClick={() => onSelectProvider?.('paypal')}
                disabled={isProcessing}
                className={`w-full py-3.5 rounded-xl font-bold text-base transition-all border ${
                    isProcessing
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-[#ffc439] text-[#003087] border-[#003087]/20 hover:opacity-90 shadow-lg shadow-yellow-200/50'
                }`}
            >
                {t('paypalLabel')}
            </button>
            <p className="text-xs text-gray-400 text-center pt-2">
                {t('paypalHint')}
            </p>
        </div>
    );
}

function PaypalButtons({ paypalInfo, t }) {
    const containerRef = useRef(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const clientId = paypalInfo.clientId;
        if (!clientId) {
            setError(t('paypalNotConfigured'));
            return;
        }

        // Map next-intl locale → PayPal locale code
        const paypalLocale = paypalInfo.locale === 'en' ? 'en_US' : 'zh_TW';
        const sdkSrc = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(paypalInfo.currency)}&intent=capture&locale=${paypalLocale}`;

        let canceled = false;

        function render() {
            if (canceled || !window.paypal || !containerRef.current) return;
            const node = containerRef.current;
            while (node.firstChild) node.removeChild(node.firstChild);
            window.paypal
                .Buttons({
                    createOrder: () => paypalInfo.orderId,
                    onApprove: async (data) => {
                        setSubmitting(true);
                        try {
                            const res = await fetch('/api/booking/paypal-capture', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    paypalOrderId: data.orderID,
                                    merchantTradeNo: paypalInfo.merchantTradeNo,
                                }),
                            });
                            const json = await res.json();
                            if (!res.ok) throw new Error(json.error || t('paypalChargeFailed'));
                            window.location.href = json.redirectUrl;
                        } catch (err) {
                            console.error('[PayPal] capture failed:', err);
                            setError(err.message || t('paypalChargeFailed'));
                            setSubmitting(false);
                        }
                    },
                    onError: (err) => {
                        console.error('[PayPal] SDK error:', err);
                        setError(t('paypalError'));
                    },
                })
                .render(node);
        }

        const existing = document.querySelector(`script[data-paypal-sdk="${clientId}"]`);
        if (existing && window.paypal) {
            render();
        } else if (existing) {
            existing.addEventListener('load', render, { once: true });
        } else {
            const script = document.createElement('script');
            script.src = sdkSrc;
            script.async = true;
            script.dataset.paypalSdk = clientId;
            script.onload = render;
            script.onerror = () => setError(t('paypalLoadError'));
            document.head.appendChild(script);
        }

        return () => { canceled = true; };
    }, [paypalInfo, t]);

    return (
        <div className="mb-6">
            {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}
            <div ref={containerRef} className={submitting ? 'opacity-50 pointer-events-none' : ''} />
            {submitting && (
                <p className="text-xs text-gray-500 text-center mt-2">{t('paypalProcessing')}</p>
            )}
            <p className="text-xs text-gray-400 text-center mt-2">
                You will be charged {paypalInfo.currency} ${paypalInfo.value}
            </p>
        </div>
    );
}

function SummaryRow({ label, value, bold }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{label}</span>
            <span className={`text-sm ${bold ? 'font-bold text-brand-orange text-base' : 'text-gray-800 font-medium'}`}>
                {value}
            </span>
        </div>
    );
}
