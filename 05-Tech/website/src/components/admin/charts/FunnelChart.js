'use client';

/**
 * Simple funnel chart for conversion visualization.
 *
 * @param {Array} props.steps - Array of { label, value, rate? }
 * @param {boolean} [props.loading]
 */
export default function FunnelChart({ steps = [], loading = false }) {
    if (loading) {
        return <div className="animate-pulse bg-gray-100 rounded-lg h-32" />;
    }

    if (!steps.length) {
        return (
            <div className="flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg h-32">
                暫無數據
            </div>
        );
    }

    const maxValue = steps[0]?.value || 1;

    return (
        <div className="space-y-3">
            {steps.map((step, idx) => {
                const widthPct = Math.max((step.value / maxValue) * 100, 8);
                const rate = idx === 0 ? '100%' : `${((step.value / maxValue) * 100).toFixed(1)}%`;

                return (
                    <div key={idx} className="flex items-center gap-3">
                        <div className="w-20 sm:w-28 text-xs sm:text-sm text-gray-600 text-right shrink-0">
                            {step.label}
                        </div>
                        <div className="flex-1 relative">
                            <div
                                className="h-8 sm:h-10 rounded-lg transition-all duration-500"
                                style={{
                                    width: `${widthPct}%`,
                                    backgroundColor: idx === 0 ? '#F75000' : idx === 1 ? '#F97316' : '#FB923C',
                                    opacity: 1 - idx * 0.15,
                                }}
                            />
                        </div>
                        <div className="w-16 sm:w-20 text-right shrink-0">
                            <span className="text-sm font-semibold text-gray-800">
                                {step.value.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">{rate}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
