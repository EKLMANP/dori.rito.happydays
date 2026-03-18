'use client';

const SERVICES = [
    { key: 'db', label: '資料庫', icon: '🗄️' },
    { key: 'notion', label: 'Notion CRM', icon: '📝' },
    { key: 'ghost', label: 'Ghost CMS', icon: '👻' },
    { key: 'mailgun', label: 'Mailgun', icon: '📧' },
];

/**
 * Compact system health status widget.
 *
 * @param {object}  props
 * @param {object}  props.health  - { db: bool, notion: bool, ghost: bool, mailgun: bool }
 * @param {boolean} [props.loading]
 */
export default function SystemHealth({ health = {}, loading = false }) {
    const allOk = SERVICES.every((s) => health[s.key] === true);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">系統狀態</h3>
                {!loading && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        allOk
                            ? 'bg-green-50 text-green-600'
                            : 'bg-red-50 text-red-600'
                    }`}>
                        {allOk ? '全部正常' : '異常'}
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {SERVICES.map((service) => (
                    <div key={service.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">{service.icon}</span>
                            <span className="text-sm text-gray-600">{service.label}</span>
                        </div>
                        {loading ? (
                            <div className="w-12 h-4 bg-gray-100 rounded animate-pulse" />
                        ) : (
                            <span className={`w-2.5 h-2.5 rounded-full ${
                                health[service.key] ? 'bg-green-400' : 'bg-red-400'
                            }`} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
