'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const TABS = [
    { key: 'ops', label: '運營部', icon: '📋' },
    { key: 'mkt', label: '行銷部', icon: '📣' },
    { key: 'finance', label: '財務部', icon: '💰' },
    { key: 'cs', label: '客戶成功', icon: '🤝' },
    { key: 'tech', label: '研發部', icon: '🔧' },
];

/**
 * Tab navigation for the analytics page.
 * Syncs active tab with URL search param `?tab=xxx`.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - render function receives activeTab
 * @param {function} props.renderTab - (activeTab: string) => ReactNode
 */
export default function AnalyticsTabs({ renderTab }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const activeTab = searchParams.get('tab') || 'ops';

    const handleTabChange = (tabKey) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tabKey);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div>
            {/* Tab Bar */}
            <div className="flex gap-1 bg-gray-50 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                            activeTab === tab.key
                                ? 'bg-white text-brand-orange shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {renderTab(activeTab)}
        </div>
    );
}
