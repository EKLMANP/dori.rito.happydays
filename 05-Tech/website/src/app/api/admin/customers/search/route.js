import { NextResponse } from 'next/server';
import { searchCustomers } from '@/lib/notion';

/** POST /api/admin/customers/search { query: "..." } */
export async function POST(request) {
    try {
        const { query } = await request.json();
        if (!query?.trim()) {
            return NextResponse.json({ error: '請輸入搜尋關鍵字' }, { status: 400 });
        }
        const customers = await searchCustomers(query);
        return NextResponse.json({ customers });
    } catch (err) {
        console.error('Search customers error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
