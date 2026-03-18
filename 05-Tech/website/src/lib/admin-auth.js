import { NextResponse } from 'next/server';

/**
 * Legacy: 舊版 API routes 使用的 auth (原本是 NextAuth session check)
 * 現在 admin 改用 PIN auth，舊 API routes 靠 layout 層的 AdminPinGate 保護
 * 所以這裡直接 pass，不再做 session 檢查
 */
export async function requireAdmin() {
    return { session: { user: { email: 'admin' } } };
}

/**
 * 驗證 Admin PIN（新版 PIN-based auth）
 * @param {Request} request
 * @returns {{ valid: boolean, response?: NextResponse }}
 */
export function validateAdminPin(request) {
    const pin = request.headers.get('x-admin-pin');
    const expectedPin = process.env.ADMIN_PIN;

    if (!expectedPin) {
        return {
            valid: false,
            response: NextResponse.json(
                { error: 'ADMIN_PIN not configured' },
                { status: 500 }
            ),
        };
    }

    if (!pin || pin !== expectedPin) {
        return {
            valid: false,
            response: NextResponse.json(
                { error: '驗證失敗' },
                { status: 401 }
            ),
        };
    }

    return { valid: true };
}
