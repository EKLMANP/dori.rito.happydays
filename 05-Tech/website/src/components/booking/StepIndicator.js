'use client';

const STEPS = [
    { label: '填寫問卷', icon: '📋' },
    { label: '選擇時段', icon: '📅' },
    { label: '確認付款', icon: '💳' },
];

export default function StepIndicator({ currentStep }) {
    return (
        <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((step, i) => {
                const stepNum = i + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                    <div key={stepNum} className="flex items-center">
                        {i > 0 && (
                            <div
                                className={`w-12 h-0.5 mx-1 ${
                                    isCompleted ? 'bg-brand-orange' : 'bg-gray-200'
                                }`}
                            />
                        )}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                    isActive
                                        ? 'bg-brand-orange text-white'
                                        : isCompleted
                                          ? 'bg-brand-orange/20 text-brand-orange'
                                          : 'bg-gray-100 text-gray-400'
                                }`}
                            >
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <span
                                className={`mt-1 text-xs font-medium ${
                                    isActive ? 'text-brand-orange' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
