import { NextResponse } from 'next/server';

/**
 * 驗證 Admin PIN
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
