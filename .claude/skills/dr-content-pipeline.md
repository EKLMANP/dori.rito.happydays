---
name: dr-content-pipeline
description: "Use this workflow to run the complete content production pipeline — from SEO keyword research to final publishing. Orchestrates DR-SEO, DR-MKT, DR-Designer, DR-Ops-Manager, and DR-Tech-Dev in sequence. Examples:\n\n<example>\nContext: Need to produce this week's content.\nuser: \"啟動本週的內容產出流程\"\nassistant: \"我來使用內容產出工作流，從 SEO 研究開始到排程發布\"\n<commentary>\nThe full content pipeline workflow orchestrates multiple roles. Use this for end-to-end content production.\n</commentary>\n</example>\n\n<example>\nContext: Need a blog post on a specific topic.\nuser: \"我需要一篇關於分離焦慮的完整內容（部落格+電子報+IG）\"\nassistant: \"我來啟動完整內容產出流程，從關鍵字研究到視覺設計一條龍完成\"\n<commentary>\nWhen content needs the full treatment (research → write → design → schedule), use this pipeline.\n</commentary>\n</example>"
model: opus
color: cyan
---

# DR-Content-Pipeline — 完整內容產出工作流

## 工作流概述

此工作流串聯 5 個角色，完成從關鍵字研究到內容發布的完整流程。每個階段產出交付物給下一階段，最終由 Eric/Pennee 審核後發布。

## 流程圖

```
DR-SEO (關鍵字研究 + 內容架構)
  ↓ 交付：關鍵字清單 + 文章架構
DR-MKT (撰寫電子報 + 部落格 + IG 草稿)
  ↓ 交付：三種格式的內容草稿
DR-Designer (製作視覺素材)
  ↓ 交付：封面圖 + 內文插圖 Prompt/設計
Eric/Pennee (品質審核 + 核准)
  ↓ 核准或退回修改
DR-Ops-Manager (排程發布)
  ↓ 交付：發布排程確認
DR-Tech-Dev (發布至 Kit API + 網站 CMS)
  ↓ 交付：發布完成確認
Telegram 通知 Eric ✅
```

## 執行步驟

### Step 1：SEO 關鍵字研究與內容架構
**負責角色**：DR-SEO（`/dr-seo`）

執行內容：
1. 使用 WebSearch 搜尋目標主題的最新趨勢（繁中 + 英文）
2. 產出 10-15 個目標關鍵字（含搜尋量預估、競爭度）
3. 規劃 SEO/AEO/GEO 三重優化的文章架構
4. 產出 H1-H3 標題結構 + 建議字數 + FAQ 區塊

**交付物**：
- 關鍵字研究報告
- 文章架構（含標題層級、建議段落）

---

### Step 2：內容撰寫
**負責角色**：DR-MKT（`/dr-mkt`）

執行內容：
1. 接收 DR-SEO 的架構，使用「專業閨蜜」語調撰寫
2. 產出三種格式：
   - **電子報版本**：800-1200 字，CTA 導向諮詢表單
   - **部落格版本**：1500-2500 字，完整 SEO 優化
   - **IG 貼文版本**：Hook + 3-5 張輪播文字 + CTA
3. 每篇內容套用 5 步驟寫作法：痛點 → 同理 → 方案 → 缺口 → CTA
4. 自我檢查清單（台灣用語、品牌語調、CTA、零捏造）

**交付物**：
- 電子報草稿
- 部落格草稿
- IG 貼文草稿

---

### Step 3：視覺設計
**負責角色**：DR-Designer（`/dr-designer`）

執行內容：
1. 根據內容主題設計視覺素材
2. 產出：
   - 電子報 Header 圖（600×200px）
   - 部落格封面圖（1200×630px）
   - IG 輪播封面（1080×1080px）
3. 提供 AI 生圖 Prompt（Midjourney/DALL-E 格式）
4. 確保品牌視覺一致性（暖橘 + 柔藍色調）

**交付物**：
- 視覺素材設計稿 / AI 生圖 Prompt
- Canva 設計連結（如適用）

---

### Step 4：品質審核
**負責人**：Eric / Pennee

審核項目：
- [ ] 內容正確性（訓練知識是否正確）
- [ ] 品牌語調一致性
- [ ] 台灣用語規範
- [ ] CTA 導向正確（諮詢表單連結）
- [ ] 視覺品牌一致性
- [ ] SEO 標題/描述/關鍵字密度

**動作**：核准 → 進入 Step 5 / 退回 → 回到對應角色修改

---

### Step 5：排程與發布
**負責角色**：DR-Ops-Manager + DR-Tech-Dev

DR-Ops-Manager 執行：
1. 確認發布排程（週一 15:00 / 週三 17:00 / 週日 10:00）
2. 更新 Notion 內容排程 DB
3. 通知 DR-Tech-Dev 準備發布

DR-Tech-Dev 執行：
1. 電子報 → Kit API 排程發送
2. 部落格 → 網站 CMS 發布
3. IG → 準備好排程發布的內容包

---

### Step 6：完成通知
透過 Telegram 通知 Eric：
- 發布內容標題
- 發布管道與時間
- 相關連結

## 使用方式

啟動此工作流時，請提供：
1. **主題**：想要產出什麼主題的內容
2. **目標受眾**：新手飼主 / 有經驗飼主 / 特定問題（吠叫、焦慮等）
3. **優先管道**：電子報優先 / 部落格優先 / 全部

工作流會依序執行每個步驟，每個階段完成後呈現交付物供確認，再進入下一階段。

## 注意事項
- 整個流程預估需要 2-3 小時（不含審核等待時間）
- 每個階段可獨立暫停，下次接續執行
- 如果 Eric/Pennee 退回，只需重做被退回的階段
- 所有產出儲存至 `02-MARKETING/` 對應子目錄
