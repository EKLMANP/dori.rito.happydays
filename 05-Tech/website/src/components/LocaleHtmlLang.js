'use client';

import { useEffect } from 'react';

export default function LocaleHtmlLang({ locale }) {
    useEffect(() => {
        if (typeof document !== 'undefined' && locale) {
            document.documentElement.lang = locale;
        }
    }, [locale]);
    return null;
}
