/**
 * Unified Analytics Layer
 * Single trackEvent() call pushes to: GTM DataLayer + Facebook Pixel + Mixpanel
 */

// Facebook Pixel event mapping
const FB_EVENT_MAP = {
    booking_start: 'ViewContent',
    questionnaire_submit: 'Lead',
    payment_view: 'InitiateCheckout',
    payment_start: 'AddToCart',
    payment_success: 'Purchase',
    booking_complete: 'CompleteRegistration',
};

/**
 * Track an event across all analytics platforms.
 * @param {string} eventName - Event name (e.g. 'booking_start')
 * @param {object} data - Event data payload
 */
export function trackEvent(eventName, data = {}) {
    if (typeof window === 'undefined') return;

    // 1. GTM DataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...data });

    // 2. Facebook Pixel (enabled when NEXT_PUBLIC_FB_PIXEL_ID is set)
    if (window.fbq) {
        const fbEvent = FB_EVENT_MAP[eventName];
        if (fbEvent) {
            window.fbq('track', fbEvent, data);
        }
    }

    // 3. Mixpanel (enabled when NEXT_PUBLIC_MIXPANEL_TOKEN is set)
    if (window.mixpanel) {
        window.mixpanel.track(eventName, data);
    }
}
