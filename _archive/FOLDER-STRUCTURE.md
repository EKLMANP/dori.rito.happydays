# Dori & Rito Happydays - 文件夾完整結構

## 📊 視覺化結構圖

```
Dori & Rito Happydays (Dog training)/
│
├── 📚 00-OVERVIEW/                           # 項目總覽與核心文檔
│   ├── README.md                            # ⭐ 主要項目說明（從這裡開始！）
│   ├── QUICK-START.md                       # ⚡ 5分鐘快速開始指南
│   ├── FOLDER-STRUCTURE.md                  # 📋 本文件 - 完整結構說明
│   ├── CLAUDE.md                            # 🧠 品牌知識庫
│   ├── DEPLOYMENT.md                        # 🚀 部署指南
│   └── README-antigravity.md                # 🤖 Antigravity專案說明
│
├── 💼 01-BUSINESS/                           # 業務運營部門
│   ├── README.md                            # 業務部門說明
│   └── 1-on-1-service/                     # 一對一訓犬服務
│       └── quotations/                      # 報價系統
│           ├── quotation_generator.py       # 核心報價生成邏輯
│           ├── quotation_bot.py             # Telegram Bot介面
│           ├── notion_client.py             # Notion API集成
│           ├── google_drive_client.py       # Google Drive上傳
│           ├── telegram_client.py           # Telegram客戶端
│           ├── config.py                    # 配置管理
│           ├── quotation_counter.json       # 報價編號追蹤
│           ├── quotation-generator-skill.md # AI技能說明
│           ├── setup_oauth.py               # OAuth設置
│           ├── requirements.txt             # Python依賴
│           ├── Procfile                     # Railway部署配置
│           ├── railway.toml                 # Railway配置
│           ├── Template Quotation_*.pdf     # 報價模板
│           ├── Quotation_*.pdf              # 生成的報價單
│           └── resources/                   # 資源文件
│               ├── fonts/                   # 字體文件
│               │   ├── DancingScript-Regular.ttf
│               │   ├── NotoSansTC-Regular.ttf
│               │   └── OpenSans-Regular.ttf
│               ├── signature_eric.png       # 簽名圖片
│               └── template.pdf             # PDF模板
│
├── 📣 02-MARKETING/                          # 營銷部門
│   ├── README.md                            # 營銷部門說明
│   ├── content/                             # 內容創作
│   │   ├── blogs/                          # 部落格文章
│   │   │   ├── blog-01-highly-sensitive-dogs.md
│   │   │   ├── blog-02-separation-anxiety.md
│   │   │   └── blog-03-food-guarding.md
│   │   ├── newsletters/                     # 電子報
│   │   │   ├── newsletter-01-calming-signals.md
│   │   │   ├── newsletter-02-separation-anxiety.md
│   │   │   └── newsletter-03-leash-pulling.md
│   │   └── email-inventory/                 # 郵件庫存
│   │       ├── 如何建立毛孩的自信心_Dori_Rito.md
│   │       ├── 狗狗知道指令卻不做_Dori_Rito.md
│   │       ├── 狗狗聲音敏感電子報_Dori_Rito.md
│   │       └── 高敏感狗狗陪伴指南.md
│   ├── email-copywriter/                    # 郵件文案工具
│   │   ├── email_bot.py                    # Telegram Bot
│   │   ├── notion_client.py                # Notion集成
│   │   ├── telegram_client.py              # Telegram客戶端
│   │   ├── config.py                       # 配置文件
│   │   ├── dori-rito-copywriter-skill.md   # AI技能說明
│   │   ├── requirements.txt                # Python依賴
│   │   ├── Procfile                        # Railway部署
│   │   ├── railway.toml                    # Railway配置
│   │   └── 狗狗休息日完全指南_Dori_Rito.pdf
│   └── seo-reports/                         # SEO分析報告
│       └── 2026-W08-seo-weekly-report.md
│
├── 🛠️ 03-TECHNOLOGY/                         # 技術與自動化部門
│   ├── README.md                            # 技術部門說明
│   ├── automation/                          # 自動化工具
│   │   ├── auto-reminder/                  # 自動提醒工具
│   │   │   └── code.gs                     # Google Apps Script
│   │   └── ar-mapping-tool/                # AR映射工具
│   │       └── code.gs                     # Google Apps Script
│   └── integrations/                        # 系統集成
│       └── integrations.md                  # 集成說明文檔
│
├── 👥 04-TEAM/                               # 團隊協作
│   ├── README.md                            # 團隊部門說明
│   └── prompts/                             # AI角色Prompts
│       ├── dr-head.md                      # 負責人角色
│       ├── dr-trainer.md                   # 訓犬師角色
│       ├── dr-mkt.md                       # 行銷人員角色
│       ├── dr-seo.md                       # SEO專員角色
│       ├── dr-cs.md                        # 客服人員角色
│       └── dr-designer.md                  # 設計師角色
│
├── ⚙️ .config/                               # 配置文件夾（隱藏）
│   ├── .env.template                        # ⭐ 環境變量模板
│   ├── .gitignore                          # Git忽略規則
│   ├── AI-TOOLS-GUIDE.md                   # ⭐ AI工具完整使用指南
│   └── ai-tools/                           # AI工具配置
│       ├── claude/                         # Claude Code配置
│       │   └── .claude/
│       │       ├── commands/               # 自定義命令
│       │       │   ├── dr-cs.md
│       │       │   ├── dr-designer.md
│       │       │   ├── dr-head.md
│       │       │   ├── dr-mkt.md
│       │       │   ├── dr-seo.md
│       │       │   ├── dr-seo-weekly.md
│       │       │   └── dr-trainer.md
│       │       └── settings.local.json     # 本地設置
│       └── antigravity/                    # Antigravity配置
│           └── .agent/
│               └── workflows/              # 工作流程
│
└── 📦 _archive/                              # 歸檔文件夾
    └── (舊文件存放處)
```

