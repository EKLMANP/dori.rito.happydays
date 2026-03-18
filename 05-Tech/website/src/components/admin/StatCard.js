'use client';

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
}) {
    return (
        <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${COLOR_MAP[color] || COLOR_MAP.orange} p-6`}>
            <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-500">{title}</p>
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
                        <p className="text-3xl font-bold text-gray-800">{value}</p>
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
