'use client';

export default function ValidationPanel({ validation }) {
    const { errors, warnings } = validation;
    const ok = errors.length === 0 && warnings.length === 0;

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">✅ 規則檢查</h3>
            {ok && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                    ✨ 規劃符合犬研室建議
                </div>
            )}
            {errors.map((e, i) => (
                <div key={`e-${i}`} className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                    🔴 {e.msg}
                </div>
            ))}
            {warnings.map((w, i) => (
                <div key={`w-${i}`} className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-xs text-yellow-800">
                    🟡 {w.msg}
                </div>
            ))}
        </div>
    );
}
