(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/NewsletterCTA.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NewsletterCTA
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/constants.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function NewsletterCTA({ variant = 'full' }) {
    _s();
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle'); // idle | loading | success | error
    const isInline = variant === 'inline';
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!email || !email.includes('@')) return;
        setStatus('loading');
        try {
            // Track newsletter subscription event in GA4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'newsletter_subscribe', {
                    event_category: 'engagement',
                    event_label: variant
                });
            }
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email
                })
            });
            if (res.ok) {
                setStatus('success');
                setEmail('');
            } else {
                setStatus('error');
            }
        } catch  {
            setStatus('error');
        }
    };
    if (isInline) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            id: "newsletter",
            style: {
                background: 'var(--color-sage)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                margin: '2.5rem 0',
                textAlign: 'center'
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        opacity: 0.7,
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    },
                    children: "訂閱電子報"
                }, void 0, false, {
                    fileName: "[project]/src/components/NewsletterCTA.js",
                    lineNumber: 58,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    style: {
                        marginBottom: '0.5rem',
                        fontSize: '1.3rem'
                    },
                    children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NEWSLETTER_COPY"].headline
                }, void 0, false, {
                    fileName: "[project]/src/components/NewsletterCTA.js",
                    lineNumber: 61,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        color: 'var(--color-text-muted)',
                        marginBottom: '1.25rem',
                        fontSize: '0.95rem'
                    },
                    children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NEWSLETTER_COPY"].subhead
                }, void 0, false, {
                    fileName: "[project]/src/components/NewsletterCTA.js",
                    lineNumber: 64,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SubscribeForm, {
                    email: email,
                    setEmail: setEmail,
                    status: status,
                    handleSubmit: handleSubmit
                }, void 0, false, {
                    fileName: "[project]/src/components/NewsletterCTA.js",
                    lineNumber: 67,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/NewsletterCTA.js",
            lineNumber: 48,
            columnNumber: 13
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "newsletter",
        style: {
            background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-cream) 100%)',
            padding: 'var(--section-padding)',
            textAlign: 'center'
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container",
            style: {
                maxWidth: '600px'
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        fontSize: '3rem',
                        marginBottom: '1rem'
                    },
                    children: "📩"
                }, void 0, false, {
                    fileName: "[project]/src/components/NewsletterCTA.js",
                    lineNumber: 82,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    style: {
                        marginBottom: '0.75rem'
                    },
                    children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NEWSLETTER_COPY"].headline
                }, void 0, false, {
                    fileName: "[project]/src/components/NewsletterCTA.js",
                    lineNumber: 83,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        color: 'var(--color-text-muted)',
                        marginBottom: '2rem',
                        fontSize: '1.05rem'
                    },
                    children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NEWSLETTER_COPY"].subhead
                }, void 0, false, {
                    fileName: "[project]/src/components/NewsletterCTA.js",
                    lineNumber: 84,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SubscribeForm, {
                    email: email,
                    setEmail: setEmail,
                    status: status,
                    handleSubmit: handleSubmit,
                    large: true
                }, void 0, false, {
                    fileName: "[project]/src/components/NewsletterCTA.js",
                    lineNumber: 87,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        marginTop: '1rem',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)'
                    },
                    children: "免費訂閱，隨時可取消。我們不會發送垃圾郵件。"
                }, void 0, false, {
                    fileName: "[project]/src/components/NewsletterCTA.js",
                    lineNumber: 88,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/NewsletterCTA.js",
            lineNumber: 81,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/NewsletterCTA.js",
        lineNumber: 73,
        columnNumber: 9
    }, this);
}
_s(NewsletterCTA, "4e7CyTvSIXKg0XJWYe8bTLqSzlM=");
_c = NewsletterCTA;
function SubscribeForm({ email, setEmail, status, handleSubmit, large }) {
    const { placeholder, button, successMessage, errorMessage } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NEWSLETTER_COPY"];
    if (status === 'success') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                padding: '1rem 1.5rem',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
                fontWeight: 600,
                fontSize: '1rem'
            },
            children: [
                "✅ ",
                successMessage
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/NewsletterCTA.js",
            lineNumber: 101,
            columnNumber: 13
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSubmit,
                style: {
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "email",
                        className: "input",
                        value: email,
                        onChange: (e)=>setEmail(e.target.value),
                        placeholder: placeholder,
                        required: true,
                        style: {
                            flex: '1',
                            minWidth: '220px',
                            maxWidth: large ? '380px' : '280px'
                        },
                        "aria-label": "電子郵件地址"
                    }, void 0, false, {
                        fileName: "[project]/src/components/NewsletterCTA.js",
                        lineNumber: 125,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        className: "btn btn-primary",
                        disabled: status === 'loading',
                        id: "newsletter-subscribe-btn",
                        style: {
                            padding: large ? '0.875rem 2rem' : '0.75rem 1.5rem'
                        },
                        children: status === 'loading' ? '訂閱中...' : button
                    }, void 0, false, {
                        fileName: "[project]/src/components/NewsletterCTA.js",
                        lineNumber: 135,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/NewsletterCTA.js",
                lineNumber: 116,
                columnNumber: 13
            }, this),
            status === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    marginTop: '0.75rem',
                    color: '#c0392b',
                    fontSize: '0.875rem'
                },
                children: [
                    "❌ ",
                    errorMessage
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/NewsletterCTA.js",
                lineNumber: 146,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true);
}
_c1 = SubscribeForm;
var _c, _c1;
__turbopack_context__.k.register(_c, "NewsletterCTA");
__turbopack_context__.k.register(_c1, "SubscribeForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/FAQSection.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FAQSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/constants.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function FAQSection({ faqs = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FAQS"], title = '常見問題' }) {
    _s();
    const [openIndex, setOpenIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "section bg-white",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container",
            style: {
                maxWidth: '800px'
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    style: {
                        textAlign: 'center',
                        marginBottom: '2.5rem'
                    },
                    children: title
                }, void 0, false, {
                    fileName: "[project]/src/components/FAQSection.js",
                    lineNumber: 12,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    },
                    children: faqs.map((faq, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                background: openIndex === i ? 'var(--color-cream)' : 'var(--color-white)',
                                transition: 'var(--transition)'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setOpenIndex(openIndex === i ? null : i),
                                    style: {
                                        width: '100%',
                                        padding: '1.25rem 1.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'none',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        color: 'var(--color-text)',
                                        gap: '1rem'
                                    },
                                    "aria-expanded": openIndex === i,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: faq.question
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/FAQSection.js",
                                            lineNumber: 44,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                fontSize: '1.2rem',
                                                transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.25s ease',
                                                flexShrink: 0,
                                                color: 'var(--color-primary)'
                                            },
                                            children: "+"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/FAQSection.js",
                                            lineNumber: 45,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/FAQSection.js",
                                    lineNumber: 25,
                                    columnNumber: 29
                                }, this),
                                openIndex === i && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: '0 1.5rem 1.25rem',
                                        color: 'var(--color-text-muted)',
                                        lineHeight: 1.7,
                                        animation: 'fadeInUp 0.2s ease'
                                    },
                                    children: faq.answer
                                }, void 0, false, {
                                    fileName: "[project]/src/components/FAQSection.js",
                                    lineNumber: 54,
                                    columnNumber: 33
                                }, this)
                            ]
                        }, i, true, {
                            fileName: "[project]/src/components/FAQSection.js",
                            lineNumber: 15,
                            columnNumber: 25
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/FAQSection.js",
                    lineNumber: 13,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/FAQSection.js",
            lineNumber: 11,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/FAQSection.js",
        lineNumber: 10,
        columnNumber: 9
    }, this);
}
_s(FAQSection, "7z1SfW1ag/kVV/D8SOtFgmPOJ8o=");
_c = FAQSection;
var _c;
__turbopack_context__.k.register(_c, "FAQSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_93d98d2a._.js.map