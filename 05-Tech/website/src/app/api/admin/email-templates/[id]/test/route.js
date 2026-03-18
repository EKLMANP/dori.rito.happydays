import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { renderEmailTemplate } from '@/lib/email-renderer';

// POST /api/admin/email-templates/:id/test — Send a test email
export async function POST(request, { params }) {
    const { error, session } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const { to } = await request.json();

    const recipientEmail = to || session.user.email;
    if (!recipientEmail) {
        return NextResponse.json({ error: 'No recipient email' }, { status: 400 });
    }

    // Fetch template
    const rows = await sql`SELECT * FROM email_templates WHERE id = ${id}`;
    if (rows.length === 0) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = rows[0];

    // Render with sample data
    const sampleData = {
        customer_name: '測試客戶',
        dog_name: '小黑',
        service_name: '一對一線上諮詢',
        slot_date: '2026-03-15',
        slot_time: '14:00',
        price: '500',
        merchant_trade_no: 'TEST-001',
        meet_link: 'https://meet.google.com/test-link',
    };

    const html = renderEmailTemplate(template, sampleData);

    // TODO Phase 3+: Send via Mailgun when configured
    // For now, return the rendered HTML for preview
    const mailgunKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;

    if (mailgunKey && mailgunDomain) {
        const formData = new FormData();
        formData.append('from', `Dori & Rito <noreply@${mailgunDomain}>`);
        formData.append('to', recipientEmail);
        formData.append('subject', `[測試] ${template.subject}`);
        formData.append('html', html);

        const res = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`api:${mailgunKey}`).toString('base64')}`,
            },
            body: formData,
        });

        if (!res.ok) {
            const errText = await res.text();
            return NextResponse.json(
                { error: 'Failed to send test email', details: errText },
                { status: 502 }
            );
        }

        return NextResponse.json({ success: true, sent_to: recipientEmail });
    }

    // No Mailgun configured — return rendered HTML for manual preview
    return NextResponse.json({
        success: true,
        message: 'Mailgun not configured. Returning rendered HTML.',
        sent_to: null,
        rendered_html: html,
    });
}
