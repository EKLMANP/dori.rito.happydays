'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import StepIndicator from '@/components/booking/StepIndicator';
import DynamicForm from '@/components/booking/DynamicForm';
import DateTimePicker from '@/components/booking/DateTimePicker';
import BookingSummary from '@/components/booking/BookingSummary';
import { trackEvent } from '@/lib/analytics';

const DEFAULT_SERVICE = 'online-consult';

/**
 * Booking Wizard — 3-step flow (全程不跳轉)
 *
 * Step 1: Dynamic questionnaire form
 * Step 2: Date & time slot selection
 * Step 3: Order summary + ECPay embedded payment
 *
 * On payment success, ECPay redirects to /booking/confirmation
 */
export default function BookingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">載入中...</p>
                </div>
            </div>
        }>
            <BookingWizard />
        </Suspense>
    );
}

function BookingWizard() {
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('service') || DEFAULT_SERVICE;

    // Wizard state
    const [step, setStep] = useState(1);

    // Step 1: Form
    const [formSections, setFormSections] = useState([]);
    const [formResponses, setFormResponses] = useState({});
    const [currentSection, setCurrentSection] = useState(0);
    const [formLoading, setFormLoading] = useState(true);

    // Step 2: Slot
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Notion CRM
    const [notionPageId, setNotionPageId] = useState(null);

    // Step 3: Payment
    const [paymentFormHtml, setPaymentFormHtml] = useState(null);
    const [bookingData, setBookingData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    // Fetch form schema on mount
    useEffect(() => {
        trackEvent('booking_start', { service_id: serviceId });

        async function loadForm() {
            try {
                const res = await fetch(`/api/booking/form?service_id=${serviceId}`);
                if (!res.ok) {
                    throw new Error(`API returned ${res.status}`);
                }
                const data = await res.json();
                setFormSections(data);
            } catch (err) {
                console.error('Failed to load form:', err);
                setError('無法載入問卷，請重新整理頁面');
            }
            setFormLoading(false);
        }
        loadForm();
    }, [serviceId]);

    // Form field change handler
    const handleFieldChange = useCallback((fieldId, value) => {
        setFormResponses(prev => ({ ...prev, [String(fieldId)]: value }));
    }, []);

    // Section navigation (from DynamicForm)
    function handleSectionChange(next) {
        if (next === 'complete') {
            // All sections done — move to step 2
            trackEvent('questionnaire_submit', {
                service_id: serviceId,
                total_fields: Object.keys(formResponses).length,
            });
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Non-blocking: create Notion customer page with Q&A
            // Runs in background — failure does NOT block the booking flow
            fetch('/api/booking/questionnaire-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formSections, formResponses }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.notionPageId) {
                        setNotionPageId(data.notionPageId);
                        console.log('[booking] Notion page created:', data.notionPageId);
                    }
                    if (data.warning) {
                        console.warn('[booking] Notion warning:', data.warning);
                    }
                })
                .catch(err => {
                    console.warn('[booking] Notion submit failed (non-blocking):', err);
                });

            return;
        }
        setCurrentSection(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Track section completion
        if (next > 0) {
            const completedSection = formSections[next - 1];
            trackEvent('questionnaire_section_complete', {
                section_name: completedSection?.title,
                field_count: completedSection?.fields?.length || 0,
            });
        }
    }

    // Slot selection handler (from DateTimePicker)
    function handleSlotSelect({ date, time, start, end }) {
        trackEvent('slot_time_select', {
            service_id: serviceId,
            datetime: `${date} ${time}`,
        });
        setSelectedSlot({ date, time, start, end });
        // Auto-advance to step 3
        advanceToPayment(date, time);
    }

    // Advance to payment step
    async function advanceToPayment(date, time) {
        setStep(3);
        setIsProcessing(true);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Extract customer info from form responses
        const customerInfo = extractCustomerInfo(formSections, formResponses);

        trackEvent('payment_view', {
            service_id: serviceId,
            price: customerInfo.price,
        });

        try {
            const res = await fetch('/api/booking/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId,
                    slotDate: date,
                    slotTime: time,
                    formResponses,
                    formSections,
                    customerName: customerInfo.name,
                    email: customerInfo.email,
                    phone: customerInfo.phone,
                    dogName: customerInfo.dogName,
                    notionPageId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '建立訂單失敗');
            }

            setPaymentFormHtml(data.paymentFormHtml);
            setBookingData(data.bookingData);
        } catch (err) {
            console.error('Failed to create booking:', err);
            setError(err.message || '建立訂單時發生錯誤，請重試');
            trackEvent('payment_fail', { error_type: err.message });
        }

        setIsProcessing(false);
    }

    // Submit payment (fallback button when no ECPay HTML)
    function handleSubmitPayment() {
        if (!bookingData) return;
        trackEvent('payment_start', {
            merchant_trade_no: bookingData.merchantTradeNo,
        });
        // ECPay form auto-submits via iframe; this is a fallback
        setIsProcessing(true);
    }

    // Navigation handlers
    function goBackToForm() {
        setStep(1);
        setSelectedSlot(null);
        setPaymentFormHtml(null);
        setBookingData(null);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function goBackToSlots() {
        setStep(2);
        setPaymentFormHtml(null);
        setBookingData(null);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (formLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">載入問卷中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
            <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
                {/* Page title */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        預約線上諮詢
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        一對一線上諮詢，讓我們一起幫助你和毛孩
                    </p>
                </div>

                {/* Step indicator */}
                <StepIndicator currentStep={step} />

                {/* Error banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-2 text-red-500 hover:text-red-700 font-medium"
                        >
                            關閉
                        </button>
                    </div>
                )}

                {/* Step content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    {step === 1 && (
                        <DynamicForm
                            sections={formSections}
                            responses={formResponses}
                            onChange={handleFieldChange}
                            currentSection={currentSection}
                            onSectionChange={handleSectionChange}
                        />
                    )}

                    {step === 2 && (
                        <DateTimePicker
                            serviceId={serviceId}
                            onSelect={handleSlotSelect}
                            onBack={goBackToForm}
                        />
                    )}

                    {step === 3 && (
                        <BookingSummary
                            bookingData={bookingData || {
                                serviceName: '載入中...',
                                slotDate: selectedSlot?.date || '',
                                slotTime: selectedSlot?.time || '',
                                customerName: '',
                                dogName: '',
                                price: 0,
                            }}
                            paymentFormHtml={paymentFormHtml}
                            isProcessing={isProcessing}
                            onBack={goBackToSlots}
                            onSubmitPayment={handleSubmitPayment}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Extract customer info from form responses by matching field labels.
 * Maps form field IDs to known customer properties.
 */
function extractCustomerInfo(sections, responses) {
    let name = '';
    let email = '';
    let phone = '';
    let dogName = '';

    const labelMap = {
        '怎麼稱呼你': 'name',
        '姓名': 'name',
        '聯絡 Email': 'email',
        'Email': 'email',
        '聯絡手機': 'phone',
        '聯絡電話': 'phone',
        '手機': 'phone',
        '狗狗名字': 'dogName',
    };

    for (const section of sections) {
        for (const field of section.fields || []) {
            const val = responses[String(field.id)];
            if (!val) continue;

            // Check label matches
            for (const [pattern, prop] of Object.entries(labelMap)) {
                if (field.label.includes(pattern)) {
                    if (prop === 'name') name = val;
                    if (prop === 'email') email = val;
                    if (prop === 'phone') phone = val;
                    if (prop === 'dogName') dogName = val;
                    break;
                }
            }

            // Also match by field_type for email
            if (field.field_type === 'email' && !email) {
                email = val;
            }
        }
    }

    return { name, email, phone, dogName };
}
