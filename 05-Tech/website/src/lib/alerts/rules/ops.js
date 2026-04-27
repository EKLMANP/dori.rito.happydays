import { SEVERITY } from '../engine.js';

export const OPS_RULES = [
    {
        id: 'completion_rate_low',
        severity: SEVERITY.warning,
        condition: (m) => m.completionRate < 80,
        message: '預約完成率偏低',
        suggestion: '檢視取消原因，是否客戶端或教練端問題；考慮收取訂金',
    },
    {
        id: 'avg_days_ahead_short',
        severity: SEVERITY.warning,
        condition: (m) => m.avgDaysAhead < 3 && m.avgDaysAhead > 0,
        message: '平均提前預約天數過短，容量可能吃緊',
        suggestion: '建議擴增教練時段或限制臨時預約',
    },
    {
        id: 'cancellation_rate_high',
        severity: SEVERITY.warning,
        condition: (m) => m.cancellationRate > 20,
        message: `取消率偏高`,
        suggestion: '檢視取消原因；近期是否有服務品質事件',
    },
    {
        id: 'pending_assignment',
        severity: SEVERITY.critical,
        condition: (m) => m.pendingAssignment > 0,
        message: `有訂單付款後逾時未指派教練`,
        suggestion: '立即確認並指派教練，維護客戶信任',
    },
];
