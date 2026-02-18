# Dori & Rito Happydays - 專業訓犬品牌項目總覽

歡迎來到 Dori & Rito Happydays 專業訓犬品牌的整合工作空間！這個文件夾整合了所有部門的資料，讓你能夠高效地管理和開發各項業務。

## 📋 項目簡介

Dori & Rito Happydays 是一個專業的訓犬服務品牌，致力於提供一對一訓犬服務、內容創作、以及智能化的客戶服務工具。

本項目整合了：
- **Claude Code** 開發環境的資料
- **Antigravity** 使用的自動化工具
- 所有業務部門的文件和工具

## 🗂️ 文件夾結構說明

```
Dori & Rito Happydays (Dog training)/
│
├── 00-OVERVIEW/                    # 📚 項目總覽與文檔
│   ├── README.md                   # 本文件 - 項目總覽
│   ├── README-antigravity.md       # Antigravity 專案說明
│   ├── DEPLOYMENT.md               # 部署指南
│   └── CLAUDE.md                   # Claude 知識庫
│
├── 01-BUSINESS/                    # 💼 業務運營部門
│   └── 1-on-1-service/            # 一對一訓犬服務
│       └── quotations/            # 報價系統
│           ├── quotation_generator.py      # 報價生成器
│           ├── quotation_bot.py            # Telegram Bot
│           ├── notion_client.py            # Notion 集成
│           ├── google_drive_client.py      # Google Drive 集成
│           ├── resources/                  # 資源文件（模板、字體、簽名）
│           └── *.pdf                       # 生成的報價單
│
├── 02-MARKETING/                   # 📣 營銷部門
│   ├── content/                   # 內容創作
│   │   ├── blogs/                # 部落格文章
│   │   ├── newsletters/          # 電子報
│   │   └── email-inventory/      # 郵件庫存（已發布的郵件內容）
│   ├── email-copywriter/         # 郵件文案工具
│   │   ├── email_bot.py          # Telegram Bot
│   │   ├── notion_client.py      # Notion 集成
│   │   └── dori-rito-copywriter-skill.md  # AI 技能說明
│   └── seo-reports/              # SEO 分析報告
│
├── 03-TECHNOLOGY/                  # 🛠️ 技術與自動化部門
│   ├── automation/                # 自動化工具
│   │   ├── auto-reminder/        # 自動提醒工具（Google Apps Script）
│   │   └── ar-mapping-tool/      # AR 映射工具（Google Apps Script）
│   └── integrations/             # 系統集成
│       └── integrations.md       # 集成說明文檔
│
├── 04-TEAM/                        # 👥 團隊協作
│   └── prompts/                  # AI 角色 Prompts
│       ├── dr-head.md            # 負責人角色
│       ├── dr-trainer.md         # 訓犬師角色
│       ├── dr-mkt.md             # 行銷人員角色
│       ├── dr-seo.md             # SEO 專員角色
│       ├── dr-cs.md              # 客服人員角色
│       └── dr-designer.md        # 設計師角色
│
├── .config/                        # ⚙️ 配置文件（隱藏文件夾）
│   ├── .env.template             # 環境變量模板
│   ├── .gitignore               # Git 忽略文件
│   └── ai-tools/                # AI 工具配置
│       ├── claude/              # Claude Code 配置
│       └── antigravity/         # Antigravity 配置
│
└── _archive/                       # 📦 歸檔（舊文件存放處）
```

## 🚀 快速開始

### 對於新成員

1. **閱讀文檔**：
   - 先閱讀本 README.md 了解整體結構
   - 查看 `CLAUDE.md` 了解品牌知識
   - 閱讀 `DEPLOYMENT.md` 了解部署流程

2. **設置環境**：
   - 複製 `.config/.env.template` 到 `.env`
   - 填入你的 API keys 和配置信息

3. **找到你需要的資料**：
   - 業務相關 → `01-BUSINESS/`
   - 內容和行銷 → `02-MARKETING/`
   - 技術工具 → `03-TECHNOLOGY/`
   - 團隊協作 → `04-TEAM/`

### 使用 Claude Code 開發

Claude Code 的配置文件位於：`.config/ai-tools/claude/`

當你使用 Claude Code 時，它會自動讀取這個配置，確保：
- 使用正確的 prompts 和角色定義
- 訪問正確的項目文件
- 遵循品牌的風格和準則

### 使用 Antigravity

Antigravity 的配置文件位於：`.config/ai-tools/antigravity/`

Antigravity 的工作流程和自動化腳本主要用於：
- 自動生成報價單
- 發送提醒通知
- 郵件文案創作

