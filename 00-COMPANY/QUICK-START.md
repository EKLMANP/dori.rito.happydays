# 快速開始指南

歡迎使用整合後的 **Dori & Rito Happydays (Dog training)** 工作空間！

這個快速開始指南會幫助你在 5 分鐘內開始使用這個整合文件夾。

## 📂 你現在看到的是什麼？

這個文件夾整合了兩個原本分離的項目：
- ✅ `dori.rito.happydays` (Antigravity 使用)
- ✅ `Dori & Rito` (Claude Code 開發使用)

現在它們都在這個統一的文件夾中，按照**公司組織架構**整理好了！

## 🎯 3 步快速開始

### 步驟 1：了解文件夾結構 (1 分鐘)

```
📁 Dori & Rito Happydays (Dog training)/
├── 📚 00-OVERVIEW/        ← 從這裡開始！閱讀 README.md
├── 💼 01-BUSINESS/        ← 業務運營（報價系統）
├── 📣 02-MARKETING/       ← 營銷部門（內容、SEO）
├── 🛠️ 03-TECHNOLOGY/      ← 技術工具（自動化）
├── 👥 04-TEAM/            ← 團隊協作（AI Prompts）
├── ⚙️ .config/            ← 配置文件（AI 工具設置）
└── 📦 _archive/           ← 歸檔文件
```

**記住這個口訣**：按數字順序，從 00 到 04，就像公司的組織架構！

### 步驟 2：閱讀關鍵文檔 (2 分鐘)

依序快速瀏覽這些文件：

1. **`00-OVERVIEW/README.md`** ← 你現在要看的主文檔
   - 完整的文件夾結構說明
   - 各部門詳細介紹

2. **`.config/AI-TOOLS-GUIDE.md`** ← AI 工具使用指南
   - Claude Code 與 Antigravity 如何協作
   - 避免衝突的最佳實踐

3. **`00-OVERVIEW/CLAUDE.md`** ← 品牌知識庫
   - 了解 Dori & Rito 的品牌定位和理念

### 步驟 3：開始工作 (2 分鐘)

根據你的需求，跳轉到對應的部門：

#### 如果你要做業務相關工作：
```bash
cd 01-BUSINESS/1-on-1-service/quotations/
# 閱讀 ../README.md 了解報價系統
```

#### 如果你要做內容創作：
```bash
cd 02-MARKETING/content/
# blogs/ 部落格文章
# newsletters/ 電子報
# email-inventory/ 郵件庫存
```

#### 如果你要開發技術工具：
```bash
cd 03-TECHNOLOGY/
# automation/ 自動化工具
# integrations/ 系統集成
```

#### 如果你要查看團隊角色定義：
```bash
cd 04-TEAM/prompts/
# 查看不同角色的 AI Prompt 定義
```

## 🤖 使用 AI 工具

### 使用 Claude Code

在 Claude Code 中，你可以這樣開始：

```
你好！我現在在 Dori & Rito Happydays (Dog training) 項目中。
請先閱讀 00-OVERVIEW/README.md 和 00-OVERVIEW/CLAUDE.md，
然後以 [角色名稱] 的角色幫我 [任務描述]。
```

**角色選項**：
- 負責人 (dr-head)
- 訓犬師 (dr-trainer)
- 行銷人員 (dr-mkt)
- SEO 專員 (dr-seo)
- 客服人員 (dr-cs)
- 設計師 (dr-designer)

### 使用 Antigravity

Antigravity 會自動使用 `.config/ai-tools/antigravity/` 中的配置。

主要用於：
- 自動生成報價單
- 定時發送提醒
- 批量處理任務

## ⚙️ 設置環境變量（如果需要）

如果你要運行自動化工具：

```bash
# 1. 複製模板
cp .config/.env.template .config/.env

# 2. 編輯 .env 填入你的 API keys
# 使用任何文本編輯器打開 .config/.env
```

需要的 API Keys：
- Telegram Bot Token
- Notion API Token
- Google Drive API 認證

## 📋 常見任務快速指令

### 創作部落格文章

```bash
cd 02-MARKETING/content/blogs/

# 使用 Claude Code 創作
"請以 Dori & Rito 訓犬師的角色，撰寫一篇關於「狗狗焦慮症狀識別」的部落格文章，
存為：blog-04-anxiety-symptoms.md"
```

### 生成報價單

```bash
cd 01-BUSINESS/1-on-1-service/quotations/

# 使用 Telegram Bot 或直接運行
python quotation_bot.py
```

### 更新 SEO 報告

```bash
cd 02-MARKETING/seo-reports/

# 使用 Claude Code 生成
"請以 SEO 專員的角色，分析本週的 SEO 表現，
生成報告：2026-W[週數]-seo-weekly-report.md"
```

## 🔍 找不到東西？

### 按照這個流程尋找：

1. **確定類型**：這是業務、營銷、技術還是團隊相關？
2. **去對應文件夾**：01-BUSINESS, 02-MARKETING, 03-TECHNOLOGY, 04-TEAM
3. **查看 README**：每個部門都有自己的 README.md
4. **搜尋文件**：使用 `grep` 或 IDE 搜尋功能

### 搜尋示例：

```bash
# 在整個項目中搜尋關鍵字
grep -r "報價" .

# 搜尋特定類型的文件
find . -name "*.md" | grep "SEO"

# 使用 Claude Code
"請幫我在項目中搜尋所有關於「分離焦慮」的文件"
```

## ⚠️ 重要提醒

### ✅ 要做的事：

- **始終查看 README**：每個文件夾都有說明
- **使用 Git**：定期提交你的變更
- **遵循命名規範**：參考現有文件的命名方式
- **更新文檔**：修改後更新相關的 README

### ❌ 不要做的事：

- **不要同時用兩個工具編輯同一文件**
- **不要提交 `.env` 文件到 Git**（已在 .gitignore 中）
- **不要隨意移動文件**：保持組織架構
- **不要刪除 README 或配置文件**

## 📚 深入學習

想要更深入了解？依序閱讀：

1. **`00-OVERVIEW/README.md`** - 完整項目文檔
2. **`.config/AI-TOOLS-GUIDE.md`** - AI 工具深度指南
3. **各部門的 README.md** - 特定部門的詳細說明
4. **`00-OVERVIEW/DEPLOYMENT.md`** - 部署相關資訊

## 🆘 需要幫助？

- 📧 Email: dori.rito.happydays@gmail.com
- 👤 項目負責人：Eric Pan

---

## 🎉 就是這樣！

你已經準備好開始使用這個整合工作空間了！

記住：
- **00-04 的數字** = 部門順序
- **每個文件夾都有 README** = 你的指南
- **AI 工具互相配合** = 參考 AI-TOOLS-GUIDE.md

開始工作吧！🚀

---

**最後更新**：2026-02-17
