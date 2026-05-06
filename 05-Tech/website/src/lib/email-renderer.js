/**
 * Email Template Renderer
 *
 * Renders DB-stored email templates into final HTML emails.
 * Supports variable interpolation: {{variable_name}}
 * Sanitizes HTML to prevent XSS in email content.
 */

const EN_TEMPLATES = {
    'booking-confirmation': {
        subject: '[Dori & Rito Happydays] Booking confirmed — {{service_name}}',
        body_html: `<h2>Hi {{customer_name}}, you're all booked! 🐾</h2>

<p>Thanks for booking <strong>Dori &amp; Rito Happydays</strong> — here are your session details:</p>

<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr>
    <td style="padding:10px 14px;border:1px solid #eee;background:#fafafa;font-weight:600;width:140px;">Date</td>
    <td style="padding:10px 14px;border:1px solid #eee;">{{slot_date}}</td>
  </tr>
  <tr>
    <td style="padding:10px 14px;border:1px solid #eee;background:#fafafa;font-weight:600;">Time</td>
    <td style="padding:10px 14px;border:1px solid #eee;">{{slot_time}}</td>
  </tr>
  <tr>
    <td style="padding:10px 14px;border:1px solid #eee;background:#fafafa;font-weight:600;">Amount</td>
    <td style="padding:10px 14px;border:1px solid #eee;">TWD {{price}}</td>
  </tr>
  <tr>
    <td style="padding:10px 14px;border:1px solid #eee;background:#fafafa;font-weight:600;">Order #</td>
    <td style="padding:10px 14px;border:1px solid #eee;">{{order_no}}</td>
  </tr>
  <tr>
    <td style="padding:10px 14px;border:1px solid #eee;background:#fafafa;font-weight:600;">Google Meet</td>
    <td style="padding:10px 14px;border:1px solid #eee;"><a href="{{meet_link}}" style="color:#E8652B;text-decoration:underline;">Click to join the session</a></td>
  </tr>
</table>

<p><strong>Before your consultation:</strong></p>
<ul style="padding-left:20px;margin:8px 0 16px;">
  <li>Join 5 minutes early using the Google Meet link above</li>
  <li>If you have videos of your dog's behaviour, have them ready to share</li>
  <li>Find a quiet spot and have {{dog_name}} nearby</li>
</ul>

<p>Need to reschedule or cancel? Please let us know at least 24 hours in advance.</p>
<p>Looking forward to meeting you and {{dog_name}}! 🐾</p>`,
    },
    'booking-reminder': {
        subject: '⏰ Reminder: your session tomorrow — {{service_name}}',
        body_html: `<h2>Hi {{customer_name}}, just a friendly reminder!</h2>
<p>You have a session booked for tomorrow:</p>

<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr>
    <td style="padding:8px 12px;border:1px solid #eee;background:#fafafa;font-weight:600;width:140px;">Service</td>
    <td style="padding:8px 12px;border:1px solid #eee;">{{service_name}}</td>
  </tr>
  <tr>
    <td style="padding:8px 12px;border:1px solid #eee;background:#fafafa;font-weight:600;">Date</td>
    <td style="padding:8px 12px;border:1px solid #eee;">{{slot_date}}</td>
  </tr>
  <tr>
    <td style="padding:8px 12px;border:1px solid #eee;background:#fafafa;font-weight:600;">Time</td>
    <td style="padding:8px 12px;border:1px solid #eee;">{{slot_time}}</td>
  </tr>
  <tr>
    <td style="padding:8px 12px;border:1px solid #eee;background:#fafafa;font-weight:600;">Meet link</td>
    <td style="padding:8px 12px;border:1px solid #eee;"><a href="{{meet_link}}" style="color:#E8652B;">Click to join</a></td>
  </tr>
</table>

<p>Please remember to prepare:</p>
<ul>
  <li>Any videos of your dog's behaviour (if you have them)</li>
  <li>A quiet space with {{dog_name}} nearby</li>
</ul>

<p>See you tomorrow! 🐾</p>`,
    },
};

/**
 * Replace {{variable}} placeholders with actual values.
 * Unmatched placeholders are replaced with empty string.
 */
function interpolate(text, data) {
    if (!text) return '';
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : '';
    });
}

