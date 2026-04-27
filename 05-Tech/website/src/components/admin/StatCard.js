'use client';

/** Inline ⓘ info icon with hover tooltip. Export for use in section headers. */
export function MetricTooltip({ text }) {
    return (
        <span className="group relative inline-flex items-center ml-1 align-middle">
            <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs select-none">ⓘ</span>
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-normal leading-relaxed">
                {text}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </span>
        </span>
    );
}

const COLOR_MAP = {
    orange: 'border-l-brand-orange',
    green: 'border-l-green-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    amber: 'border-l-amber-500',
    red: 'border-l-red-500',
};

/**
 * Unified stat card for the admin dashboard.
 *
 * @param {object}  props
 * @param {string}  props.title    - Card label (e.g. "本週預約")
 * @param {string|number} props.value - Display value (e.g. "NT$28,000")
 * @param {string}  [props.subtitle] - Small helper text below value
 * @param {string}  [props.icon]   - Emoji icon (e.g. "📅")
 * @param {string}  [props.color]  - Border accent colour key
 * @param {boolean} [props.loading] - Show skeleton state
 * @param {string}  [props.trend]  - Optional trend text (e.g. "↑12%")
 * @param {string}  [props.trendColor] - Trend text colour class
 */
export default function StatCard({
    title,
    value,
    subtitle,
    icon,
    color = 'orange',
    loading = false,
    trend,
    trendColor = 'text-green-600',
    tooltip,
}) {
    return (
        <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${COLOR_MAP[color] || COLOR_MAP.orange} p-4 sm:p-6`}>
            <div className="flex items-center justify-between mb-1">
                <p className="text-xs sm:text-sm text-gray-500">
                    {title}
                    {tooltip && <MetricTooltip text={tooltip} />}
                </p>
                {icon && <span className="text-lg">{icon}</span>}
            </div>

            {loading ? (
                <div className="space-y-2 mt-2">
                    <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
            ) : (
                <>
                    <div className="flex items-end gap-2">
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</p>
                        {trend && (
                            <span className={`text-xs font-medium ${trendColor} mb-1`}>{trend}</span>
                        )}
                    </div>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                </>
            )}
        </div>
    );
}
