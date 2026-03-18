import { NextResponse } from 'next/server';
import { validateAdminPin } from '@/lib/admin-auth';
import { isNotionConfigured, queryDatabase, createPage, getPropValue } from '@/lib/notion';

const LESSON_COSTS_DB_ID = process.env.NOTION_LESSON_COSTS_DB_ID;
const COMMUTE_HOURLY_RATE = Number(process.env.COMMUTE_HOURLY_RATE) || 300;

/**
 * POST /api/admin/lesson-costs
 * 新增一筆課堂成本紀錄
 */
export async function POST(request) {
    const auth = validateAdminPin(request);
    if (!auth.valid) return auth.response;

    if (!isNotionConfigured()) {
        return NextResponse.json(
            { error: '請先設定 NOTION_API_KEY 環境變數' },
            { status: 500 }
        );
    }

    if (!LESSON_COSTS_DB_ID) {
        return NextResponse.json(
            { error: '請先設定 NOTION_LESSON_COSTS_DB_ID 或執行 /api/admin/setup' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const {
            trainer,
            customerId,
            customerName,
            date,
            parkingFee = 0,
            transportFee = 0,
            transportType = '其他',
            commuteMinutes = 0,
            notes = '',
        } = body;

        // 驗證
        if (!trainer || !date) {
            return NextResponse.json({ error: '訓練師和日期為必填' }, { status: 400 });
        }

        // 計算成本
        const commuteCost = Math.round(commuteMinutes * (COMMUTE_HOURLY_RATE / 60));
        const totalCost = Number(parkingFee) + Number(transportFee) + commuteCost;

        // 課堂標題
        const title = `${customerName || '未指定'} - ${date}`;

        const properties = {
            '課堂標題': {
                title: [{ text: { content: title } }],
            },
            '訓練師': {
                select: { name: trainer },
            },
            '課堂日期': {
                date: { start: date },
            },
            '停車費': {
                number: Number(parkingFee),
            },
            '交通費': {
                number: Number(transportFee),
            },
            '交通方式': {
                select: { name: transportType },
            },
            '通勤時間(分鐘)': {
                number: Number(commuteMinutes),
            },
            '通勤成本': {
                number: commuteCost,
            },
            '總成本': {
                number: totalCost,
            },
        };

        // 客戶關聯（如有）
        if (customerId) {
            properties['客戶'] = {
                relation: [{ id: customerId }],
            };
        }

        // 備註
        if (notes.trim()) {
            properties['備註'] = {
                rich_text: [{ text: { content: notes.trim() } }],
            };
        }

        await createPage(LESSON_COSTS_DB_ID, properties);

        return NextResponse.json({
            success: true,
            summary: {
                title,
                trainer,
                parkingFee: Number(parkingFee),
                transportFee: Number(transportFee),
                commuteCost,
                totalCost,
                commuteHourlyRate: COMMUTE_HOURLY_RATE,
            },
        });
    } catch (err) {
        console.error('Lesson costs POST error:', err);
        return NextResponse.json({ error: '建立成本紀錄失敗' }, { status: 500 });
    }
}

/**
 * GET /api/admin/lesson-costs?month=2026-03&trainer=Eric Pan
 * 查詢課堂成本紀錄
 */
export async function GET(request) {
    const auth = validateAdminPin(request);
    if (!auth.valid) return auth.response;

    if (!LESSON_COSTS_DB_ID) {
        return NextResponse.json({ costs: [] });
    }

    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month'); // e.g. 2026-03
        const trainer = searchParams.get('trainer');

        const filters = [];

        if (month) {
            const [year, mon] = month.split('-').map(Number);
            const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
            const nextMon = mon === 12 ? 1 : mon + 1;
            const nextYear = mon === 12 ? year + 1 : year;
            const endDate = `${nextYear}-${String(nextMon).padStart(2, '0')}-01`;

            filters.push({
                property: '課堂日期',
                date: { on_or_after: startDate },
            });
            filters.push({
                property: '課堂日期',
                date: { before: endDate },
            });
        }

        if (trainer) {
            filters.push({
                property: '訓練師',
                select: { equals: trainer },
            });
        }

        const filter = filters.length > 1
            ? { and: filters }
            : filters.length === 1
                ? filters[0]
                : undefined;

        const pages = await queryDatabase(LESSON_COSTS_DB_ID, filter, [
            { property: '課堂日期', direction: 'descending' },
        ]);

        const costs = pages.map(page => ({
            id: page.id,
            title: getPropValue(page, '課堂標題'),
            trainer: getPropValue(page, '訓練師'),
            date: getPropValue(page, '課堂日期'),
            parkingFee: getPropValue(page, '停車費') || 0,
            transportFee: getPropValue(page, '交通費') || 0,
            transportType: getPropValue(page, '交通方式'),
            commuteMinutes: getPropValue(page, '通勤時間(分鐘)') || 0,
            commuteCost: getPropValue(page, '通勤成本') || 0,
            totalCost: getPropValue(page, '總成本') || 0,
        }));

        return NextResponse.json({ costs });
    } catch (err) {
        console.error('Lesson costs GET error:', err);
        return NextResponse.json({ error: '查詢成本紀錄失敗' }, { status: 500 });
    }
}
