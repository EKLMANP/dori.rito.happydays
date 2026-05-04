'use client';

import { useRef, useState } from 'react';
import ScheduleEditor from './ScheduleEditor';
import SchedulePreview from './SchedulePreview';
import { DEFAULT_CATEGORIES, DEFAULT_ROWS, DEFAULT_FOOTER, DEFAULT_META } from './constants';
import { exportToPDF, exportToJPG } from './exportUtils';

export default function DogSchedulePage() {
    const previewRef = useRef(null);
    const [meta, setMeta] = useState(DEFAULT_META);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [rows, setRows] = useState(DEFAULT_ROWS);
    const [footer, setFooter] = useState(DEFAULT_FOOTER);
    const [exporting, setExporting] = useState(null);

    const handleExport = async (type) => {
        try {
            setExporting(type);
            if (type === 'pdf') await exportToPDF(previewRef.current, meta.dogName);
            else await exportToJPG(previewRef.current, meta.dogName);
        } catch (err) {
            console.error('[dog-schedule export]', err);
            alert('匯出失敗：' + (err?.message || '未知錯誤'));
        } finally {
            setExporting(null);
        }
    };

    const reset = () => {
        if (!confirm('確定要重置為預設範本？目前編輯內容會清除。')) return;
        setMeta(DEFAULT_META);
        setCategories(DEFAULT_CATEGORIES);
        setRows(DEFAULT_ROWS);
        setFooter(DEFAULT_FOOTER);
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">狗狗每日作息表</h1>
                    <p className="text-sm text-gray-400 mt-1">為客戶狗狗產生個人化作息時間表（PDF / JPG）</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={reset}
                        className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        ↺ 重置
                    </button>
                    <button
                        onClick={() => handleExport('jpg')}
                        disabled={!!exporting}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {exporting === 'jpg' ? '匯出中…' : '⬇ 下載 JPG'}
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={!!exporting}
                        className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                        {exporting === 'pdf' ? '匯出中…' : '⬇ 下載 PDF'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                    <ScheduleEditor
                        meta={meta} setMeta={setMeta}
                        categories={categories} setCategories={setCategories}
                        rows={rows} setRows={setRows}
                        footer={footer} setFooter={setFooter}
                    />
                </div>
                <div>
                    <div className="sticky top-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">即時預覽</h3>
                            <div className="overflow-auto bg-gray-100 rounded-lg p-4 max-h-[80vh]">
                                <div style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: 'fit-content' }}>
                                    <SchedulePreview
                                        ref={previewRef}
                                        meta={meta}
                                        categories={categories}
                                        rows={rows}
                                        footer={footer}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">預覽縮放至 80%，下載時會以原始 720px 寬度輸出。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
