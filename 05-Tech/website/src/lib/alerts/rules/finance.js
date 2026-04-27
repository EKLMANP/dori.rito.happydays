import { SEVERITY } from '../engine.js';

export const FINANCE_RULES = [
    {
        id: 'revenue_mom_drop',
        severity: SEVERITY.warning,
        condition: (m) => m.revenueMomChange < -15,
        message: '本月營收較上月下滑超過 15%',
        suggestion: '檢視預約量、定價、競爭狀況與行銷投放效益',
    },
    {
        id: 'unpaid_overdue',
        severity: SEVERITY.critical,
        condition: (m) => m.unpaidOver72h > 0,
        message: '有未付款訂單逾時超過 72 小時',
        suggestion: '立即透過 LINE 提醒客戶，並通知財務追蹤',
    },
    {
        id: 'aov_drop',
        severity: SEVERITY.warning,
        condition: (m) => m.aovChange < -10,
        message: '客單價較上期下滑超過 10%',
        suggestion: '檢查促銷折扣使用率；確認課程包銷售是否下滑',
    },
];
