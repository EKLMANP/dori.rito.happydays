import { SEVERITY } from '../engine.js';

export const CS_RULES = [
    {
        id: 'churn_rate_rising',
        severity: SEVERITY.warning,
        condition: (m) => m.churnRateChange > 20,
        message: '本月流失客戶數較上週上升超過 20%',
        suggestion: '啟動贏回 campaign；深入了解最後互動原因',
    },
    {
        id: 'low_survey_fill_rate',
        severity: SEVERITY.info,
        condition: (m) => m.surveyFillRate < 50,
        message: '課後問卷回填率低於 50%',
        suggestion: '調整問卷寄送時機與誘因設計',
    },
    {
        id: 'low_rating',
        severity: SEVERITY.critical,
        condition: (m) => m.hasLowRating,
        message: '有客戶評分 ≤ 2 分',
        suggestion: '立即安排 CS 主管聯繫，執行 7 天內補救 SOP',
    },
    {
        id: 'repurchase_rate_low',
        severity: SEVERITY.warning,
        condition: (m) => m.repurchaseRate30d < 25,
        message: '30 天回購率低於 25%',
        suggestion: '啟動課後關懷流程，向客戶推薦下一階段課程',
    },
];
