# AI 工具使用指南

## 概述

本指南說明如何在 Dori & Rito Happydays 項目中同時使用 **Claude Code** 和 **Antigravity**，確保兩個工具能夠和諧協作，不會產生衝突或重工。

## 🎯 設計理念

### 為什麼整合在同一個文件夾？

這個整合文件夾的核心設計理念是：

1. **單一真實來源（Single Source of Truth）**
   - 所有資料都存放在統一的位置
   - 避免多個版本的文件導致混亂
   - 確保所有 AI 工具讀取的是最新資料

2. **清晰的組織架構**
   - 按部門分類（業務、營銷、技術、團隊）
   - 每個部門有清楚的職責範圍
   - 容易找到需要的資料

3. **工具無關性（Tool Agnostic）**
   - 文件結構不依賴特定工具
   - 任何 AI 工具都能理解和使用
   - 未來可以輕鬆添加新工具

4. **版本控制友好**
   - 使用 Git 追蹤所有變更
   - 可以輕鬆回溯歷史
   - 團隊協作不會衝突

## 🔧 Claude Code 使用指南

### Claude Code 的優勢

- **互動式開發**：適合需要多輪對話和反覆修改的任務
- **代碼編寫**：擅長編寫、調試、優化代碼
- **文檔撰寫**：適合創作長篇內容和技術文檔
- **問題解決**：可以討論複雜問題，提供多種解決方案

### 推薦使用場景

1. **代碼開發**
   - 開發新功能
   - 修復 Bug
   - 代碼重構
   - 測試撰寫

2. **內容創作**
   - 撰寫部落格文章
   - 創作電子報內容
   - 編寫技術文檔
   - 設計訓練課程大綱

3. **策略討論**
   - 討論行銷策略
   - 規劃新項目
   - 分析數據和提供見解
   - 問題診斷和解決方案

4. **文件組織**
   - 整理和分類文件
   - 創建和更新 README
   - 建立文檔結構

### 使用最佳實踐

#### 1. 指定工作目錄

在 Claude Code 中開始工作前，確保：
```bash
cd "Dori & Rito Happydays (Dog training)"
```

#### 2. 使用角色 Prompts

明確告訴 Claude 你需要什麼角色的協助：
```
請以 Dori & Rito 訓犬師的角色，幫我設計一個針對分離焦慮的 6 週訓練課程。
參考：04-TEAM/prompts/dr-trainer.md
```

#### 3. 參考品牌知識

讓 Claude 先了解品牌：
```
請先閱讀 00-OVERVIEW/CLAUDE.md 了解品牌背景，
然後幫我撰寫一篇關於「如何建立狗狗自信心」的部落格文章。
```

#### 4. 指定輸出位置

明確告訴 Claude 文件應該存放在哪裡：
```
請創建一個新的部落格文章，存放在：
02-MARKETING/content/blogs/blog-04-building-confidence.md
```

#### 5. 使用 Git 提交

完成工作後，使用 Claude Code 的 Git 整合提交變更：
```
請幫我提交這次的變更：
- 新增了分離焦慮訓練課程文檔
- 更新了課程報價模板
```

### Claude Code 配置

Claude Code 的配置文件存放在：`.config/ai-tools/claude/`

**主要配置文件**：
- `commands/` - 自定義命令
- `settings.local.json` - 本地設置

**不要修改**：這些配置已經優化，除非你知道自己在做什麼。

## 🚀 Antigravity 使用指南

### Antigravity 的優勢

- **自動化流程**：擅長執行重複性任務
- **批量處理**：可以處理大量文件或數據
- **工作流程**：可以設定多步驟自動化流程
- **定時任務**：可以設定排程自動執行

### 推薦使用場景

1. **自動化生成**
   - 批量生成報價單
   - 定時發送提醒通知
   - 自動化對帳流程
   - 批量處理圖片或文件

2. **數據處理**
   - 從 Notion 同步數據
   - 整理和清理數據
   - 生成報表
   - 數據分析