## 🔧 各部門詳細說明

### 01-BUSINESS 業務運營

**一對一訓犬服務報價系統**：
- 自動化報價單生成
- 與 Notion 資料庫集成
- 透過 Telegram Bot 接收請求
- 自動上傳到 Google Drive
- PDF 報價單生成

主要文件：
- `quotation_generator.py` - 核心報價生成邏輯
- `quotation_bot.py` - Telegram Bot 介面
- `quotation-generator-skill.md` - AI 技能說明

### 02-MARKETING 營銷部門

**內容創作**：
- Blogs：部落格文章（訓犬技巧、案例分享）
- Newsletters：每週電子報
- Email Inventory：已發布的郵件內容庫

**郵件文案工具**：
- 使用 AI 協助創作郵件內容
- 與 Notion 集成管理內容
- Telegram Bot 介面操作

**SEO 報告**：
- 每週 SEO 分析報告
- 關鍵字表現追蹤
- 內容優化建議

### 03-TECHNOLOGY 技術與自動化

**自動化工具**：
1. **Auto Reminder**（自動提醒）：
   - Google Apps Script
   - 自動發送一對一服務提醒

2. **AR Mapping Tool**（AR 映射工具）：
   - Google Apps Script
   - 應收帳款自動對帳

**系統集成**：
- Notion API 集成
- Google Drive API 集成
- Telegram Bot API 集成
- 詳見 `integrations.md`

### 04-TEAM 團隊協作

**AI 角色 Prompts**：
每個團隊成員都有對應的 AI 角色定義，幫助 AI 更好地理解不同職位的需求：

- `dr-head.md` - 負責人：全局視角、策略決策
- `dr-trainer.md` - 訓犬師：專業訓犬知識、課程設計
- `dr-mkt.md` - 行銷人員：內容策略、社群經營
- `dr-seo.md` - SEO 專員：關鍵字優化、流量分析
- `dr-cs.md` - 客服人員：客戶溝通、問題解決
- `dr-designer.md` - 設計師：視覺設計、品牌呈現

## 🤖 AI 工具使用指南

### 為什麼整合在同一個文件夾？

這個整合文件夾的設計目的是：

1. **避免衝突**：Claude Code 和 Antigravity 共用同一套文件，確保數據一致性
2. **提高效率**：所有工具都能訪問最新的資料，不需要同步
3. **清晰組織**：按部門分類，快速找到需要的資料
4. **版本控制**：統一的 Git 管理，追蹤所有變更

### Claude Code 使用建議

當你使用 Claude Code 開發時：
- ✅ 讀取 `.config/ai-tools/claude/` 中的配置
- ✅ 參考 `04-TEAM/prompts/` 中的角色定義
- ✅ 查看 `00-OVERVIEW/CLAUDE.md` 了解品牌知識
- ✅ 在對應部門文件夾中創建/修改文件

### Antigravity 使用建議

當你使用 Antigravity 開發時：
- ✅ 使用 `.config/ai-tools/antigravity/` 中的工作流
- ✅ 自動化工具存放在 `03-TECHNOLOGY/automation/`
- ✅ 生成的文件存放在對應業務部門中

### 避免衝突的最佳實踐

1. **明確分工**：
   - Claude Code 主要用於：代碼開發、內容創作、文檔編寫
   - Antigravity 主要用於：自動化流程、批量處理

2. **文件命名規範**：
   - 使用清晰的文件名描述內容
   - 加入日期或版本號（如：`2026-W08-seo-weekly-report.md`）

3. **及時更新文檔**：
   - 修改代碼時更新對應的說明文檔
   - 新增功能時更新 README

4. **使用 Git 版本控制**：
   - 定期提交變更
   - 寫清楚 commit message

## 📚 參考文檔

- **品牌知識庫**：`00-OVERVIEW/CLAUDE.md`
- **部署指南**：`00-OVERVIEW/DEPLOYMENT.md`
- **Antigravity 專案說明**：`00-OVERVIEW/README-antigravity.md`
- **系統集成說明**：`03-TECHNOLOGY/integrations/integrations.md`

## 🆘 需要幫助？

- 查看對應部門的 README 或說明文檔
- 閱讀技能說明文件（`*-skill.md`）
- 參考 `.config/.env.template` 了解需要的配置

## 📞 聯絡方式

- Email: dori.rito.happydays@gmail.com
- 專案負責人：Eric Pan

---

**最後更新**：2026-02-17
**版本**：1.0
**維護者**：Eric Pan
