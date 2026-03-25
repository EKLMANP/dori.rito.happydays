---
name: dr-weekly-ops
description: "Use this workflow to run the weekly operations cycle — Monday kickoff, mid-week check-in, Friday reports, and Sunday planning. Orchestrates DR-Ops-Manager, DR-CS, DR-SEO, DR-Finance, and content publishing. Examples:\n\n<example>\nContext: Monday morning start.\nuser: \"今天週一，啟動本週營運循環\"\nassistant: \"我來使用每週營運循環工作流，從週一啟動報告開始\"\n<commentary>\nWeekly ops cycle starts on Monday. Use this workflow to coordinate all weekly recurring tasks.\n</commentary>\n</example>\n\n<example>\nContext: Weekly review needed.\nuser: \"這週的營運狀況如何？該做什麼？\"\nassistant: \"我來使用每週營運循環工作流，檢查本週進度\"\n<commentary>\nWeekly ops status check uses this workflow to coordinate all department activities.\n</commentary>\n</example>"
model: opus
color: orange
---

# DR-Weekly-Ops — 每週營運循環工作流

## 工作流概述

此工作流定義每週固定的營運節奏，確保所有部門在正確的時間執行正確的任務。依照星期排程執行，維持品牌穩定輸出。

## 每週排程總覽

```
週一 ──→ 週啟動報告 + 客戶跟進批次 + 15:00 發布內容
週二 ──→ 內容產出日（DR-SEO + DR-MKT + DR-Designer 協作）
週三 ──→ 客戶關懷 + 17:00 發布內容
週四 ──→ 內部行政（營運優化、SOP 更新）
週五 ──→ SEO 分析 + 財務週報 + 下週規劃
週六 ──→ 休息（僅緊急客服）
週日 ──→ 10:00 發布內容 + 下週內容最終確認
```

各日詳細執行任務、負責角色和步驟見 [references/weekly-schedule.md](references/weekly-schedule.md)。

## 使用方式

啟動此工作流時，提供：
1. **今天星期幾**：自動定位到該天的任務清單
2. **特殊事項**：本週是否有假日、促銷等

## 注意事項
- 可只執行某一天的任務（例如「執行週五報告」）
- 國定假日或特殊活動期間，排程可能需要調整
- 所有產出統一歸檔至對應部門的目錄
- 角色任務被延誤時，在 Telegram 通知 Eric
