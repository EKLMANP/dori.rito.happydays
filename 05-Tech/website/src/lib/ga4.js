/**
 * Google Analytics 4 Data API client.
 *
 * Env: GA4_PROPERTY_ID, GOOGLE_SERVICE_ACCOUNT_KEY (base64-encoded JSON)
 */

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;

/** Check if GA4 is configured */
export function isGA4Configured() {
    return !!(GA4_PROPERTY_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
}

/** Lazy-load the GA4 client to avoid import errors if not installed */
async function getClient() {
    if (!isGA4Configured()) return null;

    try {
        const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
        const credentials = JSON.parse(
            Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString()
        );
        return new BetaAnalyticsDataClient({ credentials });
    } catch (err) {
        console.error('[GA4] Client init error:', err.message);
        return null;
    }
}

/** Get sessions and users for a date range */
export async function getSessionsAndUsers(startDate, endDate) {
    const client = await getClient();
    if (!client) return null;

    try {
        const [response] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            metrics: [
                { name: 'sessions' },
                { name: 'totalUsers' },
                { name: 'screenPageViews' },
            ],
        });

        const row = response.rows?.[0];
        return {
            sessions: parseInt(row?.metricValues?.[0]?.value || '0'),
            users: parseInt(row?.metricValues?.[1]?.value || '0'),
            pageViews: parseInt(row?.metricValues?.[2]?.value || '0'),
        };
    } catch (err) {
        console.error('[GA4] sessions error:', err.message);
        return null;
    }
}

/** Get traffic source distribution */
export async function getTrafficSources(startDate, endDate) {
    const client = await getClient();
    if (!client) return null;

    try {
        const [response] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'sessionDefaultChannelGroup' }],
            metrics: [{ name: 'sessions' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 10,
        });

        return (response.rows || []).map((row) => ({
            source: row.dimensionValues[0].value,
            sessions: parseInt(row.metricValues[0].value),
        }));
    } catch (err) {
        console.error('[GA4] traffic sources error:', err.message);
        return null;
    }
}

/** Get top blog posts by page views */
export async function getTopBlogPosts(startDate, endDate, limit = 10) {
    const client = await getClient();
    if (!client) return null;

    try {
        const [response] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
            metrics: [{ name: 'screenPageViews' }],
            dimensionFilter: {
                filter: {
                    fieldName: 'pagePath',
                    stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' },
                },
            },
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit,
        });

        return (response.rows || []).map((row) => ({
            path: row.dimensionValues[0].value,
            title: row.dimensionValues[1].value,
            views: parseInt(row.metricValues[0].value),
        }));
    } catch (err) {
        console.error('[GA4] top posts error:', err.message);
        return null;
    }
}

/** Get booking funnel conversion (page_view → contact click → form submit) */
export async function getBookingFunnel(startDate, endDate) {
    const client = await getClient();
    if (!client) return null;

    try {
        // Total page views
        const [pvResponse] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            metrics: [{ name: 'screenPageViews' }],
        });

        // Contact button clicks (custom event: contact_click)
        const [clickResponse] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            metrics: [{ name: 'eventCount' }],
            dimensionFilter: {
                filter: {
                    fieldName: 'eventName',
                    stringFilter: { matchType: 'EXACT', value: 'contact_click' },
                },
            },
        });

        // Form submissions (custom event: form_submit or generate_lead)
        const [submitResponse] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            metrics: [{ name: 'eventCount' }],
            dimensionFilter: {
                filter: {
                    fieldName: 'eventName',
                    stringFilter: { matchType: 'EXACT', value: 'generate_lead' },
                },
            },
        });

        const pageViews = parseInt(pvResponse.rows?.[0]?.metricValues?.[0]?.value || '0');
        const contactClicks = parseInt(clickResponse.rows?.[0]?.metricValues?.[0]?.value || '0');
        const formSubmits = parseInt(submitResponse.rows?.[0]?.metricValues?.[0]?.value || '0');

        return {
            pageViews,
            contactClicks,
            formSubmits,
            conversionRate: pageViews > 0 ? ((formSubmits / pageViews) * 100).toFixed(2) : '0',
        };
    } catch (err) {
        console.error('[GA4] funnel error:', err.message);
        return null;
    }
}
