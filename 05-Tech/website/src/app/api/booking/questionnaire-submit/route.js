import { NextResponse } from 'next/server';
import { createCustomerPage } from '@/lib/notion-crm';

/**
 * POST /api/booking/questionnaire-submit
 *
 * Called when the user completes the questionnaire (Step 1 → Step 2).
 * Creates a Notion customer page with full Q&A content and 付款狀態 = "未付款".
 *
 * Non-blocking: if Notion fails, returns { notionPageId: null } with a warning.
 * The booking flow continues regardless.
 *
 * Body: { formSections: Array, formResponses: object }
 * Response: { notionPageId: string | null }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { formSections, formResponses } = body;

        if (!formSections || !formResponses) {
            return NextResponse.json(
                { error: '缺少問卷資料' },
                { status: 400 }
            );
        }

        // Attempt Notion page creation — non-blocking for user flow
        try {
            const result = await createCustomerPage(formSections, formResponses);
            return NextResponse.json({
                notionPageId: result.pageId,
            });
        } catch (notionErr) {
            console.error('[questionnaire-submit] Notion create failed:', notionErr.message);
            // Return success with null pageId — don't block the user
            return NextResponse.json({
                notionPageId: null,
                warning: 'Notion 頁面建立失敗，但不影響預約流程',
            });
        }
    } catch (err) {
        console.error('[questionnaire-submit] Unexpected error:', err);
        return NextResponse.json(
            { notionPageId: null, warning: '伺服器錯誤' },
            { status: 500 }
        );
    }
}
