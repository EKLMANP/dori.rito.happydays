'use client';

import { useState } from 'react';

const COLLAB_TYPES = [
    '品牌合作(寵物用品、飼料、保健食品等)',
    '媒體採訪',
    '活動邀約(演講、工作方、Podcast等)',
    '其他',
];

export default function ContactForm() {
    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        types: [],
        message: '',
    });
    const [status, setStatus] = useState('idle'); // idle | loading | success | error

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const toggleType = (type) => {
        setForm((prev) => ({
            ...prev,
            types: prev.types.includes(type)
                ? prev.types.filter((t) => t !== type)
                : [...prev.types, type],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.includes('@')) return;
        setStatus('loading');

        try {
            // GA4 event tracking
            if (typeof gtag !== 'undefined') {
                gtag('event', 'collaboration_inquiry', {
                    event_category: 'engagement',
                    event_label: form.types.join(', ') || 'unspecified',
                });
            }

            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="text-center py-12 px-6">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">感謝您的合作提案！</h3>
                <p className="text-gray-600">我們將在 3 個工作天內回覆您。</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* 怎麼稱呼您 */}
            <div>
                <label htmlFor="contact-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    怎麼稱呼您 <span className="text-red-500">*</span>
                </label>
                <input
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="您的稱呼"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                />
            </div>

            {/* 聯絡電話 */}
            <div>
                <label htmlFor="contact-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    聯絡電話
                </label>
                <input
                    id="contact-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="09xx-xxx-xxx"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                />
            </div>

            {/* 聯絡 Email */}
            <div>
                <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    聯絡 Email <span className="text-red-500">*</span>
                </label>
                <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                />
            </div>

            {/* 合作類型 */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    合作類型
                </label>
                <div className="space-y-2">
                    {COLLAB_TYPES.map((type) => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={form.types.includes(type)}
                                onChange={() => toggleType(type)}
                                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">
                                {type}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* 關於合作想法 */}
            <div>
                <label htmlFor="contact-message" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    關於合作想法
                </label>
                <textarea
                    id="contact-message"
                    value={form.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    placeholder="請簡述您的合作想法..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition resize-none"
                />
            </div>

            {/* 送出按鈕 */}
            <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? '送出中...' : '送出'}
            </button>

            {status === 'error' && (
                <p className="text-center text-red-500 text-sm mt-2">
                    送出失敗，請稍後再試。
                </p>
            )}
        </form>
    );
}
