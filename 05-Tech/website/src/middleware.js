import { NextResponse } from 'next/server';

/**
 * Admin authentication middleware
 * Protects /admin/* pages and /api/admin/* routes
 *
 * Auth methods (checked in order):
 *   1. Cookie: admin_session=<ADMIN_SECRET>
 *   2. Header: Authorization: Bearer <ADMIN_SECRET>
 *
 * Login page at /admin/login and auth API are excluded from protection.
 */
export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Skip non-admin routes
    const isAdminPage = pathname.startsWith('/admin');
    const isAdminApi = pathname.startsWith('/api/admin');
    if (!isAdminPage && !isAdminApi) {
        return NextResponse.next();
    }

    // Allow login page and auth API without authentication
    if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
        return NextResponse.next();
    }

    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
        if (isAdminApi) {
            return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
        }
        return new NextResponse('Admin not configured. Set ADMIN_SECRET env var.', { status: 503 });
    }

    // Check authentication
    const cookieToken = request.cookies.get('admin_session')?.value;
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const isAuthenticated = cookieToken === secret || bearerToken === secret;

    if (!isAuthenticated) {
        if (isAdminApi) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
};
