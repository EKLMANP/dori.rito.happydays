'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const TRAINERS = ['Eric', 'Pennee'];

export default function NewOrderPage() {
    return (
        <Suspense fallback={<div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-40 mb-6" /><div className="h-64 bg-gray-200 rounded-lg" /></div>}>
            <NewOrderContent />
        </Suspense>
    );
}

function NewOrderContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedCustomerId = searchParams.get('customerId');

    const [step, setStep] = useState(preselectedCustomerId ? 2 : 1);
    const [submitting, setSubmitting] = useState(false);
    const [confirmSubmit, setConfirmSubmit] = useState(false);

    // Step 1: Customer
    const [customerQuery, setCustomerQuery] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Step 2: Service
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    // Step 3: Details
    const [trainer, setTrainer] = useState('');
    const [sessions, setSessions] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [notes, setNotes] = useState('');

    // Pre-fetch customer if customerId is provided
    useEffect(() => {
        if (preselectedCustomerId) {
            fetch(`/api/admin/customers/${preselectedCustomerId}`)
                .then((r) => {
                    if (!r.ok) throw new Error('API error');
                    return r.json();
                })
                .then((data) => setSelectedCustomer(data))
                .catch(console.error);
        }
    }, [preselectedCustomerId]);

    // Search customers
    const handleCustomerSearch = async () => {
        if (!customerQuery.trim()) return;
        setSearching(true);
        try {
            const res = await fetch('/api/admin/customers/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: customerQuery.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { console.error('API error:', data.error); return; }
            setCustomerResults(data.customers || []);
        } catch (err) {
            console.error('Customer search failed:', err);
        } finally {
            setSearching(false);
        }
    };

    // Fetch services when entering step 2
    useEffect(() => {
        if (step === 2 && services.length === 0) {
            setLoadingServices(true);
            fetch('/api/admin/services?activeOnly=true')
                .then((r) => {
                    if (!r.ok) throw new Error('API error');
                    return r.json();
                })
                .then((data) => setServices(data.services || []))
                .catch(console.error)
                .finally(() => setLoadingServices(false));
        }
    }, [step, services.length]);

    const handleSelectService = (service) => {
        setSelectedService(service);
        setSessions(service.defaultSessions?.toString() || '');
        setUnitPrice(service.suggestedPrice?.toString() || '');
    };

    const totalAmount = (Number(sessions) || 0) * (Number(unitPrice) || 0);

    const handleSubmitClick = () => {
        if (!selectedCustomer || !selectedService || !trainer || !sessions || !unitPrice) return;
        setConfirmSubmit(true);
    };

    const handleSubmitConfirm = async (dialogNotes) => {
        setSubmitting(true);
        try {
            const orderNotes = [notes, dialogNotes].filter(Boolean).join('\n');
            const res = await fetch('/api/admin/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: selectedCustomer.id,
                    serviceId: selectedService.id,
                    trainer,
                    sessions: Number(sessions),
                    unitPrice: Number(unitPrice),
                    notes: orderNotes,
                }),
            });
            const data = await res.json();
            if (res.ok && data.id) {
                setConfirmSubmit(false);
                router.push(`/admin/orders/${data.id}`);
            } else {
                alert(data.error || '建立訂單失敗');
            }
        } catch (err) {
            console.error('Failed to create order:', err);
            alert('建立訂單失敗');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => router.push('/admin/orders')} className="text-gray-500 hover:text-gray-700">
                    &larr;
                </button>
                <h1 className="text-2xl font-bold text-gray-900">新增訂單</h1>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
                {[
                    { num: 1, label: '選擇客戶' },
                    { num: 2, label: '選擇服務' },
                    { num: 3, label: '訂單資訊' },
                ].map(({ num, label }) => (
                    <div key={num} className="flex items-center gap-2">
                        {num > 1 && <div className="w-8 h-px bg-gray-300" />}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                            step === num
                                ? 'bg-blue-100 text-blue-700'
                                : step > num
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                        }`}>
                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-xs">
                                {step > num ? '✓' : num}
                            </span>
                            {label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Step 1: Select Customer */}
            {step === 1 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">選擇客戶</h2>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={customerQuery}
                            onChange={(e) => setCustomerQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
                            placeholder="搜尋客戶名稱或電話..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <button
                            onClick={handleCustomerSearch}
                            disabled={searching}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                            {searching ? '搜尋中...' : '搜尋'}
                        </button>
                    </div>

                    {customerResults.length > 0 && (
                        <div className="space-y-2">
                            {customerResults.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => {
                                        setSelectedCustomer(c);
                                        setStep(2);
                                    }}
                                    className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                >
                                    <p className="font-medium text-gray-900">{c.name}</p>
                                    {c.phone && <p className="text-sm text-gray-500">{c.phone}</p>}
                                </button>
                            ))}
                        </div>
                    )}

                    {customerResults.length === 0 && customerQuery && !searching && (
                        <p className="text-sm text-gray-500">沒有找到符合的客戶</p>
                    )}
                </div>
            )}

            {/* Step 2: Select Service */}
            {step === 2 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">選擇服務</h2>

                    {selectedCustomer && (
                        <p className="text-sm text-gray-500 mb-4">
                            客戶：<span className="font-medium text-gray-700">{selectedCustomer.name}</span>
                        </p>
                    )}

                    {loadingServices ? (
                        <div className="animate-pulse space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {services.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        handleSelectService(s);
                                        setStep(3);
                                    }}
                                    className={`w-full text-left px-4 py-3 border rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors ${
                                        selectedService?.id === s.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{s.name}</p>
                                            {s.description && <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>}
                                        </div>
                                        <div className="text-right text-sm text-gray-500">
                                            <p>{s.defaultSessions} 堂</p>
                                            <p>${s.suggestedPrice?.toLocaleString()}/堂</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => setStep(1)}
                        className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                    >
                        &larr; 上一步
                    </button>
                </div>
            )}

            {/* Step 3: Order Details */}
            {step === 3 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">訂單資訊</h2>

                    <div className="text-sm text-gray-500 mb-4 space-y-1">
                        <p>客戶：<span className="font-medium text-gray-700">{selectedCustomer?.name}</span></p>
                        <p>服務：<span className="font-medium text-gray-700">{selectedService?.name}</span></p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">訓犬師</label>
                            <select
                                value={trainer}
                                onChange={(e) => setTrainer(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                            >
                                <option value="">請選擇訓犬師</option>
                                {TRAINERS.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">課堂數</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={sessions}
                                    onChange={(e) => setSessions(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">單堂報價</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
                            <p className="text-sm text-blue-700">
                                總金額：<span className="text-lg font-bold">${totalAmount.toLocaleString()}</span>
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        <button
                            onClick={() => setStep(2)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            &larr; 上一步
                        </button>
                        <button
                            onClick={handleSubmitClick}
                            disabled={submitting || !trainer || !sessions || !unitPrice}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                            {submitting ? '建立中...' : '建立訂單'}
                        </button>
                    </div>
                </div>
            )}

            {/* Confirm Submit Dialog */}
            <ConfirmDialog
                open={confirmSubmit}
                title="確認建立訂單"
                variant="default"
                confirmLabel="確認建立"
                onConfirm={handleSubmitConfirm}
                onCancel={() => setConfirmSubmit(false)}
            >
                <p>確認要建立以下訂單嗎？</p>
                <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                    <p><strong>客戶</strong>：{selectedCustomer?.name}</p>
                    <p><strong>服務</strong>：{selectedService?.name}</p>
                    <p><strong>訓犬師</strong>：{trainer}</p>
                    <p><strong>課堂數</strong>：{sessions} 堂</p>
                    <p><strong>單堂報價</strong>：${Number(unitPrice || 0).toLocaleString()}</p>
                    <p><strong>總金額</strong>：${totalAmount.toLocaleString()}</p>
                </div>
            </ConfirmDialog>
        </div>
    );
}
