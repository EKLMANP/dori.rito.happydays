'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdminPin } from './AdminPinGate';

const TRAINERS = ['Eric Pan', 'Pennee Tan'];
const TRANSPORT_TYPES = ['捷運', '客運', '其他'];
const COMMUTE_RATE = 300; // 顯示用，實際計算在 API 端

function getTodayStr() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
}

export default function LessonCostForm() {
    const { adminFetch } = useAdminPin();
    const [form, setForm] = useState({
        trainer: '',
        customerId: '',
        customerName: '',
        date: getTodayStr(),
        parkingFee: '',
        transportType: '捷運',
        transportFee: '',
        commuteMinutes: '',
        notes: '',
    });
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [summary, setSummary] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // 搜尋客戶
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const url = customerSearch
                    ? `/api/admin/customers?search=${encodeURIComponent(customerSearch)}`
                    : '/api/admin/customers';
                const res = await adminFetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setCustomers(data.customers || []);
                }
            } catch {
                // ignore
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [customerSearch, adminFetch]);

    // 點擊外部關閉下拉
    useEffect(() => {
        function handleClick(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const selectCustomer = (customer) => {
        setForm(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name,
        }));
        setCustomerSearch(customer.dogName ? `${customer.name} (${customer.dogName})` : customer.name);
        setShowDropdown(false);
    };

    // 即時計算通勤成本
    const commuteMinutes = Number(form.commuteMinutes) || 0;
    const commuteCost = Math.round(commuteMinutes * (COMMUTE_RATE / 60));
    const estimatedTotal = (Number(form.parkingFee) || 0) + (Number(form.transportFee) || 0) + commuteCost;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.trainer || !form.date) return;
        setStatus('loading');

        try {
            const res = await adminFetch('/api/admin/lesson-costs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    parkingFee: Number(form.parkingFee) || 0,
                    transportFee: Number(form.transportFee) || 0,
                    commuteMinutes: Number(form.commuteMinutes) || 0,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSummary(data.summary);
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    const resetForm = () => {
        const keepTrainer = form.trainer;
        setForm({
            trainer: keepTrainer,
            customerId: '',
            customerName: '',
            date: getTodayStr(),
            parkingFee: '',
            transportType: '捷運',
            transportFee: '',
            commuteMinutes: '',
            notes: '',
        });
        setCustomerSearch('');
        setSummary(null);
        setStatus('idle');
    };

    if (status === 'success' && summary) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center max-w-lg mx-auto">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">成本已記錄！</h3>
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm mb-6">
                    <div className="flex justify-between">
                        <span className="text-gray-500">訓練師</span>
                        <span className="font-medium">{summary.trainer}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">停車費</span>
                        <span className="font-medium">${summary.parkingFee}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">交通費</span>
                        <span className="font-medium">${summary.transportFee}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">通勤成本</span>
                        <span className="font-medium">${summary.commuteCost}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                        <span>總成本</span>
                        <span className="text-orange-600">${summary.totalCost}</span>
                    </div>
                </div>
                <button
                    onClick={resetForm}
                    className="w-full py-3 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold transition"
                >
                    再記一筆
                </button>
            </div>
        );
    }

    const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition";

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-w-lg mx-auto">
            {/* 訓練師 */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    訓練師 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                    {TRAINERS.map(t => (
                        <label key={t} className="flex-1">
                            <input
                                type="radio"
                                name="trainer"
                                value={t}
                                checked={form.trainer === t}
                                onChange={e => updateField('trainer', e.target.value)}
                                className="sr-only peer"
                            />
                            <div className="text-center py-3 rounded-xl border-2 cursor-pointer transition peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-700 border-gray-200 text-gray-600 hover:border-gray-300 font-medium text-sm">
                                {t}
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* 客戶 */}
            <div ref={dropdownRef} className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    客戶
                </label>
                <input
                    type="text"
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setShowDropdown(true); updateField('customerId', ''); updateField('customerName', e.target.value); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="搜尋客戶姓名..."
                    className={inputClass}
                />
                {showDropdown && customers.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {customers.map(c => (
                            <li key={c.id}>
                                <button
                                    type="button"
                                    onClick={() => selectCustomer(c)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition text-sm"
                                >
                                    <span className="font-medium text-gray-900">{c.name}</span>
                                    {c.dogName && <span className="text-gray-400 ml-2">({c.dogName})</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 課堂日期 */}
            <div>
                <label htmlFor="lesson-date" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    課堂日期 <span className="text-red-500">*</span>
                </label>
                <input
                    id="lesson-date"
                    type="date"
                    value={form.date}
                    onChange={e => updateField('date', e.target.value)}
                    className={inputClass}
                />
            </div>

            {/* 停車費 */}
            <div>
                <label htmlFor="parking-fee" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    停車費
                </label>
                <div className="relative">
                    <input
                        id="parking-fee"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={form.parkingFee}
                        onChange={e => updateField('parkingFee', e.target.value)}
                        placeholder="0"
                        className={inputClass + ' pr-12'}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">元</span>
                </div>
            </div>

            {/* 交通方式 */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    交通方式
                </label>
                <div className="flex gap-2">
                    {TRANSPORT_TYPES.map(t => (
                        <label key={t} className="flex-1">
                            <input
                                type="radio"
                                name="transportType"
                                value={t}
                                checked={form.transportType === t}
                                onChange={e => updateField('transportType', e.target.value)}
                                className="sr-only peer"
                            />
                            <div className="text-center py-2.5 rounded-xl border-2 cursor-pointer transition peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-700 border-gray-200 text-gray-600 hover:border-gray-300 font-medium text-sm">
                                {t}
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* 交通費 */}
            <div>
                <label htmlFor="transport-fee" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    交通費
                </label>
                <div className="relative">
                    <input
                        id="transport-fee"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={form.transportFee}
                        onChange={e => updateField('transportFee', e.target.value)}
                        placeholder="0"
                        className={inputClass + ' pr-12'}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">元</span>
                </div>
            </div>

            {/* 通勤時間 */}
            <div>
                <label htmlFor="commute-minutes" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    通勤時間
                </label>
                <div className="relative">
                    <input
                        id="commute-minutes"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={form.commuteMinutes}
                        onChange={e => updateField('commuteMinutes', e.target.value)}
                        placeholder="0"
                        className={inputClass + ' pr-20'}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">分鐘</span>
                </div>
                {commuteMinutes > 0 && (
                    <p className="text-xs text-orange-600 mt-1.5">
                        = ${commuteCost} 元（以 ${COMMUTE_RATE}/hr 計算）
                    </p>
                )}
            </div>

            {/* 備註 */}
            <div>
                <label htmlFor="cost-notes" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    備註
                </label>
                <textarea
                    id="cost-notes"
                    value={form.notes}
                    onChange={e => updateField('notes', e.target.value)}
                    placeholder="選填..."
                    rows={2}
                    className={inputClass + ' resize-none'}
                />
            </div>

            {/* 預估總成本 */}
            {estimatedTotal > 0 && (
                <div className="bg-orange-50 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-800">預估總成本</span>
                    <span className="text-lg font-bold text-orange-600">${estimatedTotal} 元</span>
                </div>
            )}

            {/* 送出 */}
            <button
                type="submit"
                disabled={status === 'loading' || !form.trainer || !form.date}
                className="w-full py-3.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-base transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? '送出中...' : '記錄成本'}
            </button>

            {status === 'error' && (
                <p className="text-center text-red-500 text-sm">送出失敗，請稍後再試</p>
            )}
        </form>
    );
}
