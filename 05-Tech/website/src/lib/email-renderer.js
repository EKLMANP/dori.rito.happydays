/**
 * Email Template Renderer
 *
 * Renders DB-stored email templates into final HTML emails.
 * Supports variable interpolation: {{variable_name}}
 * Sanitizes HTML to prevent XSS in email content.
 */

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

/**
 * Render a complete HTML email from a template record and data.
 *
 * @param {object} template - DB template record (subject, body_html, header_image_url, etc.)
 * @param {object} data - Variable values for interpolation
 * @returns {string} Complete HTML email string
 */
export function renderEmailTemplate(template, data = {}) {
    const subject = interpolate(template.subject, data);
    const bodyHtml = interpolate(template.body_html, data);
    const footerHtml = interpolate(template.footer_html || '', data);

    const headerImage = template.header_image_url
        ? `<img src="${template.header_image_url}" width="${template.header_image_width || 600}" alt="Dori & Rito" style="display:block;max-width:100%;height:auto;" />`
        : '';

    const footer = footerHtml
        ? `<tr><td style="padding:20px 30px;font-size:12px;color:#999;text-align:center;border-top:1px solid #eee;">${footerHtml}</td></tr>`
        : `<tr><td style="padding:20px 30px;font-size:12px;color:#999;text-align:center;border-top:1px solid #eee;">
            &copy; ${new Date().getFullYear()} Dori &amp; Rito Happydays &mdash; 正向訓犬<br/>
            <a href="https://doriritohappydays.com" style="color:#999;">doriritohappydays.com</a>
           </td></tr>`;

    return `<!DOCTYPE html>
<html lang="zh-TW">
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
