import { NextResponse } from 'next/server';
import { isNotionConfigured, queryDatabase, getPropValue } from '@/lib/notion';

const CRM_DB_ID = process.env.NOTION_CRM_DB_ID || '22a17e11503d80eea2b5ccbe69a16c59';
const LESSON_COSTS_DB_ID = process.env.NOTION_LESSON_COSTS_DB_ID;
const MONTHLY_OVERHEAD = Number(process.env.MONTHLY_OVERHEAD) || 0;
const COMMUTE_HOURLY_RATE = Number(process.env.COMMUTE_HOURLY_RATE) || 300;

function buildEmptyMonths(monthCount) {
    const now = new Date();
    const months = [];
    for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push({
            month: key,
            revenue: 0, totalCosts: 0, grossProfit: 0, grossMargin: 0,
            overhead: MONTHLY_OVERHEAD, netProfit: -MONTHLY_OVERHEAD, netMargin: 0,
            lessonCount: 0,
            costBreakdown: { parking: 0, transport: 0, commute: 0 },
            byTrainer: {},
        });
    }
    return months;
}

/**
 * GET /api/admin/dashboard?months=6
 * 彙整營收 + 成本數據
 * Auth: middleware handles authentication via admin_session cookie
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const monthCount = Math.min(Number(searchParams.get('months')) || 6, 12);

        // DEV mode: Notion 未連線時回傳空數據
        if (!isNotionConfigured()) {
            console.log('[DEV] Notion API not configured, returning empty dashboard data');
            return NextResponse.json({
                months: buildEmptyMonths(monthCount),
                config: { commuteHourlyRate: COMMUTE_HOURLY_RATE, monthlyOverhead: MONTHLY_OVERHEAD },
                dev: true,
            });
        }

        // 計算月份範圍
        const now = new Date();
        const months = [];
        for (let i = monthCount - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                year: d.getFullYear(),
                month: d.getMonth() + 1,
            });
        }

        const startDate = `${months[0].key}-01`;
        const lastMonth = months[months.length - 1];
        const endMonth = lastMonth.month === 12 ? 1 : lastMonth.month + 1;
        const endYear = lastMonth.month === 12 ? lastMonth.year + 1 : lastMonth.year;
        const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

        // 取得營收資料（CRM：已付款的客戶）
        const revenuePages = await queryDatabase(CRM_DB_ID, {
            and: [
                { property: '付款狀態', status: { equals: '已付款' } },
                { property: '匯款日期', date: { on_or_after: startDate } },
                { property: '匯款日期', date: { before: endDate } },
            ],
        });

        // 取得成本資料
        let costPages = [];
        if (LESSON_COSTS_DB_ID) {
            costPages = await queryDatabase(LESSON_COSTS_DB_ID, {
                and: [
                    { property: '課堂日期', date: { on_or_after: startDate } },
                    { property: '課堂日期', date: { before: endDate } },
                ],
            });
        }

        // 按月彙整
        const monthlyData = months.map(({ key }) => {
            // 營收
            const monthRevenue = revenuePages
                .filter(p => {
                    const payDate = getPropValue(p, '匯款日期');
                    return payDate && payDate.startsWith(key);
                })
                .reduce((sum, p) => {
                    const amount = getPropValue(p, '課程金額') || 0;
                    return sum + amount;
                }, 0);

            // 成本 by trainer
            const monthCosts = costPages.filter(p => {
                const costDate = getPropValue(p, '課堂日期');
                return costDate && costDate.startsWith(key);
            });

            const totalCosts = monthCosts.reduce((sum, p) => sum + (getPropValue(p, '總成本') || 0), 0);
            const totalParking = monthCosts.reduce((sum, p) => sum + (getPropValue(p, '停車費') || 0), 0);
            const totalTransport = monthCosts.reduce((sum, p) => sum + (getPropValue(p, '交通費') || 0), 0);
            const totalCommute = monthCosts.reduce((sum, p) => sum + (getPropValue(p, '通勤成本') || 0), 0);
            const lessonCount = monthCosts.length;

            // 按訓練師拆分
            const byTrainer = {};
            for (const p of monthCosts) {
                const trainer = getPropValue(p, '訓練師') || '未指定';
                if (!byTrainer[trainer]) {
                    byTrainer[trainer] = { lessons: 0, costs: 0, revenue: 0 };
                }
                byTrainer[trainer].lessons++;
                byTrainer[trainer].costs += getPropValue(p, '總成本') || 0;
            }

            // 營收按訓練師拆分
            for (const p of revenuePages) {
                const payDate = getPropValue(p, '匯款日期');
                if (!payDate || !payDate.startsWith(key)) continue;
                const trainer = getPropValue(p, '負責訓練師') || '未指定';
                if (!byTrainer[trainer]) {
                    byTrainer[trainer] = { lessons: 0, costs: 0, revenue: 0 };
                }
                byTrainer[trainer].revenue += getPropValue(p, '課程金額') || 0;
            }

            const grossProfit = monthRevenue - totalCosts;
            const netProfit = grossProfit - MONTHLY_OVERHEAD;

            return {
                month: key,
                revenue: monthRevenue,
                totalCosts,
                grossProfit,
                grossMargin: monthRevenue > 0 ? Math.round((grossProfit / monthRevenue) * 100) : 0,
                overhead: MONTHLY_OVERHEAD,
                netProfit,
                netMargin: monthRevenue > 0 ? Math.round((netProfit / monthRevenue) * 100) : 0,
                lessonCount,
                costBreakdown: {
                    parking: totalParking,
                    transport: totalTransport,
                    commute: totalCommute,
                },
                byTrainer,
            };
        });

        return NextResponse.json({
            months: monthlyData,
            config: {
                commuteHourlyRate: COMMUTE_HOURLY_RATE,
                monthlyOverhead: MONTHLY_OVERHEAD,
            },
        });
    } catch (err) {
        console.error('Dashboard API error:', err);
        return NextResponse.json({ error: '取得 Dashboard 數據失敗' }, { status: 500 });
    }
}
