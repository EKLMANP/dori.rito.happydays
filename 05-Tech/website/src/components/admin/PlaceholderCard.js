'use client';

/**
 * Placeholder card for features coming in Phase 2/3.
 * Shows a preview of what metrics will be available.
 *
 * @param {object}   props
 * @param {string}   props.title       - Section heading
 * @param {string}   props.phase       - "Phase 2" or "Phase 3"
 * @param {string[]} props.upcoming    - List of upcoming metrics
 * @param {string}   [props.message]   - Optional extra message
 */
export default function PlaceholderCard({ title, phase, upcoming = [], message }) {
    return (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🚧</span>
                <h3 className="font-semibold text-gray-700">{title}</h3>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {phase}
                </span>
            </div>

            {message && (
                <p className="text-sm text-gray-500 mb-3">{message}</p>
            )}

            {upcoming.length > 0 && (
                <div>
                    <p className="text-xs text-gray-400 mb-2">即將上線的指標：</p>
                    <ul className="space-y-1">
                        {upcoming.map((item) => (
                            <li key={item} className="text-sm text-gray-500 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