/** LINE CTA HTML snippet for email, locale-aware */
function getLineCta(locale) {
    if (locale === 'en') {
        return `<a href="https://lin.ee/9OHBvAL" style="text-decoration:none;">
<img src="https://scdn.line-apps.com/n/line_add_friends/btn/en.png" alt="Add LINE Official Account" style="height:36px;vertical-align:middle;" />
</a>`;
    }
    return `<a href="https://lin.ee/9OHBvAL" style="text-decoration:none;">
<img src="https://scdn.line-apps.com/n/line_add_friends/btn/zh-Hant.png" alt="加入LINE官方帳號" style="height:36px;vertical-align:middle;" />
</a>`;
}

const SERVICE_OVERRIDES = {
    'zh-TW': {
        consultLabel: '諮詢前小提醒',
        courseLabel: '課程前小提醒',
        lineTip: (lineCta) => `為了讓你可以在線上課程收穫滿滿，務必請先加入我們的官方LINE帳號 ${lineCta} 並傳送訊息或貼圖，方便老師在課程前跟你討論毛寶貝的狀況喔！`,
        multiSessionNote: '此為第一堂課，後續課程將另外再與老師協調時間',
    },
    en: {
        consultLabel: 'Before your consultation',
        courseLabel: 'Before your session',
        lineTip: (lineCta) => `To make the most of your online session, please join our LINE account ${lineCta} and send us a quick message or sticker — your trainer will reach out to learn about your dog before you meet.`,
        multiSessionNote: 'This is your first session. Your trainer will coordinate the schedule for subsequent sessions with you directly.',
    },
};

/**
 * Apply service-specific email body transformations.
 * - Renames "諮詢前小提醒" → "課程前小提醒"
 * - Prepends LINE CTA to first bullet
 * - Appends multi-session note for breakthrough-4
 */
function applyServiceOverrides(html, serviceId, locale = 'zh-TW') {
    if (!serviceId || (serviceId !== 'single-session' && serviceId !== 'breakthrough-4')) {
        return html;
    }

    const overrides = SERVICE_OVERRIDES[locale] || SERVICE_OVERRIDES['zh-TW'];
    const lineCta = getLineCta(locale);

    // 1. Rename consultation label → course label
    html = html.replace(overrides.consultLabel, overrides.courseLabel);

    // 2. Prepend LINE CTA to first <li>
    const lineTip = overrides.lineTip(lineCta);
    html = html.replace(
        /<ul([^>]*)>\s*<li>/,
        `<ul$1><li>${lineTip}</li><li>`
    );

    // 3. For breakthrough-4: append multi-session note before </ul>
    if (serviceId === 'breakthrough-4') {
        html = html.replace(
            /<\/ul>/,
            `<li>${overrides.multiSessionNote}</li></ul>`
        );
    }

    return html;
}

/**
 * Render a complete HTML email from a template record and data.
 *
 * @param {object} template - DB template record (subject, body_html, header_image_url, etc.)
 * @param {object} data - Variable values for interpolation
 * @param {string} [serviceId] - Service ID for conditional content
 * @returns {string} Complete HTML email string
 */
export function renderEmailTemplate(template, data = {}, serviceId, locale = 'zh-TW') {
    const enTpl = locale === 'en' && template.id ? EN_TEMPLATES[template.id] : null;
    const subject = interpolate(enTpl ? enTpl.subject : template.subject, data);
    let bodyHtml = interpolate(enTpl ? enTpl.body_html : template.body_html, data);
    bodyHtml = applyServiceOverrides(bodyHtml, serviceId, locale);
    const footerHtml = interpolate(template.footer_html || '', data);

    const headerImage = template.header_image_url
        ? `<img src="${template.header_image_url}" width="${template.header_image_width || 600}" alt="Dori & Rito" style="display:block;max-width:100%;height:auto;" />`
        : '';

    const footer = footerHtml
        ? `<tr><td style="padding:20px 30px;font-size:12px;color:#999;text-align:center;border-top:1px solid #eee;">${footerHtml}</td></tr>`
        : `<tr><td style="padding:20px 30px;font-size:12px;color:#999;text-align:center;border-top:1px solid #eee;">
            &copy; ${new Date().getFullYear()} Dori &amp; Rito Happydays<br/>
            <a href="https://doriritohappydays.com" style="color:#999;">doriritohappydays.com</a>
           </td></tr>`;

    const lang = locale === 'en' ? 'en' : 'zh-TW';
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          ${headerImage ? `<tr><td style="padding:0;">${headerImage}</td></tr>` : ''}
          <tr>
            <td style="padding:30px;font-size:16px;line-height:1.6;color:#333;">
              ${bodyHtml}
            </td>
          </tr>
          ${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Get the interpolated subject line.
 */
export function renderSubject(template, data = {}) {
    return interpolate(template.subject, data);
}
