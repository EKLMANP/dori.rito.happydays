---
description: DR-SEO 關鍵字流量研究工作流程 — 針對指定主題執行 SEO/AEO/GEO 關鍵字分析並更新 Notion
---

# DR-SEO 關鍵字流量研究

當使用者以 `/dr-seo` 呼叫或要求針對特定主題進行關鍵字研究時，依照以下步驟執行：

## 角色啟動

以 **DR-SEO** 身份執行（SEO/AEO/GEO 專家），遵循 `04-TEAM/prompts/dr-seo.md` 的品牌語調與專業定位。

## 步驟一：研究準備

1. 確認研究主題（中英文）
2. 讀取參考框架：`02-MARKETING/seo-reports/` 目錄下最近的報告作為格式參考
3. 參考 Notion 上的 Leash Pulling SEO 報告框架（7 段式）

## 步驟二：網路研究

使用 `search_web` 工具執行以下 3-4 次搜尋：
// turbo-all
1. `[主題中文] 訓練 台灣 SEO 搜尋趨勢 關鍵字`
2. `[主題英文] training keywords search volume SEO Taiwan`
3. `[主題中文] 原因 怎麼辦 如何處理 台灣 飼主常見問題`
4. `[主題中文] [相關情境關鍵字] 訓練方法 台灣`（依主題調整）

## 步驟三：撰寫報告

按照以下 **7 段式框架** 撰寫報告，儲存至 `02-MARKETING/seo-reports/YYYY-WXX-[topic]-keyword-analysis.md`：

### 報告框架

```
# [中文主題] / [英文主題] — SEO 關鍵字研究

## 研究摘要 (Research Summary)
- 研究日期、目標市場（台灣）、品牌定位、分析工具

## 一、核心關鍵字 (Primary Keywords)
- 中文核心關鍵字（表格：關鍵字、搜尋意圖、搜尋量/競爭度、備註）
- 英文核心關鍵字（表格：關鍵字、搜尋意圖、應用場景）

## 二、長尾關鍵字 (Long-tail Keywords)
- 問題型關鍵字（分類列表 + 月搜尋量）
- 情境型關鍵字（低競爭機會表格）

## 三、相關語意關鍵字 (LSI / Semantic Keywords)
- 行為學與專業名詞（中英對照）
- 訓練用語（中英對照）
- 同義詞/近義詞（表格）

## 四、競爭分析 (Competition Analysis)
- 主要競爭者（表格：類型、代表、突破點）
- 低競爭機會關鍵字
- 競爭激烈暫緩攻佔

## 五、AEO (Answer Engine Optimization) 關鍵字
- 適合 AI 摘要的問題格式（定義型、原因型、步驟型、比較型）
- Featured Snippet 攻佔策略

## 六、內容矩陣建議 (Content Matrix)
- 旗艦文章 (Pillar Content)（表格）
- 叢集文章 (Cluster Content)（表格）
- Meta Description 範例

## 七、執行策略建議 (Strategy)
- 差異化定位
- 三階段執行優先順序
- 與現有內容的串聯
```

## 步驟四：更新 Notion 資料庫

完成報告後，**必須**更新 Notion「部落格文章關鍵字研究」Database：

- **Database URL**: https://www.notion.so/30f17e11503d80d9a050e364110d8e8d?v=30f17e11503d80049d4a000cbce8e996
- **操作方式**：使用 `browser_subagent` 工具
  1. 開啟 Database URL
  2. 點擊 `+ New page` 新增項目
  3. 設定 **主題** (Title)：`[中文主題] / [英文主題] — SEO 關鍵字研究`
  4. 設定 **Date**：研究日期
  5. 在頁面內文貼上完整報告內容

## 步驟五：通知使用者

使用 `notify_user` 工具回報：
- 報告完成位置（本地 `.md` 檔案路徑）
- Notion 更新狀態
- 報告重點亮點（3-5 項）

## 交付成果

| 項目 | 說明 |
|------|------|
| 本地報告 | `02-MARKETING/seo-reports/YYYY-WXX-[topic]-keyword-analysis.md` |
| Notion 頁面 | 部落格文章關鍵字研究 Database 新增一筆 |
| 報告內容 | 7 段式完整關鍵字分析（含核心、長尾、語意、競爭、AEO、內容矩陣、策略） |
