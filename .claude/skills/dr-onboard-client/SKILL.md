---
name: dr-onboard-client
description: "Use this workflow to run the new client onboarding process — from consultation form submission to service delivery. Orchestrates DR-CS, DR-Trainer, DR-Finance, and Eric. Examples:\n\n<example>\nContext: New client submitted a consultation form.\nuser: \"有新客戶填了諮詢表單，幫我啟動入職流程\"\nassistant: \"我來使用新客入職工作流，從建立客戶紀錄開始\"\n<commentary>\nNew client onboarding requires coordinating multiple roles. Use this workflow for the full intake process.\n</commentary>\n</example>\n\n<example>\nContext: Need to process a new inquiry.\nuser: \"這位客戶的狗狗有嚴重吠叫問題，幫我走完諮詢流程\"\nassistant: \"我來啟動新客入職流程，從課前研究評估開始\"\n<commentary>\nClient intake with specific behavior issues triggers the full onboarding pipeline.\n</commentary>\n</example>"
model: opus
color: yellow
---

# DR-Onboard-Client — 新客戶入職工作流

## 工作流概述

此工作流處理從客戶填寫諮詢表單到正式開始服務的完整流程。確保每位新客戶都獲得一致的高品質入職體驗。

## 流程圖

```
Tally 表單 (狗狗行為諮詢前問卷)
  ↓ 客戶提交表單
DR-CS (建立 Notion 客戶紀錄、分類詢問)
  ↓ 交付：客戶基本資料 + 問題分類
DR-Trainer (Stage 1: 課前研究與評估報告)
  ↓ 交付：評估報告 + 建議方案
DR-CS (LINE OA 跟進、安排諮詢時段)
  ↓ 交付：諮詢時間確認
DR-Trainer (Stage 3: 30 分鐘線上諮詢準備)
  ↓ 交付：諮詢大綱 + 課程方案建議
DR-Finance (報價單生成)
  ↓ 交付：正式報價單
Eric (審核報價)
  ↓ 核准或調整
DR-CS (發送報價、追蹤付款)
  ↓ 交付：付款確認
開始服務 ✅
```

## 執行步驟

### Step 1：客戶紀錄建立
**觸發條件**：客戶填寫 [Tally 諮詢表單](https://tally.so/r/KY55Bg)
**負責角色**：DR-CS（`/dr-cs`）

執行內容：
1. 從 Tally 表單擷取客戶資訊
2. 在 Notion 客戶 DB 建立新紀錄
3. 分類客戶問題類型：
   - 吠叫問題
   - 分離焦慮
   - 牽繩暴衝
   - 攻擊行為
   - 基礎服從
   - 幼犬教養
   - 其他
4. 標記緊急程度（一般 / 急需協助）
5. 將案件轉派給 DR-Trainer

**交付物**：
- Notion 客戶紀錄（含基本資料、狗狗資料、問題描述）
- 問題分類標籤

---

### Step 2：課前研究與評估
**負責角色**：DR-Trainer（`/dr-trainer`）

執行內容：
1. 閱讀客戶諮詢表單內容
2. 進行 Deep Research（問題行為的可能原因、相關學術資料）
3. 產出課前評估報告：
   - 狗狗基本資料彙整
   - 行為問題初步分析
   - 可能的訓練方向
   - 建議的服務方案（1對1到府 / 線上 / 社群）
4. 提供 2-3 個方案選項（含預估堂數、費用範圍）

**交付物**：
- 課前評估報告
- 服務方案建議（2-3 選項）

---

### Step 3：客戶聯繫與諮詢安排
**負責角色**：DR-CS（`/dr-cs`）

執行內容：
1. 透過 LINE OA 聯繫客戶
2. 簡要說明評估結果與建議方案
3. 確認客戶意願（想了解更多 / 直接報價 / 暫不考慮）
4. 如客戶有意願，安排 30 分鐘線上諮詢時段
5. 發送諮詢會議連結與準備事項

**交付物**：
- 客戶回覆紀錄
- 諮詢時段確認

---

### Step 4：線上諮詢準備
**負責角色**：DR-Trainer（`/dr-trainer`）

執行內容：
1. 準備 30 分鐘線上諮詢大綱：
   - 開場（5 分鐘）：自我介紹、確認狗狗基本狀況
   - 問題釐清（10 分鐘）：深入了解行為問題細節
   - 方案說明（10 分鐘）：提出訓練計畫與預期時程
   - Q&A（5 分鐘）：回答客戶疑問
2. 準備課程大綱（6-8 週訓練計畫概要）
3. 列出需要在諮詢中確認的問題清單

**交付物**：
- 諮詢大綱
- 課程方案簡報
- 確認問題清單

---

### Step 5：報價生成
**負責角色**：DR-Finance（`/dr-finance`）

執行內容：
1. 根據 DR-Trainer 建議的服務方案計算費用
2. 生成正式報價單：
   - 服務項目明細
   - 費用計算（堂數 × 單價 + 交通費）
   - 付款方式（轉帳 / 信用卡）
   - 報價有效期限（14 天）
3. 如適用，提供早鳥/套裝優惠

**交付物**：
- 正式報價單

---

### Step 6：Eric 審核
**負責人**：Eric

審核項目：
- [ ] 課前評估報告內容正確
- [ ] 服務方案適合客戶需求
- [ ] 報價金額合理
- [ ] 時程安排可行

**動作**：核准 → 進入 Step 7 / 調整 → 回到對應角色修改

---

### Step 7：報價發送與付款追蹤
**負責角色**：DR-CS（`/dr-cs`）

執行內容：
1. 透過 LINE OA 發送報價單
2. 說明付款方式與流程
3. 追蹤付款狀態：
   - 第 3 天：禮貌詢問是否有疑問
   - 第 7 天：溫馨提醒報價效期
   - 第 14 天：報價到期提醒 + 詢問意願
4. 收到付款 → 更新 Notion 客戶狀態 → 通知 DR-Trainer 安排課程

**交付物**：
- 付款確認
- Notion 狀態更新
- 課程安排啟動

## 使用方式

啟動此工作流時，請提供：
1. **客戶資訊**：姓名、聯繫方式（或 Tally 表單連結）
2. **狗狗資訊**：品種、年齡、問題描述
3. **緊急程度**：一般 / 急需

工作流會依序執行每個步驟，每個階段完成後呈現交付物供確認。

## 注意事項
- 從表單收件到首次聯繫，目標在 24 小時內完成
- 從首次聯繫到安排諮詢，目標在 3 個工作天內完成
- 所有客戶個資處理須遵循 DR-Tech-Security 的安全規範
- 客戶互動紀錄統一存入 Notion 客戶 DB
- 報價單標記為機密文件