## 📈 統計數據

### 文件數量統計

```
總計：
- 主要部門：5個（00-OVERVIEW 到 04-TEAM + .config）
- Python腳本：~12個
- Markdown文檔：~25個
- PDF文件：~15個
- 配置文件：~8個
- Google Apps Script：2個
```

### 部門分布

| 部門 | 文件夾數 | 主要功能 |
|------|---------|---------|
| 00-OVERVIEW | 1 | 項目文檔、指南 |
| 01-BUSINESS | 2 | 報價系統、客戶管理 |
| 02-MARKETING | 5 | 內容創作、SEO、郵件工具 |
| 03-TECHNOLOGY | 3 | 自動化工具、系統集成 |
| 04-TEAM | 2 | AI Prompts、協作規範 |
| .config | 3 | AI工具配置、環境變量 |

## 🎯 快速導航

### 我想要...

#### 📖 了解項目
→ `00-OVERVIEW/README.md`（主文檔）
→ `QUICK-START.md`（快速開始）

#### 💼 處理業務
→ `01-BUSINESS/1-on-1-service/quotations/`（報價系統）
→ `01-BUSINESS/README.md`（業務說明）

#### ✍️ 創作內容
→ `02-MARKETING/content/blogs/`（部落格）
→ `02-MARKETING/content/newsletters/`（電子報）
→ `02-MARKETING/content/email-inventory/`（郵件庫存）

#### 📊 查看SEO
→ `02-MARKETING/seo-reports/`（SEO報告）

#### 🤖 開發自動化
→ `03-TECHNOLOGY/automation/`（自動化工具）
→ `03-TECHNOLOGY/integrations/`（系統集成）

#### 👤 使用AI角色
→ `04-TEAM/prompts/`（AI角色定義）

