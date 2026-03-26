'use client';

const PERIODS = [
    { key: 'day', label: '日' },
    { key: 'week', label: '週' },
    { key: 'month', label: '月' },
    { key: 'quarter', label: '季' },
    { key: 'year', label: '年' },
];

export default function TimePeriodSelector({ value = 'week', onChange, className = '' }) {
    return (
        <div className={`inline-flex gap-0.5 bg-gray-100 rounded-lg p-0.5 ${className}`}>
            {PERIODS.map((p) => (
                <button
                    key={p.key}
                    onClick={() => onChange(p.key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        value === p.key
                            ? 'bg-white text-brand-orange shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}
