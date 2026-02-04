# Dori & Rito Bot 部署指南

## 選擇一：Render (推薦 - 免費)

### 步驟
1. 前往 [Render.com](https://render.com) 註冊/登入
2. 點選 **New → Web Service**
3. 連接 GitHub repository（需先將 automation 資料夾推送到 GitHub）
4. 設定：
   - **Name**: `dori-rito-bot`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python flow2_telegram_bot.py`
5. 在 **Environment Variables** 新增：
   ```
   NOTION_API_TOKEN=ntn_s64100311657...
   NOTION_DATABASE_ID=2f117e11503d...
   NOTION_QUOTATION_TOKEN=ntn_b64100311657...
   NOTION_CUSTOMER_DATABASE_ID=22a17e11503d...
   TELEGRAM_BOT_TOKEN=8321656314:AAHBb1f...
   TELEGRAM_CHAT_ID=882308403
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
6. 點選 **Create Web Service**

### 注意事項
- Render 免費版會在 15 分鐘無活動後休眠
- 休眠期間不會收到 Telegram 訊息
- 解決方案：使用 [UptimeRobot](https://uptimerobot.com) 每 5 分鐘 ping 一次

---

## 選擇二：Railway (付費 - 但更穩定)

### 步驟
1. 前往 [Railway.app](https://railway.app) 註冊/登入
2. 點選 **New Project → Deploy from GitHub**
3. 選擇包含 automation 資料夾的 repository
4. Railway 會自動偵測 Python 專案
5. 在 **Variables** 分頁新增環境變數（同上）
6. 設定 **Start Command**:
   ```bash
   python flow2_telegram_bot.py
   ```
7. 部署完成！

### 費用
- 每月 $5 免費額度（新帳號可能更多）
- 小型 Bot 通常在免費額度內

---

## Telegram Bot 設定

### 已完成 ✅
- Bot Token: `8321656314:AAHBb1fCSixexgnUQFK0S4X-Di8nh0fijRM`
- Chat ID: `882308403`

### 如需建立新 Bot
1. 在 Telegram 搜尋 `@BotFather`
2. 發送 `/newbot`
3. 依提示設定名稱
4. 取得 Bot Token
5. 與 Bot 對話以取得 Chat ID（或使用 @userinfobot）

---

## 本地測試

```bash
cd /Users/ericpan/dori.rito.happydays/automation
python3 flow2_telegram_bot.py
```

## 檔案結構

```
automation/
├── flow2_telegram_bot.py    ← 主程式入口
├── notion_client.py
├── telegram_client.py
├── config.py
├── requirements.txt
└── .env                     ← 環境變數（不要上傳到 GitHub）
```

> ⚠️ **重要**: 將 `.env` 加入 `.gitignore`，避免洩露 API 金鑰
