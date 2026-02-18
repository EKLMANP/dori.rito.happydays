# 業務運營部門

## 概述

這個部門管理 Dori & Rito Happydays 的核心業務運營，包括一對一訓犬服務的報價、客戶管理等。

## 一對一訓犬服務

### 報價系統 (quotations/)

**功能**：
- 自動生成專業的 PDF 報價單
- 與 Notion 資料庫集成管理客戶信息
- 透過 Telegram Bot 接收和處理報價請求
- 自動上傳報價單到 Google Drive
- 追蹤報價編號，避免重複

**主要文件**：
- `quotation_generator.py` - 核心報價生成邏輯
- `quotation_bot.py` - Telegram Bot 介面
- `notion_client.py` - Notion API 集成
- `google_drive_client.py` - Google Drive 上傳
- `resources/` - 模板、字體、簽名等資源

**使用方式**：
1. 客戶透過 Telegram 發送報價請求
2. Bot 從 Notion 獲取客戶資料
3. 系統自動生成 PDF 報價單
4. 上傳到 Google Drive 並發送給客戶

**部署**：
- 使用 Railway 部署
- 參考 `railway.toml` 和 `Procfile` 配置
- 需要配置環境變量（見 `.config/.env.template`）

**所需 API Keys**：
- Telegram Bot Token
- Notion API Token
- Google Drive API 認證

詳細的 AI 技能說明請參考：`quotations/quotation-generator-skill.md`

## 未來擴展

計劃加入的功能：
- 課程管理系統
- 客戶進度追蹤
- 自動化發票生成
- 客戶滿意度調查

---

**維護者**：Eric Pan
**最後更新**：2026-02-17
