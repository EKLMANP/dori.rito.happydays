'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { SEED_EMAIL_TEMPLATES } from '@/lib/seed-data';

const VARIABLES = [
    { key: 'customer_name', label: '客戶姓名' },
    { key: 'dog_name', label: '狗狗名字' },
    { key: 'service_name', label: '服務名稱' },
    { key: 'slot_date', label: '預約日期' },
    { key: 'slot_time', label: '預約時間' },
    { key: 'price', label: '金額' },
    { key: 'merchant_trade_no', label: '訂單編號' },
    { key: 'meet_link', label: 'Meet 連結' },
];

const SAMPLE_DATA = {
    customer_name: '王小明',
    dog_name: '小黑',
    service_name: '一對一線上諮詢',
    slot_date: '2026-03-15',
    slot_time: '14:00',
    price: '500',
    merchant_trade_no: 'DR20260315-001',
    meet_link: 'https://meet.google.com/abc-defg-hij',
};

/** Sanitize HTML for safe rendering in previews */
function sanitizeHtml(html) {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'img', 'span', 'div', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'hr'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'width', 'height', 'style', 'class', 'target', 'rel'],
    });
}

export default function AdminEmailsPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);
    const [editing, setEditing] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [testStatus, setTestStatus] = useState(null);
    const bodyRef = useRef(null);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/email-templates');
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            const data = await res.json();
            setTemplates(data.length > 0 ? data : SEED_EMAIL_TEMPLATES);
            setUsingFallback(data.length === 0);
        } catch {
            setTemplates(SEED_EMAIL_TEMPLATES);
            setUsingFallback(true);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

    async function loadTemplate(id) {
        if (usingFallback) {
            const tpl = SEED_EMAIL_TEMPLATES.find((t) => t.id === id);
            if (tpl) setEditing(tpl);
        } else {
            try {
                const res = await fetch(`/api/admin/email-templates/${id}`);
                if (!res.ok) throw new Error(`API returned ${res.status}`);
                setEditing(await res.json());
            } catch {
                const tpl = SEED_EMAIL_TEMPLATES.find((t) => t.id === id);
                if (tpl) setEditing(tpl);
            }
        }
        setShowPreview(false);
        setTestStatus(null);
    }

    function startNewTemplate() {
        setEditing({
            id: '',
            subject: '',
            body_html: '',
            header_image_url: '',
            header_image_width: 600,
            footer_html: '',
            _isNew: true,
        });
        setShowPreview(false);
        setTestStatus(null);
    }

    async function saveTemplate() {
        if (!editing) return;
        const { _isNew, ...data } = editing;

        if (!data.id || !data.subject || !data.body_html) {
            alert('ID、主旨和內文為必填');
            return;
        }

        if (_isNew) {
            await fetch('/api/admin/email-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        } else {
            await fetch(`/api/admin/email-templates/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        }

        setEditing(null);
        fetchTemplates();
    }

    async function deleteTemplate(id) {
        if (!confirm('確定刪除此模板？')) return;
        await fetch(`/api/admin/email-templates/${id}`, { method: 'DELETE' });
        if (editing?.id === id) setEditing(null);
        fetchTemplates();
    }

    async function handleImageUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.url) {
            setEditing(prev => ({ ...prev, header_image_url: data.url }));
        }
    }

    function insertVariable(variable) {
        const textarea = bodyRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = editing.body_html;
        const insertion = `{{${variable}}}`;

        setEditing(prev => ({
            ...prev,
            body_html: text.substring(0, start) + insertion + text.substring(end),
        }));

        requestAnimationFrame(() => {
            textarea.focus();
            textarea.selectionStart = start + insertion.length;
            textarea.selectionEnd = start + insertion.length;
        });
    }

    async function handlePreview() {
        if (!editing) return;

        const res = await fetch(`/api/admin/email-templates/${editing.id}/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        const data = await res.json();
        if (data.rendered_html) {
            setPreviewHtml(data.rendered_html);
            setShowPreview(true);
        }
    }

    async function handleSendTest() {
        if (!editing?.id) return;
        setTestStatus('sending');

        const res = await fetch(`/api/admin/email-templates/${editing.id}/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        const data = await res.json();
        if (data.sent_to) {
            setTestStatus(`已寄送至 ${data.sent_to}`);
        } else if (data.rendered_html) {
            setPreviewHtml(data.rendered_html);
            setShowPreview(true);
            setTestStatus('Mailgun 未設定，顯示預覽');
        } else {
            setTestStatus(`失敗: ${data.error || '未知錯誤'}`);
        }

        setTimeout(() => setTestStatus(null), 5000);
    }

    function getInstantPreview() {
        if (!editing) return '';
        let html = editing.body_html || '';
        for (const [key, value] of Object.entries(SAMPLE_DATA)) {
            html = html.replaceAll(`{{${key}}}`, value);
        }
        return sanitizeHtml(html);
    }

    if (loading) return <div className="text-gray-500">載入中...</div>;

    return (
        <div className="space-y-6">
            {usingFallback && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
                    ⚠️ 資料庫未連線，目前顯示預設範本。連線 Neon 後即可編輯儲存。
                </div>
            )}

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Email 模板</h1>
                <button
                    onClick={startNewTemplate}
                    className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    + 新增模板
                </button>
            </div>

            {/* Template List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {templates.length === 0 && (
                    <div className="p-8 text-center text-gray-400">尚無模板</div>
                )}
                {templates.map(t => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                            <button onClick={() => loadTemplate(t.id)} className="text-left w-full">
                                <div className="font-medium text-gray-800">{t.id}</div>
                                <div className="text-sm text-gray-500 truncate">{t.subject}</div>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <button
                                onClick={() => loadTemplate(t.id)}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                編輯
                            </button>
                            <button
                                onClick={() => deleteTemplate(t.id)}
                                className="text-sm text-red-500 hover:underline"
                            >
                                刪除
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor */}
            {editing && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h2 className="text-lg font-bold text-gray-800">
                        {editing._isNew ? '新增模板' : `編輯: ${editing.id}`}
                    </h2>

                    {/* ID + Subject */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">模板 ID</label>
                            <input
                                type="text"
                                value={editing.id}
                                onChange={e => setEditing(prev => ({ ...prev, id: e.target.value }))}
                                disabled={!editing._isNew}
                                placeholder="booking-confirmation"
                                className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">信件主旨</label>
                            <input
                                type="text"
                                value={editing.subject}
                                onChange={e => setEditing(prev => ({ ...prev, subject: e.target.value }))}
                                placeholder="預約確認 — {{service_name}}"
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    {/* Header Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Header 圖片</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="text-sm"
                            />
                            {editing.header_image_url && (
                                <div className="flex items-center gap-2">
                                    <img
                                        src={editing.header_image_url}
                                        alt="Header"
                                        className="h-10 rounded border"
                                    />
                                    <button
                                        onClick={() => setEditing(prev => ({ ...prev, header_image_url: '' }))}
                                        className="text-red-500 text-xs hover:underline"
                                    >
                                        移除
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <label className="text-xs text-gray-500">寬度 (px):</label>
                            <input
                                type="number"
                                value={editing.header_image_width || 600}
                                onChange={e => setEditing(prev => ({ ...prev, header_image_width: parseInt(e.target.value) || 600 }))}
                                className="w-20 px-2 py-1 border rounded text-xs"
                            />
                        </div>
                    </div>

                    {/* Variable Buttons */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">插入變數</label>
                        <div className="flex flex-wrap gap-1.5">
                            {VARIABLES.map(v => (
                                <button
                                    key={v.key}
                                    onClick={() => insertVariable(v.key)}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono hover:bg-blue-100 transition-colors"
                                    title={`插入 {{${v.key}}}`}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Body HTML */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">信件內文 (HTML)</label>
                        <textarea
                            ref={bodyRef}
                            value={editing.body_html}
                            onChange={e => setEditing(prev => ({ ...prev, body_html: e.target.value }))}
                            rows={14}
                            className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                            placeholder="<h2>您好 {{customer_name}}</h2>&#10;<p>您的預約已成功！</p>"
                        />
                    </div>

                    {/* Footer HTML */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Footer (選填，留空使用預設)
                        </label>
                        <textarea
                            value={editing.footer_html || ''}
                            onChange={e => setEditing(prev => ({ ...prev, footer_html: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                            placeholder="自訂 footer HTML..."
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={saveTemplate}
                            className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            儲存
                        </button>
                        <button
                            onClick={() => { setEditing(null); setShowPreview(false); }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                            取消
                        </button>
                        <div className="flex-1" />
                        {!editing._isNew && (
                            <>
                                <button
                                    onClick={handlePreview}
                                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                >
                                    伺服器預覽
                                </button>
                                <button
                                    onClick={handleSendTest}
                                    className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                >
                                    發送測試信
                                </button>
                            </>
                        )}
                        {testStatus && (
                            <span className="text-xs text-gray-500">{testStatus}</span>
                        )}
                    </div>

                    {/* Instant Preview (always visible when editing) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">即時預覽</label>
                        <div className="border rounded-lg overflow-hidden bg-gray-50">
                            {editing.header_image_url && (
                                <div className="bg-white">
                                    <img
                                        src={editing.header_image_url}
                                        alt="Header preview"
                                        style={{ width: editing.header_image_width || 600, maxWidth: '100%' }}
                                    />
                                </div>
                            )}
                            <div
                                className="p-6 bg-white text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: getInstantPreview() }}
                            />
                            <div className="px-6 py-3 text-xs text-gray-400 border-t text-center">
                                {editing.footer_html
                                    ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(editing.footer_html) }} />
                                    : <span>&copy; 2026 Dori &amp; Rito Happydays — 正向訓犬</span>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Rendered Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-gray-800">完整預覽 (伺服器渲染)</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                &times;
                            </button>
                        </div>
                        <iframe
                            srcDoc={previewHtml}
                            title="Email Preview"
                            className="w-full border-0"
                            sandbox="allow-same-origin"
                            style={{ height: '70vh' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
