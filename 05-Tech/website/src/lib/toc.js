/**
 * Table of Contents utilities
 * Extracts headings from Ghost HTML and injects anchor IDs
 */

const HEADING_REGEX = /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi;

/**
 * Strip HTML tags from a string to get plain text
 */
function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Extract h2/h3 headings from Ghost HTML content
 * @param {string} html - Raw HTML from Ghost
 * @returns {Array<{id: string, text: string, level: number}>}
 */
export function extractHeadings(html) {
    if (!html) return [];

    const headings = [];
    let match;
    let index = 0;

    // Reset regex state
    HEADING_REGEX.lastIndex = 0;

    while ((match = HEADING_REGEX.exec(html)) !== null) {
        const tag = match[1].toLowerCase();
        const text = stripHtml(match[3]);
        if (text) {
            headings.push({
                id: `heading-${index}`,
                text,
                level: tag === 'h2' ? 2 : 3,
            });
            index++;
        }
    }

    return headings;
}

/**
 * Inject id attributes into h2/h3 tags in the HTML
 * Must be called BEFORE splitting the HTML for CTA insertion
 * @param {string} html - Raw HTML from Ghost
 * @param {Array<{id: string}>} headings - Headings from extractHeadings()
 * @returns {string} HTML with id attributes injected
 */
export function injectHeadingIds(html, headings) {
    if (!html || !headings.length) return html;

    let index = 0;

    // Reset regex state
    HEADING_REGEX.lastIndex = 0;

    return html.replace(HEADING_REGEX, (fullMatch, tag, attrs, content) => {
        const text = stripHtml(content);
        if (!text || index >= headings.length) return fullMatch;

        const heading = headings[index];
        index++;

        // If tag already has an id, replace it; otherwise add one
        if (/\bid\s*=/.test(attrs)) {
            attrs = attrs.replace(/\bid\s*=\s*["'][^"']*["']/, `id="${heading.id}"`);
        } else {
            attrs = ` id="${heading.id}"${attrs}`;
        }

        return `<${tag}${attrs}>${content}</${tag}>`;
    });
}
