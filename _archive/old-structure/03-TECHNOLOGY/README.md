# 技術與自動化部門

## 概述

這個部門負責開發和維護各種自動化工具和系統集成，提升業務效率，減少人工重複性工作。

## 🤖 自動化工具 (automation/)

### 自動提醒工具 (auto-reminder/)

**用途**：自動發送一對一訓犬服務的提醒通知

**技術**：Google Apps Script

**功能**：
- 根據 Notion 資料庫中的課程安排自動發送提醒
- 在課程前一天提醒客戶
- 發送課前準備事項
- 追蹤提醒狀態

**主要文件**：
- `code.gs` - Google Apps Script 代碼

**部署方式**：
1. 打開 Google Apps Script 編輯器
2. 複製 `code.gs` 的內容
3. 配置觸發器（每日執行）
4. 連接 Notion API 和通訊工具（Email/Telegram）

### AR 映射工具 (ar-mapping-tool/)

**用途**：自動化應收帳款對帳流程

**技術**：Google Apps Script

**功能**：
- 從 Notion 獲取應收帳款資料
- 與實際收款記錄比對
- 自動標記已收款項目
- 生成對帳報告
- 提醒逾期帳款

**主要文件**：
- `code.gs` - Google Apps Script 代碼

**部署方式**：
1. 打開 Google Apps Script 編輯器
2. 複製 `code.gs` 的內容
3. 配置觸發器（每週執行）
4. 連接 Notion API 和 Google Sheets

## 🔗 系統集成 (integrations/)

### 整合的系統

**Notion**：
- 用途：中央資料庫，管理客戶、課程、內容等
- API 版本：2022-06-28
- 主要資料庫：客戶資料、課程安排、內容庫存、財務記錄

**Telegram Bot**：
- 用途：與團隊和客戶溝通的主要渠道
- 功能：報價請求、內容創作請求、通知推送

**Google Drive**：
- 用途：文件存儲和分享
- 功能：自動上傳報價單、課程資料、客戶文件

**Google Apps Script**：
- 用途：Google Workspace 自動化
- 功能：提醒通知、對帳、資料同步

### 集成架構

```
┌─────────────┐
│   Notion    │ ◄─── 中央資料庫
│  Database   │
└──────┬──────┘
       │
       ├────► Telegram Bot ────► 客戶/團隊
       │
       ├────► Google Drive ───► 文件存儲
       │
       └────► Google Apps Script ► 自動化任務
```

### API 密鑰管理

所有 API 密鑰和敏感配置存放在：
- 開發環境：`.config/.env`
- 生產環境：Railway / Google Apps Script 屬性

**安全注意事項**：
- 永遠不要將 `.env` 提交到 Git
- 使用 `.env.template` 作為模板
- 定期輪換 API 密鑰
- 為不同環境使用不同的密鑰

詳細的集成說明請參考：`integrations/integrations.md`

## 🛠️ 開發工具

### Python 環境
- Python 3.9+
- 主要套件：`python-telegram-bot`, `notion-client`, `google-api-python-client`
- 依賴管理：`requirements.txt`

### Google Apps Script
- JavaScript (ES5)
- 使用 Google Workspace 服務
- 在線編輯器或 clasp CLI

### 部署平台
- **Railway**：Python 應用（Telegram Bots）
- **Google Apps Script**：自動化腳本
- **Vercel/Netlify**（未來）：網站前端

## 📊 監控與維護

### 日誌記錄
- Python 應用：使用 `logging` 模組
- Google Apps Script：使用 `Logger.log()`
- 錯誤通知：透過 Telegram 發送

### 健康檢查
- Bot 心跳檢測（每小時）
- API 連接狀態監控
- 錯誤率追蹤

### 備份策略
- Notion 資料：每週自動備份
- 程式碼：Git 版本控制
- 配置文件：加密存儲

## 🚀 未來開發計劃

### 短期（1-3個月）
- [ ] 開發客戶自助預約系統
- [ ] 自動化課程反饋收集
- [ ] 整合線上支付系統

### 中期（3-6個月）
- [ ] 開發移動應用（React Native）
- [ ] AI 聊天機器人客服
- [ ] 數據分析儀表板

### 長期（6-12個月）
- [ ] 完整的 CRM 系統
- [ ] 影片課程平台
- [ ] 社群平台開發

## 📚 技術文檔

### API 文檔
- Notion API: https://developers.notion.com/
- Telegram Bot API: https://core.telegram.org/bots/api
- Google Drive API: https://developers.google.com/drive

### 學習資源
- Python Telegram Bot: https://python-telegram-bot.org/
- Google Apps Script: https://developers.google.com/apps-script

## 🆘 故障排除

### 常見問題

**Bot 無回應**：
1. 檢查 Railway 部署狀態
2. 查看日誌確認錯誤
3. 驗證 API Token 是否有效
4. 檢查網絡連接

**Notion API 錯誤**：
1. 確認 API Token 權限
2. 檢查資料庫 ID 是否正確
3. 驗證資料結構是否符合預期

**Google Apps Script 觸發器失效**：
1. 檢查觸發器設置
2. 確認腳本權限
3. 查看執行日誌

---

**技術負責人**：Eric Pan
**最後更新**：2026-02-17
