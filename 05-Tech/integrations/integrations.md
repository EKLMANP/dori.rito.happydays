# 虛擬團隊 — 外部服務整合指南

## 1. Notion 資料庫

### 客戶管理資料庫
- **名稱**：1-1 Customer database 客戶管理
- **URL**：https://www.notion.so/22a17e11503d80eea2b5ccbe69a16c59
- **Data Source ID**：`22a17e11-503d-803d-b65a-000b6ffcf316`

#### 欄位結構
| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| 客戶姓名 | title | 客戶姓名（主鍵） |
| 狗狗名字 Name of your lovely dog | text | 狗狗名字 |
| Trainer | person | 負責訓犬師 |
| 轉換狀態 | status | Not started → booked call → In progress(1-6/8) → 1st session → Done / Lost |
| 付款狀態 | status | 待付款 → 付款中 → 已付款 / Lost |
| 1st call | date | 首次線上諮詢日期 |
| 1st session | date | 第一堂課日期 |
| 單堂課報價 | text | 報價金額 |
| 購買課堂數 | number | 購買總堂數 |
| 剩餘課堂數 | number | 剩餘堂數 |
| 匯款日期 | date | 客戶匯款日期 |
| 帳號後五碼 | text | 匯款帳號末五碼 |
| 地址 | text | 上課地址 |
| 聯絡手機號碼 Mobile number | text | 手機號碼 |
| 聯絡Email | email | Email |
| Notes | text | 備註 |

---

### 部落格文章關鍵字研究資料庫
- **名稱**：部落格文章關鍵字研究
- **URL**：https://www.notion.so/30f17e11503d80d9a050e364110d8e8d?v=30f17e11503d80049d4a000cbce8e996
- **用途**：DR-SEO 每次完成關鍵字研究後，將報告同步至此 Database

#### 欄位結構
| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| 主題 | title | 研究主題（格式：中文主題 / 英文主題 — SEO 關鍵字研究） |
| Date | date | 研究日期 |

---

### 任務管理資料庫
- **名稱**：Issues / tasks 代辦任務
- **URL**：https://www.notion.so/30a17e11503d80aa8813fac1554d3705
- **Data Source ID**：`30a17e11-503d-8072-8802-000b969b6851`

#### 欄位結構
| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| Topic 主題 | title | 任務主題（主鍵） |
| Description 問題 / 任務說明 | text | 任務詳細說明 |
| 類別 | multi_select | 研發(系統相關) / 財務/會計(收付款相關) / 異業合作 / 行銷 / 客戶成功 / 其他 |
| Assigned To | person | 指派給誰 |
| Priority 優先級 | select | Low / Medium / High |
| Status | status | Not started → In progress → Done |
| Date of issue / 建立日期 | created_time | 自動產生 |
| Date of completion 完成日期 | date | 完成日期 |

---

## 2. Telegram Bot 通知

- **Bot 名稱**：Dori & Rito 虛擬團隊回報
- **Bot Username**：@Dori_Rito_VirtualTeamReport_bot
- **Eric Chat ID**：882308403

### 通知使用方式（透過 curl）
```bash
# 讀取 .env 檔案中的 Token
source .env

# 發送通知
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID_ERIC}" \
  -d "text=你的通知訊息" \
  -d "parse_mode=Markdown"
```

### 通知情境
| 情境 | 發送者 | 格式 |
|------|--------|------|
| 任務待審核 | DR-Head | 📋 *待審核* \n任務：XXX\n負責：DR-XXX |
| 客戶問題進線 | DR-CS | 🔔 *客戶進線* \n客戶：XXX\n類型：XXX\n優先級：XXX |
| 電子報草稿完成 | DR-MKT | 📧 *電子報草稿完成* \n主題：XXX |
| 緊急事項 | 任何角色 | 🚨 *緊急* \n說明：XXX |

---

## 3. Kit (ConvertKit) 電子報

- **帳戶名稱**：Dori & Rito
- **方案**：Free
- **Email**：dori.rito.happydays@gmail.com
- **API 版本**：v3（v4 Token 格式不同，目前使用 v3）

### API 使用方式

#### 查詢所有電子報
```bash
source .env
curl -s "https://api.convertkit.com/v3/broadcasts?api_secret=${KIT_API_SECRET}"
```

#### 建立電子報草稿
```bash
source .env
curl -s "https://api.convertkit.com/v3/broadcasts" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "api_secret": "'${KIT_API_SECRET}'",
    "subject": "電子報標題",
    "content": "<p>HTML 內容</p>",
    "description": "內部描述"
  }'
```

#### 查詢訂閱者
```bash
source .env
curl -s "https://api.convertkit.com/v3/subscribers?api_secret=${KIT_API_SECRET}"
```
