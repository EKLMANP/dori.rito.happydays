import { NextResponse } from 'next/server';
import { validateAdminPin } from '@/lib/admin-auth';
import { isNotionConfigured, queryDatabase, getPropValue } from '@/lib/notion';

const CRM_DB_ID = process.env.NOTION_CRM_DB_ID || process.env.NOTION_CUSTOMER_DB_ID;

/**
 * GET /api/admin/customers?search=xxx
 */
export async function GET(request) {
    const auth = validateAdminPin(request);
    if (!auth.valid) return auth.response;

    if (!isNotionConfigured()) {
        return NextResponse.json({ customers: [], dev: true });
    }

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim();

        let filter = undefined;
        if (search) {
            filter = {
                property: '客戶姓名',
                title: { contains: search },
            };
        }

        const pages = await queryDatabase(CRM_DB_ID, filter, [
            { property: '客戶姓名', direction: 'ascending' },
        ], 1);

        const customers = pages.map(page => ({
            id: page.id,
            name: getPropValue(page, '客戶姓名') || '(未命名)',
            dogName: getPropValue(page, '狗狗名字 Name of your lovely dog') || '',
        }));

        return NextResponse.json({ customers });
    } catch (err) {
        console.error('Customers API error:', err);
        return NextResponse.json({ error: '取得客戶列表失敗' }, { status: 500 });
    }
}
