import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { pin } = await request.json();
        const expectedPin = process.env.ADMIN_PIN;

        if (!expectedPin) {
            return NextResponse.json({ error: 'ADMIN_PIN not configured' }, { status: 500 });
        }

        if (pin === expectedPin) {
            const res = NextResponse.json({ ok: true });
            res.cookies.set('admin_session', process.env.ADMIN_SECRET, {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24, // 24 hours
            });
            return res;
        }

        return NextResponse.json({ error: '密碼錯誤' }, { status: 401 });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
