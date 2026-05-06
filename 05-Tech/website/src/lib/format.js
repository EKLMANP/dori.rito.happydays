// 行銷顯示用 FX (季度更新；不用於結算)
export const TWD_TO_USD = 0.0315;

const DATE_LOCALE = { 'zh-TW': 'zh-TW', en: 'en-US' };

export function formatDate(date, locale = 'zh-TW') {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(DATE_LOCALE[locale] || 'zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);
}

export function formatTime(date, locale = 'zh-TW') {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(DATE_LOCALE[locale] || 'zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: locale === 'en',
    }).format(d);
}

export function formatCurrency(twd, locale = 'zh-TW') {
    const n = Number(twd) || 0;
    if (locale === 'en') {
        const usd = Math.round(n * TWD_TO_USD);
        return `TWD ${n.toLocaleString('en-US')} (~US$${usd.toLocaleString('en-US')})`;
    }
    return `NT$${n.toLocaleString('zh-TW')}`;
}
