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
週二 ──→ 內容產出日（DR-SEO + DR-MKT 協作）
週三 ──→ 客戶關懷 + 17:00 發布內容
週四 ──→ 內部行政（營運優化、SOP 更新）
週五 ──→ SEO 週報 + 財務週報 + 下週規劃
週六 ──→ 休息（僅緊急客服）
週日 ──→ 10:00 發布內容 + 下週內容最終確認
```

## 各日執行細節

### 週一：週啟動 + 客戶跟進 + 發布
**負責角色**：DR-Ops-Manager + DR-CS

#### DR-Ops-Manager — 週啟動報告
1. 彙整上週營運數據：
   - 新客戶詢問數
   - 成交數與營收
   - 內容觸及/互動數據
   - 客戶回饋摘要
2. 列出本週重點任務
3. 確認本週發布排程（3 篇內容確認就緒）
4. 標記需要 Eric/Pennee 關注的事項

#### DR-CS — 客戶跟進批次
1. 檢查所有進行中客戶的追蹤狀態
2. 1對1客戶：距離上次追蹤超過 3 天的，發送關懷訊息
3. 社群學員：本週學習進度確認
4. 未回覆詢問：第二次跟進提醒

#### 15:00 發布
- 內容類型：電子報 / 部落格（週一主力內容）
- DR-Tech-Dev 執行 Kit API 發送 + 網站發布

---

### 週二：內容產出日
**負責角色**：DR-SEO + DR-MKT + DR-Designer

1. DR-SEO 提供下一週期的關鍵字研究
2. DR-MKT 撰寫下一批次的內容草稿
3. DR-Designer 準備視覺素材
4. 完成的草稿提交 Eric/Pennee 審核

> 💡 如果需要完整的端到端產出流程，使用 `/dr-content-pipeline`

---

### 週三：客戶關懷 + 發布
**負責角色**：DR-CS

#### DR-CS — 週中關懷
1. 社群學員互動確認（回覆問題、鼓勵進度）
2. 新詢問客戶的首次聯繫（24hr 內回覆目標）
3. 付款追蹤（逾期帳款提醒）

#### 17:00 發布
- 內容類型：社群內容（IG 貼文 / 限動）
- 準備好的內容包排程發布

---

### 週四：內部行政日
**負責角色**：DR-Ops-Manager

1. Notion DB 維護與優化
2. SOP 文件更新（如有新流程）
3. 工具整合檢查（API 連線狀態、Bot 運作正常）
4. 與 DR-Tech-Architect/Dev 討論技術改善需求

---

### 週五：報告日
**負責角色**：DR-SEO + DR-Finance + DR-Ops-Manager

#### DR-SEO — 週報（`/dr-seo-weekly`）
1. 執行 SEO 週報自動化工作流
2. 產出：關鍵字排名追蹤、競品動態、下週建議
3. 報告儲存至 `02-MARKETING/seo-reports/`

#### DR-Finance — 週現金流快報
1. 本週收入/支出彙整
2. 應收帳款狀態
3. 下週預期現金流
4. 異常項目標記

#### DR-Ops-Manager — 下週規劃
1. 彙整各部門下週任務
2. 確認下週發布內容就緒
3. 更新 Notion 任務 DB
4. 產出下週規劃簡報給 Eric

---

### 週六：休息日
- 僅處理緊急客服（DR-CS 標記為「緊急」的事項）
- 不發布內容
- 不安排內部任務

---

### 週日：發布 + 下週準備
**負責角色**：DR-Ops-Manager + DR-Tech-Dev

#### 10:00 發布
- 內容類型：教育型長文內容（部落格深度文章）
- 適合週日閱讀的主題（生活化、故事性）

#### 下週內容最終確認
1. 確認週一、週三、週日三篇內容都已審核通過
2. 確認視覺素材已就位
3. 確認 Kit 電子報已排程
4. 如有缺漏，緊急通知相關角色補齊

---

## 使用方式

啟動此工作流時，請提供：
1. **今天星期幾**：系統會自動定位到該天的任務清單
2. **特殊事項**：本週是否有特殊活動、假日、促銷等

工作流會列出當天應執行的任務，並依序協調各角色完成。

## 注意事項
- 此工作流是「營運節奏」的定義，不是每天都需要從頭執行
- 可以只執行某一天的任務（例如「執行週五報告」）
- 國定假日或特殊活動期間，排程可能需要調整
- 所有產出統一歸檔至對應部門的目錄
- 如果某個角色的任務被延誤，在 Telegram 通知 Eric