3. **內容發布**
   - 定時發布電子報
   - 自動發送 Telegram 通知
   - 更新社群媒體內容

4. **維護任務**
   - 清理臨時文件
   - 備份重要數據
   - 檢查系統狀態

### 使用最佳實踐

#### 1. 工作流程設置

Antigravity 的工作流程存放在：`.config/ai-tools/antigravity/workflows/`

#### 2. 使用既有工具

優先使用已經開發好的自動化工具：
- `03-TECHNOLOGY/automation/auto-reminder/` - 自動提醒
- `03-TECHNOLOGY/automation/ar-mapping-tool/` - 對帳工具
- `01-BUSINESS/1-on-1-service/quotations/` - 報價生成

#### 3. 輸出位置規範

Antigravity 生成的文件應該放在對應的部門文件夾：
- 報價單 → `01-BUSINESS/1-on-1-service/quotations/*.pdf`
- 生成的內容 → `02-MARKETING/content/email-inventory/`

## 🤝 Claude Code 與 Antigravity 協作

### 工作流程分工

| 任務類型 | Claude Code | Antigravity |
|---------|-------------|-------------|
| 探索性開發 | ✅ 主要 | ❌ 不適合 |
| 代碼編寫 | ✅ 主要 | ⚠️ 簡單腳本 |
| 內容創作 | ✅ 主要 | ⚠️ 模板化內容 |
| 批量處理 | ❌ 不適合 | ✅ 主要 |
| 定時任務 | ❌ 不適合 | ✅ 主要 |
| 數據分析 | ✅ 探索分析 | ✅ 定期報表 |
| 文件組織 | ✅ 主要 | ❌ 不適合 |

### 實際案例

#### 案例 1：開發新的報價生成功能

**階段 1 - 使用 Claude Code**：
1. 討論需求和設計
2. 撰寫代碼
3. 測試和調試
4. 撰寫文檔
5. 提交到 Git

**階段 2 - 部署到 Antigravity**：
1. 將代碼配置為 Antigravity 工作流程
2. 設置觸發條件（Telegram 命令）
3. 測試自動化流程

**階段 3 - 持續維護**：
- 功能調整：使用 Claude Code
- 批量執行：使用 Antigravity

#### 案例 2：創作內容行銷

**階段 1 - 策劃（Claude Code）**：
1. 討論內容主題和策略
2. 制定內容日曆
3. 撰寫第一篇文章作為範例

**階段 2 - 批量創作（兩者配合）**：
- 使用 Claude Code 創作獨特的文章
- 使用 Antigravity 生成基於模板的電子報

**階段 3 - 發布（Antigravity）**：
- 定時發布到各個平台
- 發送通知給訂閱者

#### 案例 3：月度報表生成

**使用 Claude Code**：
- 第一次創建報表模板
- 撰寫數據分析邏輯
- 設計報表格式

**使用 Antigravity**：
- 每月自動執行報表生成
- 自動發送給相關人員

## ⚠️ 避免衝突的原則

### 1. 明確的文件所有權

每個文件應該有明確的「主要維護者」：
- **手動創作的內容**（部落格、文檔）：Claude Code 維護
- **自動生成的內容**（報價單、報表）：Antigravity 生成，但不直接修改

### 2. 不要同時編輯

- ❌ **錯誤**：Claude Code 正在編輯文件時，Antigravity 也修改同一個文件
- ✅ **正確**：明確分工，或者使用 Git 分支

### 3. 使用 Git 版本控制

所有重要的變更都應該提交到 Git：
```bash
# 使用 Claude Code 提交
git add .
git commit -m "Add: 新增分離焦慮訓練課程文檔"
git push

# 或請 Claude Code 幫你
"請幫我提交這次的變更，commit message 是：新增分離焦慮訓練課程文檔"
```

### 4. 命名規範避免衝突

使用清晰的命名規範：
- 加入日期：`2026-02-17-report.md`
- 加入版本號：`quotation-v2.pdf`
- 加入創建者：`eric-draft-article.md`

