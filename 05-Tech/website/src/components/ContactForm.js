'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ContactForm() {
    const t = useTranslations('contact.form');
    const collabTypes = t.raw('collabTypes');

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        types: [],
        message: '',
    });
    const [status, setStatus] = useState('idle');

    const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

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

            setStatus(res.ok ? 'success' : 'error');
        } catch {
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="text-center py-12 px-6">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('successTitle')}</h3>
                <p className="text-gray-600">{t('successMessage')}</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="contact-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('nameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder={t('namePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                />
            </div>

            <div>
                <label htmlFor="contact-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('phoneLabel')}
                </label>
                <input
                    id="contact-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder={t('phonePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                />
            </div>

            <div>
                <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('emailLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('typesLabel')}
                </label>
                <div className="space-y-2">
                    {collabTypes.map((type) => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={form.types.includes(type)}
                                onChange={() => toggleType(type)}
                                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">{type}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label htmlFor="contact-message" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('messageLabel')}
                </label>
                <textarea
                    id="contact-message"
                    value={form.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    placeholder={t('messagePlaceholder')}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition resize-none"
                />
            </div>

            <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? t('submitting') : t('submit')}
            </button>

            {status === 'error' && (
                <p className="text-center text-red-500 text-sm mt-2">{t('errorMessage')}</p>
            )}
        </form>
    );
}
