import { NextResponse } from 'next/server';
import { validateAdminPin } from '@/lib/admin-auth';
import { getFreeBusy, getAvailabilityWindows } from '@/lib/google-calendar';

/**
 * GET /api/admin/calendar-status
 *
 * Admin-only diagnostic endpoint for Google Calendar OAuth + availability health.
 * Reports config metadata, freeBusy reachability, and availability-calendar reachability.
 *
 * Auth: requires `x-admin-pin` header matching ADMIN_PIN env. Without auth, the
 * route returns 401 — no info leak. Behind PIN we expose richer diagnostics
 * (env-var lengths, GCP project number prefix, refresh-token head) that help
 * pinpoint OAuth misconfigurations.
 */
export async function GET(request) {
    const auth = validateAdminPin(request);
    if (!auth.valid) return auth.response;

    const inspect = (v, opts = {}) => {
        if (!v) return { present: false };
        const trimmed = v.trim().replace(/\\n$/, '');
        const out = {
            present: true,
            rawLen: v.length,
            trimmedLen: trimmed.length,
        };
        if (opts.showPrefix) {
            // Google OAuth client_id format: <project_number>-<hash>.apps.googleusercontent.com
            const m = trimmed.match(/^(\d+)-/);
            if (m) out.projectNumber = m[1];
        }
        if (opts.showTokenHead) {
            out.head = trimmed.slice(0, 6);
        }
        return out;
    };

    const status = {
        config: {
            clientId: inspect(process.env.GOOGLE_CALENDAR_CLIENT_ID, { showPrefix: true }),
            clientSecret: inspect(process.env.GOOGLE_CALENDAR_CLIENT_SECRET),
            refreshToken: inspect(process.env.GOOGLE_CALENDAR_REFRESH_TOKEN, { showTokenHead: true }),
            calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary (default)',
            availabilityCalendarId: process.env.GOOGLE_AVAILABILITY_CALENDAR_ID
                ? `...${process.env.GOOGLE_AVAILABILITY_CALENDAR_ID.slice(-20)}`
                : null,
        },
        freeBusy: { ok: false, error: null, busyCount: 0 },
        availability: { ok: false, error: null, configured: false, windowCount: 0 },
    };

    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const timeMin = now.toISOString();
    const timeMax = weekLater.toISOString();

    try {
        const busy = await getFreeBusy(timeMin, timeMax);
        status.freeBusy.ok = true;
        status.freeBusy.busyCount = busy.length;
    } catch (err) {
        status.freeBusy.error = err.message;
    }

    try {
        const windows = await getAvailabilityWindows(timeMin, timeMax);
        if (windows === null) {
            status.availability.configured = false;
            status.availability.error = 'GOOGLE_AVAILABILITY_CALENDAR_ID not set';
        } else {
            status.availability.ok = true;
            status.availability.configured = true;
            status.availability.windowCount = windows.length;
        }
    } catch (err) {
        status.availability.configured = !!process.env.GOOGLE_AVAILABILITY_CALENDAR_ID;
        status.availability.error = err.message;
    }

    const allOk = status.freeBusy.ok && status.availability.ok;
    return NextResponse.json({ ok: allOk, ...status });
}
