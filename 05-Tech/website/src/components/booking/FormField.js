'use client';

/**
 * Dynamic form field renderer.
 * Supports: text, textarea, email, radio, checkbox, select
 */
export default function FormField({ field, value, onChange }) {
    const { id, field_type, label, description, placeholder, options, is_required } = field;
    const fieldId = `field-${id}`;

    const labelEl = (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {is_required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );

    const descEl = description && (
        <p className="text-xs text-gray-400 mb-1.5">{description}</p>
    );

    const baseInput = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-colors';

    switch (field_type) {
        case 'text':
        case 'email':
            return (
                <div>
                    {labelEl}
                    {descEl}
                    <input
                        id={fieldId}
                        type={field_type}
                        value={value || ''}
                        onChange={e => onChange(id, e.target.value)}
                        placeholder={placeholder}
                        required={is_required}
                        className={baseInput}
                    />
                </div>
            );

        case 'textarea':
            return (
                <div>
                    {labelEl}
                    {descEl}
                    <textarea
                        id={fieldId}
                        value={value || ''}
                        onChange={e => onChange(id, e.target.value)}
                        placeholder={placeholder}
                        required={is_required}
                        rows={4}
                        className={baseInput}
                    />
                </div>
            );

        case 'radio':
            return (
                <div>
                    {labelEl}
                    {descEl}
                    <div className="flex flex-wrap gap-3 mt-1">
                        {(options || []).map(opt => (
                            <label
                                key={opt.value}
                                className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition-colors ${
                                    value === opt.value
                                        ? 'border-brand-orange bg-orange-50 text-brand-orange'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name={fieldId}
                                    value={opt.value}
                                    checked={value === opt.value}
                                    onChange={e => onChange(id, e.target.value)}
                                    className="sr-only"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>
            );

        case 'checkbox':
            return (
                <div>
                    {labelEl}
                    {descEl}
                    <div className="flex flex-wrap gap-2 mt-1">
                        {(options || []).map(opt => {
                            const checked = Array.isArray(value) && value.includes(opt.value);
                            return (
                                <label
                                    key={opt.value}
                                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition-colors ${
                                        checked
                                            ? 'border-brand-orange bg-orange-50 text-brand-orange'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        value={opt.value}
                                        checked={checked}
                                        onChange={e => {
                                            const current = Array.isArray(value) ? value : [];
                                            const next = e.target.checked
                                                ? [...current, opt.value]
                                                : current.filter(v => v !== opt.value);
                                            onChange(id, next);
                                        }}
                                        className="sr-only"
                                    />
                                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                                        checked ? 'bg-brand-orange border-brand-orange' : 'border-gray-300'
                                    }`}>
                                        {checked && <span className="text-white text-xs">✓</span>}
                                    </span>
                                    {opt.label}
                                </label>
                            );
                        })}
                    </div>
                </div>
            );

        case 'select':
            return (
                <div>
                    {labelEl}
                    {descEl}
                    <select
                        id={fieldId}
                        value={value || ''}
                        onChange={e => onChange(id, e.target.value)}
                        required={is_required}
                        className={baseInput}
                    >
                        <option value="">{placeholder || '請選擇...'}</option>
                        {(options || []).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            );

        default:
            return null;
    }
}
