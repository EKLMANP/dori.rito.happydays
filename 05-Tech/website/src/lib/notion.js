import { Client } from '@notionhq/client';

let notionClient = null;

/**
 * 檢查 Notion API 是否已設定
 */
export function isNotionConfigured() {
    return !!process.env.NOTION_API_KEY;
}

export function getNotionClient() {
    if (!notionClient) {
        const apiKey = process.env.NOTION_API_KEY;
        if (!apiKey) throw new Error('NOTION_API_KEY is not configured');
        notionClient = new Client({ auth: apiKey });
    }
    return notionClient;
}

/**
 * 查詢 Notion 資料庫（自動處理分頁）
 */
export async function queryDatabase(dbId, filter = undefined, sorts = undefined, maxPages = 3) {
    const notion = getNotionClient();
    const results = [];
    let cursor = undefined;
    let pageCount = 0;

    do {
        const response = await notion.databases.query({
            database_id: dbId,
            filter,
            sorts,
            start_cursor: cursor,
            page_size: 100,
        });
        results.push(...response.results);
        cursor = response.has_more ? response.next_cursor : undefined;
        pageCount++;
    } while (cursor && pageCount < maxPages);

    return results;
}

/**
 * 建立 Notion page
 */
export async function createPage(dbId, properties) {
    const notion = getNotionClient();
    return notion.pages.create({
        parent: { database_id: dbId },
        properties,
    });
}

/**
 * 從 Notion page 取得屬性值
 */
export function getPropValue(page, propName) {
    const prop = page.properties?.[propName];
    if (!prop) return null;

    switch (prop.type) {
        case 'title':
            return prop.title.map(t => t.plain_text).join('');
        case 'rich_text':
            return prop.rich_text.map(t => t.plain_text).join('');
        case 'number':
            return prop.number;
        case 'select':
            return prop.select?.name || null;
        case 'multi_select':
            return prop.multi_select.map(s => s.name);
        case 'date':
            return prop.date?.start || null;
        case 'email':
            return prop.email || null;
        case 'status':
            return prop.status?.name || null;
        case 'relation':
            return prop.relation.map(r => r.id);
        default:
            return null;
    }
}
