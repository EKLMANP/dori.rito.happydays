'use client';

/**
 * Shows a setup guide when a service is not yet configured.
 *
 * @param {string} props.title - Section title
 * @param {string} props.icon - Emoji icon
 * @param {string} props.message - Description
 * @param {Array}  props.steps - Array of step strings
 */
export default function SetupGuideCard({ title, icon, message, steps = [] }) {
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-start gap-3">
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-800">{title}</h3>
                    <p className="text-xs text-amber-600 mt-1">{message}</p>
                    {steps.length > 0 && (
                        <ol className="mt-3 space-y-1.5">
                            {steps.map((step, idx) => (
                                <li key={idx} className="text-xs text-amber-700 flex gap-2">
                                    <span className="font-semibold text-amber-500 shrink-0">{idx + 1}.</span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
}