#### ⚙️ 配置工具
→ `.config/.env.template`（環境變量）
→ `.config/AI-TOOLS-GUIDE.md`（工具指南）

## 🔑 關鍵文件說明

### ⭐ 必讀文件（按優先級）

1. **`QUICK-START.md`**
   - 5分鐘快速入門
   - 最基本的操作指南

2. **`00-OVERVIEW/README.md`**
   - 完整項目文檔
   - 所有部門詳細說明

3. **`.config/AI-TOOLS-GUIDE.md`**
   - Claude Code + Antigravity使用指南
   - 避免衝突的最佳實踐

4. **`00-OVERVIEW/CLAUDE.md`**
   - 品牌知識庫
   - 了解品牌定位

5. **各部門的 README.md**
   - 特定部門的詳細說明
   - 工具使用方法

### 🔧 配置文件

| 文件 | 用途 | 位置 |
|-----|------|------|
| `.env.template` | 環境變量模板 | `.config/` |
| `.gitignore` | Git忽略規則 | `.config/` |
| `settings.local.json` | Claude Code設置 | `.config/ai-tools/claude/` |
| `requirements.txt` | Python依賴 | 各工具目錄 |
| `railway.toml` | Railway部署 | 各工具目錄 |

## 🎨 命名規範

### 文件命名

```
部落格：blog-##-topic-name.md
電子報：newsletter-##-topic-name.md
SEO報告：YYYY-W##-seo-weekly-report.md
報價單：Quotation_######_Name_YYYYMMDD.pdf
```

### 文件夾命名

- 使用數字前綴排序（00, 01, 02...）
- 全大寫用於重要文件夾（OVERVIEW, BUSINESS）
- 小寫加連字符用於子文件夾（1-on-1-service）
- 隱藏配置文件夾用點開頭（.config）

## 🔒 安全注意事項

### ⚠️ 不要提交到Git

```
.env                          # 環境變量（包含密鑰）
*.json (API keys)             # API密鑰文件
.DS_Store                     # macOS系統文件
__pycache__/                  # Python緩存
*.pyc                         # Python編譯文件
```

### ✅ 應該提交到Git

```
.env.template                 # 環境變量模板
*.md                          # 所有文檔
*.py                          # Python代碼
*.gs                          # Google Apps Script
requirements.txt              # 依賴列表
```

## 📊 技術棧總覽

### 編程語言
- **Python 3.9+**：主要開發語言
- **JavaScript (ES5)**：Google Apps Script
- **Markdown**：文檔撰寫

### 主要框架與庫
- `python-telegram-bot`：Telegram Bot開發
- `notion-client`：Notion API集成
- `google-api-python-client`：Google Drive API
- `reportlab` / `fpdf`：PDF生成

### 平台與服務
- **Railway**：Python應用部署
- **Google Apps Script**：自動化腳本
- **Notion**：資料庫和知識管理
- **Telegram**：通訊和Bot介面
- **Google Drive**：文件存儲

### 開發工具
- **Claude Code**：AI輔助開發
- **Antigravity**：自動化工作流
- **Git**：版本控制
- **VS Code / Cursor**：代碼編輯器

## 🔄 更新日誌

### 2026-02-17 - v1.0 整合版本

✅ **完成項目**：
- 整合 `dori.rito.happydays` 和 `Dori & Rito` 兩個項目
- 建立清晰的組織架構（00-04部門結構）
- 創建完整的文檔體系
- 配置AI工具兼容性
- 設置Git版本控制

📝 **新增內容**：
- 主README.md（完整項目文檔）
- QUICK-START.md（快速開始指南）
- FOLDER-STRUCTURE.md（本文件）
- AI-TOOLS-GUIDE.md（AI工具使用指南）
- 各部門README.md（4個部門說明）

---

**版本**：1.0
**創建日期**：2026-02-17
**維護者**：Eric Pan
**聯絡**：dori.rito.happydays@gmail.com
