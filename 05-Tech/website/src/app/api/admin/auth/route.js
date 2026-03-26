import { NextResponse } from 'next/server';

/** POST /api/admin/auth { password } — Set admin session cookie */
export async function POST(request) {
    const { password } = await request.json();
    const secret = process.env.ADMIN_SECRET;

    if (!secret) {
        return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
    }

    if (password !== secret) {
        return NextResponse.json({ error: '密碼錯誤' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_session', secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
}

/** DELETE /api/admin/auth — Clear admin session cookie (logout) */
export async function DELETE() {
    const res = NextResponse.json({ success: true });
    res.cookies.delete('admin_session');
    return res;
}
