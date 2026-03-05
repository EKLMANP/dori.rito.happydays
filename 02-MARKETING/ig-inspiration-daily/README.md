# IG 靈感日報 (IG Inspiration Daily)

Dori & Rito 訓犬品牌的自動化內容靈感系統。每天分析 25 個國際訓犬 IG 帳號，透過 AI 轉化為可執行的內容靈感與變現方案。

## 功能

- **每日靈感日報** — 早上 7:00 自動推送 15 則內容靈感到 Telegram 群組
- **AI 內容分析** — 分析痛點、產出 Reel 腳本、Carousel 架構、電子報/部落格標題
- **待辦任務建立** — 在群組輸入「Eric待辦任務：...」自動建立 Notion 任務
- **系統健康監控** — 晚上 23:00 推送系統運行報告

## 追蹤的IG帳號
1. https://www.instagram.com/dynamitedogtraining
2. https://www.instagram.com/ameliathedogtrainer
3. https://www.instagram.com/theeverydaytrainer
4. https://www.instagram.com/dogtrainingwithlaura
5. https://www.instagram.com/empoweredpuppyprogram
6. https://www.instagram.com/spiritdogtraining
7. https://www.instagram.com/yourdogbehaviorist
8. https://www.instagram.com/thegooddogyorktown
9. https://www.instagram.com/realethansteinberg
10. https://www.instagram.com/listendogtraining
11. https://www.instagram.com/apex_dogtraining
12. https://www.instagram.com/southenddogtraining/
13. https://www.instagram.com/jwdogtraining/
14. https://www.instagram.com/apex_dogtraining/
15. https://www.instagram.com/summit_homestead
16. https://www.instagram.com/hamiltondogtraining
17. https://www.instagram.com/brandk9dogtraining
18. https://www.instagram.com/thepainfreepettrainer
19. https://www.instagram.com/courtneydownesdogtrainer
20. https://www.instagram.com/ayce.and.aria
21. https://www.instagram.com/woof.wander.co
22. https://www.instagram.com/adventurehoundsnc
23. https://www.instagram.com/lizzysonoda.co
24. https://www.instagram.com/waldrupsomaticmethod
25. https://www.instagram.com/teamk9.training

## 技術架構

| 元件 | 服務 | 月費 |
|------|------|------|
| IG 爬取 | Apify 免費方案 | $0 |
| AI 分析 | Claude 3.5 Haiku | ~$0.70 |
| 推播 | Telegram Bot API | $0 |
| 任務管理 | Notion API | $0 |
| 主機 | Railway | $0 (共用) |

## 前置設定

1. 從 @BotFather 建立 Telegram Bot
2. 建立 Telegram 群組並加入 Bot + Eric + Pennee
3. 註冊 Apify 免費帳號 (apify.com)
4. 設定環境變數（參考 `.env.example`）

## 部署

```bash
# 本地測試
pip install -r requirements.txt
cp .env.example .env  # 填入 API keys
python bot.py

# Railway 部署
# 在 Railway 新增 Service，設定環境變數
```

## 指令

| 指令 | 說明 |
|------|------|
| `/start` | 歡迎訊息 |
| `/help` | 使用說明 |
| `/status` | 系統狀態 |
| `/report` | 手動觸發靈感日報 |
| `Eric待辦任務：{描述}` | 建立 Eric 的 Notion 任務 |
| `Pennee待辦任務：{描述}` | 建立 Pennee 的 Notion 任務 |
