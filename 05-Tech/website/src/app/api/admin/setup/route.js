import { NextResponse } from 'next/server';
import { validateAdminPin } from '@/lib/admin-auth';
import { getNotionClient } from '@/lib/notion';

const CRM_DB_ID = process.env.NOTION_CRM_DB_ID || '22a17e11503d80eea2b5ccbe69a16c59';

/**
 * POST /api/admin/setup
 * 自動設定 Notion：
 * 1. 在 CRM 所在的 page 下建立「課堂成本紀錄」資料庫
 * 2. 為 CRM 新增「課程金額」和「負責訓練師」欄位
 */
export async function POST(request) {
    const auth = validateAdminPin(request);
    if (!auth.valid) return auth.response;

    const notion = getNotionClient();
    const results = { lessonCostsDbId: null, crmUpdated: false, errors: [] };

    // 1. 建立「課堂成本紀錄」資料庫
    if (!process.env.NOTION_LESSON_COSTS_DB_ID) {
        try {
            // 取得 CRM 所在的 parent
            const crmDb = await notion.databases.retrieve({ database_id: CRM_DB_ID });
            const parentId = crmDb.parent?.page_id || crmDb.parent?.workspace;

            const parentConfig = crmDb.parent?.type === 'page_id'
                ? { type: 'page_id', page_id: crmDb.parent.page_id }
                : { type: 'page_id', page_id: CRM_DB_ID };

            const newDb = await notion.databases.create({
                parent: parentConfig,
                title: [{ text: { content: '課堂成本紀錄' } }],
                properties: {
                    '課堂標題': { title: {} },
                    '客戶': {
                        relation: {
                            database_id: CRM_DB_ID,
                            single_property: {},
                        },
                    },
                    '訓練師': {
                        select: {
                            options: [
                                { name: 'Eric Pan', color: 'blue' },
                                { name: 'Pennee Tan', color: 'pink' },
                            ],
                        },
                    },
                    '課堂日期': { date: {} },
                    '停車費': { number: { format: 'number' } },
                    '交通費': { number: { format: 'number' } },
                    '交通方式': {
                        select: {
                            options: [
                                { name: '捷運', color: 'green' },
                                { name: '客運', color: 'orange' },
                                { name: '其他', color: 'gray' },
                            ],
                        },
                    },
                    '通勤時間(分鐘)': { number: { format: 'number' } },
                    '通勤成本': { number: { format: 'number' } },
                    '總成本': { number: { format: 'number' } },
                    '備註': { rich_text: {} },
                },
            });

            results.lessonCostsDbId = newDb.id;
            console.log(`✅ 課堂成本紀錄資料庫已建立: ${newDb.id}`);
        } catch (err) {
            console.error('建立課堂成本紀錄資料庫失敗:', err);
            results.errors.push(`建立資料庫失敗: ${err.message}`);
        }
    } else {
        results.lessonCostsDbId = process.env.NOTION_LESSON_COSTS_DB_ID;
    }

    // 2. 為 CRM 新增欄位
    try {
        const crmDb = await notion.databases.retrieve({ database_id: CRM_DB_ID });
        const existingProps = Object.keys(crmDb.properties);

        const updates = {};

        if (!existingProps.includes('課程金額')) {
            updates['課程金額'] = { number: { format: 'number' } };
        }

        if (!existingProps.includes('負責訓練師')) {
            updates['負責訓練師'] = {
                select: {
                    options: [
                        { name: 'Eric Pan', color: 'blue' },
                        { name: 'Pennee Tan', color: 'pink' },
                    ],
                },
            };
        }

        if (Object.keys(updates).length > 0) {
            await notion.databases.update({
                database_id: CRM_DB_ID,
                properties: updates,
            });
            results.crmUpdated = true;
            console.log(`✅ CRM 已新增欄位: ${Object.keys(updates).join(', ')}`);
        } else {
            results.crmUpdated = true; // already exists
        }
    } catch (err) {
        console.error('更新 CRM 欄位失敗:', err);
        results.errors.push(`更新 CRM 失敗: ${err.message}`);
    }

    const success = results.errors.length === 0;

    return NextResponse.json({
        success,
        ...results,
        message: success
            ? `設定完成！請將 NOTION_LESSON_COSTS_DB_ID=${results.lessonCostsDbId} 加入 .env`
            : '部分設定失敗，請查看 errors',
    });
}
