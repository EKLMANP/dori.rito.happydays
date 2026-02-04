# Dori & Rito 自動化部署指南

本專案包含兩個獨立的自動化服務，請在 Railway 上分別建立兩個專案來部署。

---

## 服務 1：報價單自動化 Bot
**功能**：自動生成 PDF 報價單並上傳至 Notion 客戶資料庫。

### Railway 設定
1. **GitHub Repository**: `EKLMANP/dori.rito.happydays`
2. **Root Directory**: `1 on 1 service/quotations`
3. **Variables (環境變數)**:
   - `TELEGRAM_BOT_TOKEN` (報價單 Bot 專用)
   - `TELEGRAM_CHAT_ID`
   - `NOTION_QUOTATION_TOKEN`
   - `NOTION_CUSTOMER_DATABASE_ID`

---

## 服務 2：Email 文案 Bot
**功能**：根據主題自動撰寫 Email 文案並儲存至 Notion。

### Railway 設定
1. **GitHub Repository**: `EKLMANP/dori.rito.happydays`
2. **Root Directory**: `Email copywriter`
3. **Variables (環境變數)**:
   - `TELEGRAM_BOT_TOKEN` (文案 Bot 專用，建議與報價單 Bot 分開，或共用皆可)
   - `TELEGRAM_CHAT_ID`
   - `ANTHROPIC_API_KEY` (Claude API)
   - `NOTION_API_TOKEN` (內容資料庫專用)
   - `NOTION_DATABASE_ID` (內容資料庫 ID)

---

## 常見問題

### 如何取得環境變數？
查看本機的 `.env` 檔案或者是先前的設定記錄。

### 為什麼要分開部署？
分開部署可以讓兩個服務互不影響。如果 Email Bot 需要更新文案邏輯，不會影響報價單 Bot 的穩定運作。且兩者依賴的套件不同 (Email 需要 Anthropic，報價單需要 PDF 工具)。
