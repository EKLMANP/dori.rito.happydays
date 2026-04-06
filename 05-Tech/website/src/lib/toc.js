/**
 * Table of Contents utilities
 * Extracts headings from Ghost HTML, injects anchor IDs,
 * and linkifies Ghost's built-in TOC list items.
 */

const HEADING_REGEX = /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi;

/**
 * Strip HTML tags from a string to get plain text
 */
function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Normalize text for matching:
 * - Strip whitespace
 * - Convert Chinese numerals to Arabic (一→1, 二→2, 三→3, etc.)
 * - Remove parenthetical notes like （...）
 */
const CN_NUM_MAP = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10' };

function normalizeText(text) {
    let t = text.replace(/\s+/g, '').trim();
    // Convert Chinese numerals to Arabic
    Object.entries(CN_NUM_MAP).forEach(([cn, ar]) => { t = t.replaceAll(cn, ar); });
    // Remove full-width parenthetical notes
    t = t.replace(/[（(][^）)]*[）)]/g, '');
    return t;
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
 * Inject id attributes into h2/h3 tags and linkify Ghost's built-in TOC items.
 * Must be called BEFORE splitting the HTML for CTA insertion.
 *
 * This does two things:
 * 1. Adds id="heading-N" to each h2/h3 so anchor links work
 * 2. Finds li items in the article whose text matches a heading,
 *    and wraps them in anchor links so the Ghost TOC becomes clickable
 *
 * @param {string} html - Raw HTML from Ghost
 * @param {Array<{id: string, text: string}>} headings - Headings from extractHeadings()
 * @returns {string} HTML with IDs injected and TOC items linkified
 */
export function injectHeadingIds(html, headings) {
    if (!html || !headings.length) return html;

    // --- Pass 1: Inject IDs into headings ---
    let index = 0;
    HEADING_REGEX.lastIndex = 0;

    let result = html.replace(HEADING_REGEX, (fullMatch, tag, attrs, content) => {
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

    // --- Pass 2: Linkify TOC list items that match heading text ---
    // Build heading list for matching (normalized text + id)
    const headingEntries = headings.map((h) => ({
        normalized: normalizeText(h.text),
        id: h.id,
    }));

    result = result.replace(/<li>([\s\S]*?)<\/li>/gi, (match, content) => {
        // Skip if already contains a link
        if (/<a\s/i.test(content)) return match;

        const plainText = normalizeText(stripHtml(content));

        // Exact match only (after normalization: Chinese→Arabic numerals, strip parentheticals)
        // Fuzzy/contains matching caused false positives on regular list items
        const found = headingEntries.find((h) => h.normalized === plainText);

        if (found) {
            return `<li><a href="#${found.id}">${content}</a></li>`;
        }
        return match;
    });

    return result;
}
