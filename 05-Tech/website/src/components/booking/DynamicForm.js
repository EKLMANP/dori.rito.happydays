'use client';

import { useTranslations } from 'next-intl';
import FormField from './FormField';

export default function DynamicForm({ sections, responses, onChange, currentSection, onSectionChange }) {
    const t = useTranslations('booking.form');

    if (!sections || sections.length === 0) {
        return <div className="text-gray-400 text-center py-8">{t('noFields')}</div>;
    }

    const section = sections[currentSection];
    const isFirst = currentSection === 0;
    const isLast = currentSection === sections.length - 1;

    function validateSection() {
        const errors = [];
        for (const field of section.fields) {
            if (field.is_required) {
                const value = responses[String(field.id)];
                if (value === undefined || value === null || value === '') {
                    errors.push(field.label);
                }
                if (field.field_type === 'checkbox' && Array.isArray(value) && value.length === 0) {
                    errors.push(field.label);
                }
            }
        }
        return errors;
    }

    function handleNext() {
        const errors = validateSection();
        if (errors.length > 0) {
            alert(`${t('validationAlert')}\n${errors.join('\n')}`);
            return;
        }
        onSectionChange(currentSection + 1);
    }

    return (
        <div>
            {/* Section progress */}
            <div className="flex items-center gap-1.5 mb-6">
                {sections.map((s, i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i <= currentSection ? 'bg-brand-orange' : 'bg-gray-200'
                        }`}
                    />
                ))}
            </div>

            {/* Section header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800">{section.title}</h3>
                {section.description && (
                    <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                )}
            </div>

            {/* Fields */}
            <div className="space-y-5">
                {(section.fields || []).map(field => (
                    <FormField
                        key={field.id}
                        field={field}
                        value={responses[String(field.id)]}
                        onChange={onChange}
                        selectPlaceholder={t('selectPlaceholder')}
                    />
                ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
                <button
                    onClick={() => onSectionChange(currentSection - 1)}
                    disabled={isFirst}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isFirst
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {t('back')}
                </button>

                {isLast ? (
                    <button
                        onClick={() => {
                            const errors = validateSection();
                            if (errors.length > 0) {
                                alert(`${t('validationAlert')}\n${errors.join('\n')}`);
                                return;
                            }
                            onSectionChange('complete');
                        }}
                        className="px-6 py-2.5 bg-brand-orange text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        {t('nextToSchedule')}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="px-5 py-2.5 bg-brand-orange text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        {t('next')}
                    </button>
                )}
            </div>
        </div>
    );
}
