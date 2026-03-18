/**
 * Google Calendar Integration
 *
 * Uses OAuth2 Service Account / Refresh Token approach for server-side access.
 * Provides: freebusy check, availability windows, create event with Meet link + attendee invite.
 */

const GOOGLE_API = 'https://www.googleapis.com/calendar/v3';

/**
 * Get a fresh access token using the stored refresh token.
 */
async function getAccessToken() {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Google Calendar credentials not configured');
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to refresh Google token: ${err}`);
    }

    const data = await res.json();
    return data.access_token;
}

/**
 * Check calendar free/busy for a date range.
 * Returns busy time ranges.
 *
 * @param {string} timeMin - ISO datetime string (start)
 * @param {string} timeMax - ISO datetime string (end)
 * @returns {Array<{start: string, end: string}>} Busy periods
 */
export async function getFreeBusy(timeMin, timeMax) {
    const token = await getAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const res = await fetch(`${GOOGLE_API}/freeBusy`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            timeMin,
            timeMax,
            timeZone: 'Asia/Taipei',
            items: [{ id: calendarId }],
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`FreeBusy API failed: ${err}`);
    }

    const data = await res.json();
    return data.calendars?.[calendarId]?.busy || [];
}

/**
 * Get availability windows from a dedicated "availability" calendar.
 *
 * The user creates events on GOOGLE_AVAILABILITY_CALENDAR_ID to mark when
 * they are available for bookings. This function reads those events and
 * returns time windows that the slot generator uses to produce bookable slots.
 *
 * Returns null if not configured (caller should fall back to DB rules).
 * Returns [] if configured but no availability events exist.
 *
 * @param {string} timeMin - ISO datetime string (start of range)
 * @param {string} timeMax - ISO datetime string (end of range)
 * @returns {Array<{start: Date, end: Date}>|null} Availability windows, or null if not configured
 */
export async function getAvailabilityWindows(timeMin, timeMax) {
    const calendarId = process.env.GOOGLE_AVAILABILITY_CALENDAR_ID;
    if (!calendarId) return null;

    const token = await getAccessToken();
    const allEvents = [];
    let pageToken = null;

    // Paginate through all events in the date range
    do {
        const params = new URLSearchParams({
            timeMin,
            timeMax,
            timeZone: 'Asia/Taipei',
            singleEvents: 'true',    // expand recurring events
            orderBy: 'startTime',
            maxResults: '250',
        });
        if (pageToken) params.set('pageToken', pageToken);

        const res = await fetch(
            `${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Availability calendar API failed: ${err}`);
        }

        const data = await res.json();

        for (const event of data.items || []) {
            // Skip cancelled events
            if (event.status === 'cancelled') continue;
            // Skip all-day events (no dateTime means all-day)
            if (!event.start?.dateTime || !event.end?.dateTime) continue;

            allEvents.push({
                start: new Date(event.start.dateTime),
                end: new Date(event.end.dateTime),
            });
        }

        pageToken = data.nextPageToken || null;
    } while (pageToken);

    // Merge overlapping windows
    return mergeOverlappingWindows(allEvents);
}

/**
 * Merge overlapping or adjacent time windows into non-overlapping ranges.
 * @param {Array<{start: Date, end: Date}>} windows
 * @returns {Array<{start: Date, end: Date}>}
 */
function mergeOverlappingWindows(windows) {
    if (windows.length <= 1) return windows;

    // Sort by start time
    windows.sort((a, b) => a.start - b.start);

    const merged = [{ ...windows[0] }];

    for (let i = 1; i < windows.length; i++) {
        const last = merged[merged.length - 1];
        const curr = windows[i];

        if (curr.start <= last.end) {
            // Overlapping or adjacent — extend the end
            last.end = curr.end > last.end ? curr.end : last.end;
        } else {
            merged.push({ ...curr });
        }
    }

    return merged;
}

/**
 * Create a Google Calendar event with Google Meet link.
 *
 * @param {object} params
 * @param {string} params.summary - Event title
 * @param {string} params.description - Event description
 * @param {string} params.startDateTime - ISO datetime (e.g., 2026-03-15T14:00:00+08:00)
 * @param {string} params.endDateTime - ISO datetime
 * @param {string[]} params.attendeeEmails - Emails to invite
 * @returns {object} Created event with htmlLink and meetLink
 */
export async function createEvent({ summary, description, startDateTime, endDateTime, attendeeEmails = [] }) {
    const token = await getAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const event = {
        summary,
        description,
        start: {
            dateTime: startDateTime,
            timeZone: 'Asia/Taipei',
        },
        end: {
            dateTime: endDateTime,
            timeZone: 'Asia/Taipei',
        },
        attendees: attendeeEmails.map(email => ({ email })),
        conferenceData: {
            createRequest: {
                requestId: `dr-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 60 },
                { method: 'popup', minutes: 30 },
            ],
        },
    };

    const res = await fetch(
        `${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Create event failed: ${err}`);
    }

    const created = await res.json();

    return {
        eventId: created.id,
        htmlLink: created.htmlLink,
        meetLink: created.conferenceData?.entryPoints?.find(
            e => e.entryPointType === 'video'
        )?.uri || null,
    };
}
