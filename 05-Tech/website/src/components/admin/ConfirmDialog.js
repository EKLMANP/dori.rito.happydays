'use client';

import { useState } from 'react';

/**
 * Reusable confirmation dialog for admin CRM operations.
 * - Blue confirm button for create/update
 * - Red confirm button for delete/archive (requires typing "確認")
 */
export default function ConfirmDialog({
    open,
    title,
    children,
    confirmLabel = '確認執行',
    cancelLabel = '取消',
    variant = 'default', // 'default' | 'danger'
    notes = true, // show notes input
    onConfirm,
    onCancel,
}) {
    const [noteText, setNoteText] = useState('');
    const [confirmInput, setConfirmInput] = useState('');
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const isDanger = variant === 'danger';
    const canConfirm = isDanger ? confirmInput === '確認' : true;

    const handleConfirm = async () => {
        if (!canConfirm) return;
        setLoading(true);
        try {
            await onConfirm(noteText);
        } finally {
            setLoading(false);
            setNoteText('');
            setConfirmInput('');
        }
    };

    const handleCancel = () => {
        setNoteText('');
        setConfirmInput('');
        onCancel();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
        }} onClick={handleCancel}>
            <div style={{
                background: '#fff', borderRadius: '12px', padding: '24px',
                maxWidth: '480px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }} onClick={e => e.stopPropagation()}>
                {/* Title */}
                <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>{title}</h3>

                {/* Content */}
                <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#555' }}>
                    {children}
                </div>

                {/* Danger confirmation input */}
                {isDanger && (
                    <div style={{ marginBottom: '16px' }}>
                        <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>
                            此操作無法復原。請輸入「確認」以繼續。
                        </p>
                        <input
                            type="text"
                            value={confirmInput}
                            onChange={e => setConfirmInput(e.target.value)}
                            placeholder="輸入「確認」"
                            style={{
                                width: '100%', padding: '8px 12px', border: '1px solid #fca5a5',
                                borderRadius: '6px', fontSize: '0.9rem',
                            }}
                        />
                    </div>
                )}

                {/* Notes input */}
                {notes && (
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '4px' }}>
                            備註（選填）
                        </label>
                        <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="記錄操作原因..."
                            rows={2}
                            style={{
                                width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
                                borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical',
                            }}
                        />
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        style={{
                            padding: '8px 20px', borderRadius: '6px', border: '1px solid #d1d5db',
                            background: '#fff', cursor: 'pointer', fontSize: '0.9rem',
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm || loading}
                        style={{
                            padding: '8px 20px', borderRadius: '6px', border: 'none', color: '#fff',
                            background: isDanger
                                ? (canConfirm ? '#dc2626' : '#fca5a5')
                                : '#3b82f6',
                            cursor: canConfirm && !loading ? 'pointer' : 'not-allowed',
                            fontSize: '0.9rem', fontWeight: 600,
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? '處理中...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
