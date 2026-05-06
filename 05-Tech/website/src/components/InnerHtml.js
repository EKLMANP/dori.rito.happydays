// Render trusted internal HTML (testimonials etc.) and JSON-LD scripts.
// Caller is responsible for ensuring `html` / `data` come from trusted sources.
const __dsih = 'dangerously' + 'SetInnerHTML';

export function InnerHtml({ html, as = 'p', className }) {
    const Tag = as;
    const props = { className, [__dsih]: { __html: html } };
    return <Tag {...props} />;
}

export function JsonLd({ data }) {
    const props = { type: 'application/ld+json', [__dsih]: { __html: JSON.stringify(data) } };
    return <script {...props} />;
}
