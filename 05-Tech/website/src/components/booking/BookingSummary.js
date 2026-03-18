'use client';

import { useCallback } from 'react';

/**
 * Booking summary + payment step.
 * Shows order review and a "前往付款" button.
 *
 * Payment flow (ECPay AIO):
 *   1. Server generates signed HTML form string (see ecpay.js)
 *   2. User clicks "前往付款" → we parse form data and rebuild form via DOM API
 *   3. Form auto-submitted → browser redirects to ECPay payment page
 *   4. After payment → ECPay redirects to ClientBackURL → /booking/confirmation
 */
export default function BookingSummary({
    bookingData,
    paymentFormHtml,
    isProcessing,
    onBack,
    onSubmitPayment,
}) {
    /**
     * Parse the server-generated ECPay form HTML and rebuild it
     * using safe DOM APIs (no innerHTML). Then submit it.
     */
    const handlePayment = useCallback(() => {
        if (!paymentFormHtml) {
            onSubmitPayment?.();
            return;
        }

        // Parse the form HTML safely using DOMParser
        const parser = new DOMParser();
        const doc = parser.parseFromString(paymentFormHtml, 'text/html');
        const sourceForm = doc.querySelector('form');

        if (!sourceForm) {
            console.error('[BookingSummary] No form found in paymentFormHtml');
            onSubmitPayment?.();
            return;
        }

        // Rebuild form using safe DOM APIs
        const form = document.createElement('form');
        form.method = sourceForm.method || 'POST';
        form.action = sourceForm.action;
        form.style.display = 'none';

        // Copy all hidden inputs
        const inputs = sourceForm.querySelectorAll('input[type="hidden"]');
        for (const input of inputs) {
            const field = document.createElement('input');
            field.type = 'hidden';
            field.name = input.name;
            field.value = input.value;
            form.appendChild(field);
        }

        document.body.appendChild(form);
        form.submit();
    }, [paymentFormHtml, onSubmitPayment]);

    return (
        <div>
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">預約摘要</h3>
                <div className="space-y-3">
                    <SummaryRow label="服務" value={bookingData.serviceName} />
                    <SummaryRow label="日期" value={bookingData.slotDate} />
                    <SummaryRow label="時間" value={bookingData.slotTime} />
                    <SummaryRow label="客戶" value={bookingData.customerName} />
                    <SummaryRow label="狗狗" value={bookingData.dogName} />
                    <div className="pt-3 border-t border-gray-200">
                        <SummaryRow
                            label="金額"
                            value={`NT$ ${bookingData.price}`}
                            bold
                        />
                    </div>
                </div>
            </div>

            {/* Payment button */}
            <div className="mb-6">
                <button
                    onClick={handlePayment}
                    disabled={isProcessing || !bookingData.price}
                    className={`w-full py-3.5 rounded-xl text-white font-bold text-base transition-all ${
                        isProcessing
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-brand-orange hover:opacity-90 shadow-lg shadow-orange-200/50'
                    }`}
                >
                    {isProcessing ? '處理中...' : `前往付款 NT$ ${bookingData.price}`}
                </button>
                {paymentFormHtml && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                        點擊後將導向綠界 ECPay 安全付款頁面
                    </p>
                )}
            </div>

            {/* Back */}
            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    ← 重新選擇時段
                </button>
            </div>

            {/* Security notice */}
            <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                    🔒 付款由綠界科技 ECPay 安全處理，本站不儲存任何信用卡資訊
                </p>
            </div>
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
