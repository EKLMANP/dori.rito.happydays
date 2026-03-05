import { BRAND } from './constants';

/**
 * JSON-LD Schema 生成器
 * 為每個頁面類型生成適合的 Schema.org 結構化資料
 * 有助於 Google、ChatGPT、Perplexity 等 AI 引擎正確理解和引用你的內容
 */

// 本地商業 Schema（首頁使用）
export function localBusinessSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': ['LocalBusiness', 'ProfessionalService'],
        name: BRAND.name,
        description: BRAND.description,
        url: BRAND.siteUrl,
        email: BRAND.email,
        sameAs: [BRAND.instagram],
        // 服務區域：大台北
        areaServed: [
            { '@type': 'City', name: '台北市' },
            { '@type': 'City', name: '新北市' },
        ],
        // 線上服務：全台灣
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: '訓犬服務',
            itemListElement: [
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: '一對一到府訓犬服務',
                        description: '客製化到府正向訓練，6-8 週課程',
                    },
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: '一對一線上訓犬服務',
                        description: '跨地區線上正向訓練，高頻率影片回饋',
                    },
                },
            ],
        },
    };
}

// FAQ Schema（首頁、服務頁使用）
export function faqSchema(faqs) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

// 文章 Schema（文章內頁使用）
export function articleSchema(post) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        image: post.feature_image || null,
        datePublished: post.published_at,
        dateModified: post.updated_at || post.published_at,
        author: {
            '@type': 'Organization',
            name: BRAND.name,
            url: BRAND.siteUrl,
        },
        publisher: {
            '@type': 'Organization',
            name: BRAND.name,
            url: BRAND.siteUrl,
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${BRAND.siteUrl}/blog/${post.slug}`,
        },
    };
}

// 服務 Schema（1對1教學頁面使用）
export function serviceSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: '一對一正向訓犬服務',
        description: 'KPA、CATCH 認證訓犬師提供的客製化正向訓練，改善吠叫、分離焦慮、暴衝等問題',
        provider: {
            '@type': 'Organization',
            name: BRAND.name,
        },
        serviceType: '正向訓犬服務',
        areaServed: '台灣',
    };
}

// 組織 Schema（關於我們頁面使用）
export function organizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: BRAND.name,
        url: BRAND.siteUrl,
        email: BRAND.email,
        sameAs: [BRAND.instagram],
        description: BRAND.description,
    };
}
