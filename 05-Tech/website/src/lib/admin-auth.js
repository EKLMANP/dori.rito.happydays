import { NextResponse } from 'next/server';
import { auth } from './auth';

const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/**
 * Guard for admin API routes — checks NextAuth session + email allowlist.
 * Usage:
 *   const { error, session } = await requireAdmin();
 *   if (error) return error;
 */
export async function requireAdmin() {
    const session = await auth();
    const email = session?.user?.email?.toLowerCase();
    if (!email || !allowedEmails.includes(email)) {
        return {
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }
    return { session, email };
}