### 5. 臨時文件分開存放

- Claude Code 的臨時文件 → `_temp/claude/`
- Antigravity 的臨時文件 → `_temp/antigravity/`
- 定期清理臨時文件

## 📋 工作流程檢查清單

### 開始新任務前

- [ ] 確定任務類型（開發、內容創作、自動化？）
- [ ] 選擇合適的工具（Claude Code 或 Antigravity）
- [ ] 確認工作目錄位置
- [ ] 拉取最新的 Git 變更（避免衝突）

### 任務執行中

- [ ] 遵循文件夾組織結構
- [ ] 使用適當的角色 Prompt（如果使用 Claude Code）
- [ ] 保持文件命名規範
- [ ] 定期檢查是否有其他工具在使用同一文件

### 任務完成後

- [ ] 檢查生成的文件是否在正確位置
- [ ] 更新相關的 README 或文檔
- [ ] 提交變更到 Git（包含清晰的 commit message）
- [ ] 測試是否影響其他功能
- [ ] 通知團隊成員（如果是重要變更）

## 🐛 故障排除

### 問題：文件衝突

**症狀**：兩個工具修改了同一個文件，產生衝突

**解決方案**：
1. 使用 `git status` 查看衝突文件
2. 手動或使用工具解決衝突
3. 未來避免同時編輯同一文件

### 問題：找不到配置文件

**症狀**：工具報錯找不到 `.env` 或配置

**解決方案**：
1. 確認是否複製了 `.config/.env.template` 到 `.env`
2. 檢查環境變量是否正確設置
3. 確認工作目錄是否正確

### 問題：生成的文件位置錯誤

**症狀**：文件被創建在錯誤的文件夾

**解決方案**：
1. 移動文件到正確位置
2. 更新工具配置或指令
3. 參考本指南的文件夾結構說明

## 💡 進階技巧

### 技巧 1：使用符號連結（Symlink）

如果某些工具需要特定的文件夾結構，可以使用符號連結：
```bash
ln -s "Dori & Rito Happydays (Dog training)" ~/dori-rito
```

### 技巧 2：環境變量

在 `.config/.env` 中定義常用的路徑：
```bash
PROJECT_ROOT="/path/to/Dori & Rito Happydays (Dog training)"
BUSINESS_DIR="${PROJECT_ROOT}/01-BUSINESS"
MARKETING_DIR="${PROJECT_ROOT}/02-MARKETING"
```

### 技巧 3：Git Hooks

使用 Git Hooks 自動執行檢查：
- Pre-commit：檢查文件命名規範
- Post-commit：自動推送到遠端（可選）

### 技巧 4：自動化備份

設置定期備份重要文件：
```bash
# 每天備份重要文件夾
rsync -av "Dori & Rito Happydays (Dog training)" ~/backups/
```

## 📞 獲取幫助

如果遇到無法解決的問題：

1. **查看文檔**：
   - 本指南（AI-TOOLS-GUIDE.md）
   - 各部門的 README
   - 工具的官方文檔

2. **檢查日誌**：
   - Claude Code 的輸出
   - Antigravity 的執行日誌
   - Git 歷史記錄

3. **詢問 AI**：
   ```
   我在使用 [工具名稱] 時遇到了 [問題描述]，
   項目位於 Dori & Rito Happydays (Dog training) 文件夾，
   請幫我診斷和解決。
   ```

4. **聯絡團隊**：
   - 技術問題：Eric Pan
   - Email: dori.rito.happydays@gmail.com

## 📚 延伸閱讀

- [Claude Code 官方文檔](https://docs.claude.com/)
- [Antigravity 使用指南](https://antigravity.dev/)
- [Git 版本控制入門](https://git-scm.com/book/en/v2)
- [項目組織最佳實踐](https://github.com/topics/project-organization)

---

**版本**：1.0
**最後更新**：2026-02-17
**維護者**：Eric Pan
