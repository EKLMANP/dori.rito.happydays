import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getFreeBusy, getAvailabilityWindows } from '@/lib/google-calendar';

/**
 * GET /api/booking/slots?service_id=xxx&month=2026-03
 *
 * Returns available time slots for a given service and month.
 *
 * Two modes:
 *   1. Availability Calendar (GOOGLE_AVAILABILITY_CALENDAR_ID set):
 *      Reads availability events from a dedicated Google Calendar →
 *      generates slots only within those windows.
 *
 *   2. DB Rules fallback (no availability calendar):
 *      Generates slots from slot_rules table (available_days, start/end hour).
 *
 * Both modes apply:
 *   - blocked_dates from DB
 *   - Google Calendar freeBusy ±2h buffer
 *   - advance_min_hours / advance_max_days booking window
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const month = searchParams.get('month'); // YYYY-MM

    if (!serviceId || !month) {
        return NextResponse.json({ error: 'service_id and month are required' }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    // 1. Get slot rules for this service (always needed for duration/buffer/advance)
    const rules = await sql`
        SELECT * FROM slot_rules WHERE service_id = ${serviceId} LIMIT 1
    `;

    if (rules.length === 0) {
        return NextResponse.json({ error: 'No slot rules configured for this service' }, { status: 404 });
    }

    const rule = rules[0];
    const slotDuration = rule.slot_duration; // minutes
    const bufferMinutes = rule.buffer_minutes;
    const advanceMinHours = rule.advance_min_hours;
    const advanceMaxDays = rule.advance_max_days;

    // 2. Get blocked dates for the month
    const monthStart = `${month}-01`;
    const [year, mo] = month.split('-').map(Number);
    const nextMonth = mo === 12 ? `${year + 1}-01-01` : `${year}-${String(mo + 1).padStart(2, '0')}-01`;

    const blockedRows = await sql`
        SELECT date FROM blocked_dates WHERE date >= ${monthStart}::date AND date < ${nextMonth}::date
    `;
    const blockedDates = new Set(blockedRows.map(r => r.date.toISOString().slice(0, 10)));

    // 3. Calendar date range
    const calendarStart = `${monthStart}T00:00:00+08:00`;
    const calendarEnd = `${nextMonth}T00:00:00+08:00`;

    // 4. Get Google Calendar busy times (primary calendar, for conflict check)
    let busyPeriods = [];
    let calendarConnected = false;
    try {
        busyPeriods = await getFreeBusy(calendarStart, calendarEnd);
        calendarConnected = true;
    } catch (err) {
        console.error('[booking/slots] Google Calendar freeBusy failed:', err);
    }

    // No buffer — only block slots that directly overlap with existing events
    const expandedBusy = busyPeriods.map(busy => ({
        start: new Date(busy.start),
        end: new Date(busy.end),
    }));

    // 5. Check for availability calendar (new: single source of truth)
    // Skipped when slot_rules.use_availability_calendar = false (e.g. test services using DB rules).
    let availabilityWindows = null;
    let availabilityMode = false;
    const skipAvailabilityCalendar = rule.use_availability_calendar === false;
    if (!skipAvailabilityCalendar) {
        try {
            availabilityWindows = await getAvailabilityWindows(calendarStart, calendarEnd);
            if (availabilityWindows !== null) availabilityMode = true;
        } catch (err) {
            console.error('[booking/slots] Availability calendar failed:', err);
        }
    }

    // 6. Generate slots
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + advanceMinHours * 60 * 60 * 1000);
    const maxBookingDate = new Date(now.getTime() + advanceMaxDays * 24 * 60 * 60 * 1000);

    const slots = availabilityWindows !== null
        ? generateSlotsFromAvailability(availabilityWindows, {
            slotDuration, bufferMinutes, minBookingTime, maxBookingDate,
            blockedDates, expandedBusy,
        })
        : generateSlotsFromDBRules(rule, {
            month, year, mo, slotDuration, bufferMinutes,
            minBookingTime, maxBookingDate, blockedDates, expandedBusy,
        });

    return NextResponse.json({
        month, serviceId, slots,
        _meta: { calendarConnected, availabilityMode },
    });
}

// ─────────────────────────────────────────────────────────────
// Mode A: Generate slots from Google Calendar availability windows
// ─────────────────────────────────────────────────────────────
function generateSlotsFromAvailability(windows, opts) {
    const { slotDuration, bufferMinutes, minBookingTime, maxBookingDate, blockedDates, expandedBusy } = opts;
    const slotMs = slotDuration * 60 * 1000;
    const stepMs = (slotDuration + bufferMinutes) * 60 * 1000;
    const slots = {};

    for (const window of windows) {
        let cursor = window.start.getTime();
        const windowEnd = window.end.getTime();

        while (cursor + slotMs <= windowEnd) {
            const slotStart = new Date(cursor);
            const slotEnd = new Date(cursor + slotMs);

            // Date key in Asia/Taipei (UTC+8)
            const dateStr = toTaipeiDateStr(slotStart);

            // Skip blocked dates
            if (blockedDates.has(dateStr)) {
                cursor += stepMs;
                continue;
            }

            // Skip if too soon or too far
            if (slotStart < minBookingTime || slotStart > maxBookingDate) {
                cursor += stepMs;
                continue;
            }

            // Skip if conflicts with primary calendar busy times (±2h buffer)
            const isBusy = expandedBusy.some(busy =>
                slotStart < busy.end && slotEnd > busy.start
            );

            if (!isBusy) {
                if (!slots[dateStr]) slots[dateStr] = [];
                slots[dateStr].push({
                    time: toTaipeiTimeStr(slotStart),
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString(),
                });
            }

            cursor += stepMs;
        }
    }

    return slots;
}

// ─────────────────────────────────────────────────────────────
// Mode B: Generate slots from DB rules (original logic, fallback)
// ─────────────────────────────────────────────────────────────
function generateSlotsFromDBRules(rule, opts) {
    const { month, year, mo, slotDuration, bufferMinutes, minBookingTime, maxBookingDate, blockedDates, expandedBusy } = opts;
    const availableDays = rule.available_days;
    const startHour = rule.start_hour;
    const endHour = rule.end_hour;
    const slots = {};
    const daysInMonth = new Date(year, mo, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${month}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(`${dateStr}T00:00:00+08:00`);

        if (blockedDates.has(dateStr)) continue;

        const dayOfWeek = dateObj.getDay();
        if (!availableDays.includes(dayOfWeek)) continue;
        if (dateObj > maxBookingDate) continue;

        // Weekday 9pm cutoff
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        const effectiveEndHour = isWeekday ? Math.min(endHour, 21) : endHour;

        const daySlots = [];

        for (let hour = startHour; hour < effectiveEndHour; hour++) {
            for (let min = 0; min < 60; min += slotDuration + bufferMinutes) {
                const slotStart = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00+08:00`);
                const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

                const endOfDay = new Date(`${dateStr}T${String(effectiveEndHour).padStart(2, '0')}:00:00+08:00`);
                if (slotEnd > endOfDay) continue;
                if (slotStart < minBookingTime) continue;

                const isBusy = expandedBusy.some(busy =>
                    slotStart < busy.end && slotEnd > busy.start
                );

                if (!isBusy) {
                    daySlots.push({
                        time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
                        start: slotStart.toISOString(),
                        end: slotEnd.toISOString(),
                    });
                }
            }
        }

        if (daySlots.length > 0) {
            slots[dateStr] = daySlots;
        }
    }

    return slots;
}

// ─────────────────────────────────────────────────────────────
// Helpers: Convert UTC Date to Asia/Taipei date/time strings
// ─────────────────────────────────────────────────────────────
function toTaipeiDateStr(date) {
    return date.toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).slice(0, 10);
}

function toTaipeiTimeStr(date) {
    return date.toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).slice(11, 16);
}
