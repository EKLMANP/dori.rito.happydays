# Dori & Rito — Telegram 遠端指揮中心

讓 Eric & Pennee 在外出時，透過 Telegram 指揮 AI 虛擬團隊執行任務。

## 虛擬團隊指令

| 指令 | 成員 | 擅長 |
|------|------|------|
| `/head [任務]` | 👔 負責人 | 戰略決策、業務評估 |
| `/trainer [任務]` | 🐕 訓犬師 | 訓練課程、行為問題 |
| `/mkt [任務]` | 📣 行銷人員 | 內容文案、社群貼文 |
| `/seo [任務]` | 🔍 SEO 專員 | 關鍵字研究、優化建議 |
| `/cs [任務]` | 💬 客服人員 | 客戶回覆、FAQ |
| `/designer [任務]` | 🎨 設計師 | 視覺設計、品牌建議 |

## 使用範例

```
/mkt 幫我寫一篇關於「狗狗分離焦慮」的 IG 貼文，要有共鳴感
/trainer 設計一套 6 堂的「牽繩暴衝」訓練課程大綱
/cs 客戶問說「狗狗對其他狗很有攻擊性，適合上課嗎？」幫我回覆
/seo 分析「台北訓狗」vs「台北訓犬師」哪個關鍵字更值得做
/head 評估要不要開線上課程，請分析利弊和建議
/designer 設計一個限時優惠貼文需要什麼視覺元素？
```

## 安裝與啟動

### 1. 安裝依賴

```bash
cd 03-TECHNOLOGY/telegram-commander
pip install -r requirements.txt
```

### 2. 設定 .env

編輯 `.env` 檔案，填入你的 Anthropic API Key：

```
TELEGRAM_BOT_TOKEN=（已設定）
TELEGRAM_CHAT_ID=（已設定）
ANTHROPIC_API_KEY=你的 API Key（需要填入）
```

> 取得 API Key：https://console.anthropic.com/

### 3. 啟動 Bot

```bash
python commander_bot.py
```

### 4. 在 Telegram 測試

發送 `/start` 給你的 Bot，就能開始指揮虛擬團隊！

## 安全機制

- **Chat ID 鎖定**：只有授權的 Chat ID（882308403）可以使用
- **.env 不推送**：Token 和 API Key 存在本地，不會上傳 GitHub
- **未授權者**：會收到拒絕訊息

## 架構說明

```
commander_bot.py       ← 主程式（指揮中心）
requirements.txt       ← Python 依賴
.env                   ← 本地環境變數（不推送 Git）
README.md              ← 本說明文件

依賴的資源：
04-TEAM/prompts/       ← AI 角色 Prompt 定義
  dr-head.md
  dr-trainer.md
  dr-mkt.md
  dr-seo.md
  dr-cs.md
  dr-designer.md
```
