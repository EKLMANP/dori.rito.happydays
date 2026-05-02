'use client';

import { forwardRef } from 'react';

function hexWithAlpha(hex, alpha) {
    const m = /^#?([a-f\d]{6})$/i.exec(hex);
    if (!m) return hex;
    const r = parseInt(m[1].slice(0, 2), 16);
    const g = parseInt(m[1].slice(2, 4), 16);
    const b = parseInt(m[1].slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

const SchedulePreview = forwardRef(function SchedulePreview({ meta, categories, rows, footer }, ref) {
    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    return (
        <div
            ref={ref}
            style={{
                background: '#ffffff',
                color: '#1f2937',
                fontFamily: 'system-ui, -apple-system, "PingFang TC", "Microsoft JhengHei", "Heiti TC", "Noto Sans TC", sans-serif',
                width: '720px',
                padding: '0',
                boxSizing: 'border-box',
                letterSpacing: 'normal',
                wordSpacing: 'normal',
                fontKerning: 'none',
            }}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2c4a6e 100%)',
                    color: 'white',
                    padding: '28px 32px',
                    textAlign: 'center',
                }}
            >
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, color: '#ffffff', letterSpacing: '0.05em', lineHeight: 1.4 }}>
                    {meta.dogName}每日作息時間表
                </h1>
                <p style={{ fontSize: '13px', margin: '10px 0 0', color: '#ffffff', opacity: 0.9, letterSpacing: '0.05em', lineHeight: 1.6 }}>
                    {[meta.breed, meta.ageMonths, meta.sleepGoal].filter(Boolean).join(' | ')}
                </p>
            </div>

            <div
                style={{
                    background: '#f8f9fb',
                    padding: '12px 32px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    flexWrap: 'wrap',
                    fontSize: '12px',
                }}
            >
                {categories.map((cat) => (
                    <span key={cat.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span
                            style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: cat.color,
                            }}
                        />
                        {cat.name}
                    </span>
                ))}
            </div>

            <div style={{ padding: '20px 24px' }}>
                {rows.map((row) => {
                    const cat = categoryMap[row.categoryId] || { color: '#9CA3AF', name: '' };
                    return (
                        <div
                            key={row.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '70px 16px 1fr',
                                alignItems: 'stretch',
                                gap: '8px',
                                margin: '6px 0',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#6b7280',
                                    textAlign: 'right',
                                    paddingTop: '12px',
                                    paddingRight: '4px',
                                    letterSpacing: '0.03em',
                                    lineHeight: 1.5,
                                }}
                            >
                                {row.time}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '14px' }}>
                                <span
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: cat.color,
                                        boxShadow: '0 0 0 3px rgba(0,0,0,0.04)',
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    background: hexWithAlpha(cat.color, 0.08),
                                    border: `1px solid ${hexWithAlpha(cat.color, 0.25)}`,
                                    borderLeft: `4px solid ${cat.color}`,
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                }}
                            >
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', lineHeight: 1.7, letterSpacing: '0.03em' }}>
                                    {row.title}
                                </div>
                                {row.description && (
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', lineHeight: 1.8, letterSpacing: '0.03em', whiteSpace: 'pre-line' }}>
                                        {row.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ padding: '0 24px 24px' }}>
                {footer.doorRule && (
                    <div
                        style={{
                            background: '#eef4ff',
                            border: '1px solid #c7d8f5',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            marginBottom: '12px',
                        }}
                    >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a5f', marginBottom: '6px', letterSpacing: '0.03em' }}>門的開關規則：</div>
                        <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.9, letterSpacing: '0.03em', whiteSpace: 'pre-line' }}>
                            {footer.doorRule}
                        </div>
                    </div>
                )}

                <div
                    style={{
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        fontSize: '12px',
                        color: '#7c2d12',
                        lineHeight: 2,
                        letterSpacing: '0.03em',
                    }}
                >
                    {footer.feedingInterval && (
                        <div><strong>餵食間隔：</strong>{footer.feedingInterval}</div>
                    )}
                    {footer.principle && (
                        <div><strong>核心原則：</strong>{footer.principle}</div>
                    )}
                    {footer.releaseSignal && (
                        <div><strong>放風結束訊號：</strong>{footer.releaseSignal}</div>
                    )}
                    {footer.ignoreNote && (
                        <div><strong>他叫的時候：</strong>{footer.ignoreNote}</div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default SchedulePreview;
