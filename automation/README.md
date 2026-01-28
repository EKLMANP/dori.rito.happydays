# Dori & Rito Email 自動化系統

自動化產生 email 內容、儲存到 Notion、發送 Telegram 通知的完整解決方案。

## 📋 功能概覽

### 流程一：Claude Chat → Notion → Telegram
1. 在 Claude 對話中產生 email 內容
2. 執行腳本將內容發布到 Notion
3. 自動發送 Telegram 通知

### 流程二：Telegram Bot → Claude API → Notion → Telegram
1. 透過 Telegram 傳送主題給 Bot
2. Bot 自動呼叫 Claude API 產生內容
3. 儲存到 Notion 並通知你

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd automation
pip install -r requirements.txt
```

### 2. 設定 API Keys

編輯 `config.py` 或設定環境變數：

```bash
# Notion (已預設)
export NOTION_API_TOKEN="ntn_s64100311657oNxDFii2W8pPs9aLLR3vrbo2PtUnEUgbmw"
export NOTION_DATABASE_ID="2f117e11503d805987beebbe6f2fe216"

# Telegram (已預設)
export TELEGRAM_BOT_TOKEN="8321656314:AAHBb1fCSixexgnUQFK0S4X-Di8nh0fijRM"
export TELEGRAM_CHAT_ID="你的Chat ID"  # 需要取得

# Claude API (Flow 2 必需)
export ANTHROPIC_API_KEY="你的Anthropic API Key"
```

### 3. 取得 Telegram Chat ID

```bash
python telegram_client.py
```

按照指示：
1. 向你的 Bot 發送一條訊息
2. 按 Enter
3. 複製顯示的 Chat ID 到 config.py

---

## 📖 使用說明

### 流程一：從 Claude Chat 發布

#### 方法 A：使用命令行

```bash
# 從檔案讀取內容
python flow1_claude_to_notion.py -s "你對耐心的理解，可能反了" -f email_content.md

# 直接輸入內容
python flow1_claude_to_notion.py -s "主旨" -c "Email 內容..."
```

#### 方法 B：在 Python 中呼叫

```python
from flow1_claude_to_notion import publish_email

result = publish_email(
    subject="你對耐心的理解，可能反了",
    content="""嗨，

上週有個學員跟我說...

祝訓練順利，
Dori & Rito 團隊"""
)

print(result["page_url"])
```

### 流程二：使用 Telegram Bot

#### 啟動 Bot

```bash
python flow2_telegram_bot.py
```

#### 發送請求給 Bot

打開 Telegram，向你的 Bot 發送：

```
主題: 冬天如何讓狗狗在室內消耗精力
格式: nurture_email
CTA: 推廣居家行為課
參考: 嗅聞遊戲、解謎玩具
```

或簡單地只發送主題：

```
狗狗爆衝怎麼辦
```

---

## 🏗️ 檔案結構

```
automation/
├── config.py              # 設定檔（API tokens）
├── notion_client.py       # Notion API 客戶端
├── telegram_client.py     # Telegram API 客戶端
├── flow1_claude_to_notion.py  # 流程一主程式
├── flow2_telegram_bot.py  # 流程二 Bot 服務
├── requirements.txt       # Python 依賴
└── README.md             # 本文件
```

---

## ☁️ 雲端部署（流程二）

流程二需要一個持續運行的服務器。推薦選項：

### Railway (推薦)

1. 建立 Railway 帳號
2. 連接 GitHub repo
3. 設定環境變數
4. 自動部署

### Render

1. 建立 Render 帳號
2. 新增 Background Worker
3. 連接 repo
4. 設定環境變數

### 本地 + Screen (Linux/Mac)

```bash
screen -S dori-bot
python flow2_telegram_bot.py
# Ctrl+A, D 離開 screen
```

---

## 🔧 API 設定說明

### Notion

1. 前往 https://www.notion.so/my-integrations
2. 建立新的 Integration
3. 複製 Token
4. 在 Notion Database 頁面，點擊 ... → Connections → 加入你的 Integration

### Telegram Bot

1. 在 Telegram 搜尋 @BotFather
2. 發送 /newbot
3. 依照指示建立 Bot
4. 複製 Token

### Claude API

1. 前往 https://console.anthropic.com
2. 建立 API Key
3. 複製到 config.py

---

## 💡 使用提示

### Email 主旨建議

- 8-12 個繁體中文字
- 製造好奇心，不用 clickbait
- 避免：「重要通知」、「限時優惠」
- 好的例子：「你對耐心的理解，可能反了」

### 內容結構

1. **開場**：同理心 + 情境
2. **故事/觀察**：Dori、Rito 或學員的經驗
3. **科學原理**：行為學解釋（簡化版）
4. **可行動的建議**：今天就能做的事
5. **軟性推銷**：連結到課程/社群
6. **結尾**：溫暖的祝福

---

## 🐛 疑難排解

### Notion 建立失敗

- 確認 Database ID 正確
- 確認 Integration 已加入 Database
- 檢查 API Token 權限

### Telegram 通知失敗

- 確認 Chat ID 已設定
- 確認你已經先向 Bot 發送過訊息
- 檢查 Bot Token 是否正確

### Claude API 錯誤

- 確認 API Key 有效
- 檢查餘額是否足夠
- 確認模型名稱正確

---

## 📝 版本記錄

- **v1.0** (2026-01)：初始版本
  - 流程一：Claude Chat → Notion → Telegram
  - 流程二：Telegram Bot → Claude API → Notion

---

Made with ❤️ for Dori & Rito
