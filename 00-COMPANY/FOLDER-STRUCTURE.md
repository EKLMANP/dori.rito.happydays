# Dori & Rito Happydays — 資料夾架構說明

> 最後更新：2026-03-04
> 架構設計：以公司部門組織，7 大部門 + 系統配置

---

## 📁 頂層架構

```
Dori & Rito Happydays (Dog training)/
│
├── 00-COMPANY/                  ← 品牌文件與總覽
├── 01-Training/                 ← 訓練部
├── 02-Marketing/                ← 行銷部
├── 03-Design/                   ← 設計部
├── 04-Customer-Success/         ← 客服部
├── 05-Tech/                     ← 研發部
├── 06-Operations/               ← 行政/人資/法務部
├── 07-Finance/                  ← 財務/會計部
├── .config/                     ← AI 工具配置（隱藏）
└── _archive/                    ← 舊版文件歸檔
```

---

## 🏢 各部門詳細架構

### 00-COMPANY — 品牌文件
品牌知識庫、總覽文件，為所有 AI 工具的品牌背景資料來源。

```
00-COMPANY/
├── CLAUDE.md           ← 品牌知識庫（AI 工具共用正本）
├── README.md           ← 項目總覽
├── DEPLOYMENT.md       ← 部署指南（Tech 相關）
├── QUICK-START.md      ← 快速上手指南
└── README-antigravity.md  ← Antigravity AI 工具說明
```

---

### 01-Training — 訓練部 🐕

所有 1 對 1 訓犬服務、訓練計畫、課程素材。

```
01-Training/
├── README.md
└── 1-on-1-service/
    └── quotations/           ← 報價機器人程式碼 + 生成的報價單 PDF
        ├── quotation_bot.py
        ├── quotation_generator.py
        ├── notion_client.py
        ├── google_drive_client.py
        ├── telegram_client.py
        ├── config.py, requirements.txt, Procfile, railway.toml
        ├── resources/        ← PDF 模板、字體、簽名
        └── Quotation_*.pdf   ← 歷史報價單
```

---

### 02-Marketing — 行銷部 📣

所有行銷內容：IG、部落格、電子報、Email、SEO 報告、外部課程合作。

```
02-Marketing/
├── STYLE_GUIDE.md            ← 品牌文案風格指南
├── content/
│   ├── blogs/                ← 部落格文章（.md）
│   ├── newsletters/          ← 電子報內容（.md）
│   └── email-inventory/      ← 電子郵件素材庫（.md）
├── content-plans/            ← 內容企劃架構（如 barking series）
├── seo-reports/              ← 每週 SEO 報告
├── email-copywriter/         ← Email Bot（Telegram + Notion 整合）
│   ├── email_bot.py
│   ├── notion_client.py
│   ├── telegram_client.py
│   ├── config.py, requirements.txt, Procfile, railway.toml
│   └── dori-rito-copywriter-skill.md
└── scripts/                  ← 行銷自動化腳本（Notion 同步等）
    ├── create_barking_series.py
    └── create-barking-series-notion.sh
```

---

### 03-Design — 設計部 🎨

IG 影片、圖片、品牌素材、AI 圖片生成。

```
03-Design/
├── ig-content/               ← IG 每日訓犬 ideas（待填充）
├── image-generation/         ← AI 圖片批次生成腳本
│   ├── batch_generate.py
│   ├── generate_images.py
│   └── image_results.json
└── videos/                   ← 影片素材
    └── Sniffle mat.mp4
```

---

### 04-Customer-Success — 客服部 💬

客戶體驗內容：購買流程、FAQ、客戶旅程。（目前預留架構，持續建立中）

```
04-Customer-Success/
└── README.md                 ← 預留：購買流程、FAQ、客戶旅程文件
```

---

### 05-Tech — 研發部 💻

網站、自動化工具、Telegram 機器人、系統整合。

```
05-Tech/
├── website/                  ← Next.js 官網（doriritohappydays，部署於 Vercel）
│   ├── src/, public/         ← 前端原始碼
│   ├── package.json
│   └── next.config.mjs
├── automation/
│   ├── auto-reminder/        ← Google Apps Script：訓練師自動提醒
│   └── notion-to-ghost/      ← Notion → Ghost 內容自動發布
├── telegram-commander/       ← Telegram 指揮機器人
│   ├── commander_bot.py
│   └── .env.example
└── integrations/
    └── integrations.md       ← 系統整合文件
```

---

### 06-Operations — 行政/人資/法務部 📋

NDAs、合約、HR 協議、行政流程。（目前預留，持續建立中）

```
06-Operations/
└── README.md                 ← 預留：NDA、合約、HR 文件
```

---

### 07-Finance — 財務/會計部 💰

記帳、應收/應付、財務報告、現金流監控。

```
07-Finance/
└── tools/
    └── ar-mapping-tool/      ← Google Apps Script：應收帳款對帳工具
        └── code.gs
```

---

### .config — AI 工具配置 🤖

Claude Code 和 Antigravity 的配置、AI 角色 Prompts、環境變數模板。

```
.config/
├── .env.template             ← 環境變數範本
├── AI-TOOLS-GUIDE.md         ← AI 工具使用說明
├── prompts/                  ← AI 角色 Prompts（集中管理）
│   ├── dr-head.md            ← 總監（Head）
│   ├── dr-trainer.md         ← 訓練師
│   ├── dr-mkt.md             ← 行銷
│   ├── dr-seo.md             ← SEO
│   ├── dr-cs.md              ← 客服
│   └── dr-designer.md        ← 設計師
└── ai-tools/
    ├── claude/               ← Claude Code 工作流配置
    └── antigravity/          ← Antigravity 工作流配置
```

---

## 📌 重要說明

### AI 工具使用
- **Claude Code** 讀取 `.config/ai-tools/claude/` + `00-COMPANY/CLAUDE.md`
- **Antigravity** 讀取 `.config/ai-tools/antigravity/` + `00-COMPANY/CLAUDE.md`
- **品牌知識庫唯一正本**：`00-COMPANY/CLAUDE.md`，任何品牌資訊修改都在這裡做

### 報價機器人部署
- 程式碼位於 `01-Training/1-on-1-service/quotations/`
- 部署平台：Railway（見 `00-COMPANY/DEPLOYMENT.md`）

### Email Bot 部署
- 程式碼位於 `02-Marketing/email-copywriter/`
- 部署平台：Railway

### 網站部署
- 程式碼位於 `05-Tech/website/`（Next.js 專案名稱：doriritohappydays）
- 部署平台：Vercel

### 財務工具
- `ar-mapping-tool` 在 `07-Finance/tools/` — 應收帳款 Google Apps Script
