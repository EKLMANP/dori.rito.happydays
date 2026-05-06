'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';

export default function LocaleSwitcher({ className = '' }) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const toggle = () => {
        const next = locale === 'zh-TW' ? 'en' : 'zh-TW';
        startTransition(() => {
            router.replace(pathname, { locale: next });
        });
    };

    return (
        <button
            onClick={toggle}
            disabled={isPending}
            aria-label="切換語言 / Switch language"
            title={locale === 'zh-TW' ? 'Switch to English' : '切換為繁體中文'}
            className={`inline-flex items-center justify-center transition-colors text-gray-500 hover:text-brand-orange disabled:opacity-40 ${className}`}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        </button>
    );
}
