# DR-SEO 關鍵字研究工作流程

## 觸發條件
使用者說：`請針對「XXXX」主題進行中文及英文的關鍵字分析`

## 執行步驟

### Step 1：確認主題
- 確認分析主題（中英文）
- 確認與 Dori & Rito 品牌的關聯角度（正向訓練、行為科學）
- 如主題非核心專業領域，提醒使用者並標注

### Step 2：中文關鍵字研究
使用 WebSearch 查詢以下面向：
- Google 搜尋建議（autocomplete）
- People Also Ask（PAA）相關問題
- 台灣寵物論壇 / PTT / Dcard / Facebook 社群熱門討論
- 競品內容分析（Sofydog、PetMily、其他訓犬師部落格）

### Step 3：英文關鍵字研究
使用 WebSearch 查詢：
- 英文犬行為學相關搜尋詞（學術引用、AEO 來源）
- 海外犬行為醫學資源（AVSAB、Karen Pryor Academy）
- 英文關鍵字的月搜尋量推估

### Step 4：產出報告
依照 `seo-report-template.md` 中的三重優化原則，產出完整 SEO 研究報告。

報告結構必須包含以下 8 大段落（參考範本：Notion 頁面 `31017e11503d8149b2a6dcec403b9bc0`「豐富化遊戲 SEO 報告」）：

```
# [YYYY]-W[XX] 專題關鍵字分析報告：[主題中文] [English Topic]
**撰寫人**：DR-SEO
**分析日期**：[YYYY-MM-DD]
**主題**：[主題中文] [English Topic]
**目標市場**：台灣
**品牌定位**：正向訓練、專業科學、KPA 認證
**資料來源**：Google Trends 趨勢研究、競品內容分析、台灣訓犬師文章、海外犬行為醫學資源
---
## 一、研究摘要 (Research Summary)
### 🔥 核心洞察
[3 個核心洞察，說明市場機會和品牌切入點]

## 二、核心關鍵字 (Primary Keywords)
### 中文核心關鍵字（繁體中文，台灣用語）
[表格：關鍵字 | 預估月搜尋量 | 競爭度 | 搜尋意圖 | 建議內容]
### 英文核心關鍵字
[表格：關鍵字 | 預估月搜尋量 | 應用場景]

## 三、長尾關鍵字 (Long-tail Keywords)
### 問題型關鍵字（飼主常問）
[痛點與行為解惑類 + 訓練與資源尋找類]
### 情境型關鍵字（低競爭機會）
[表格：關鍵字 | 預估月搜尋量 | 競爭度]

## 四、相關語意關鍵字 (LSI / Semantic Keywords)
[行為學與專業名詞、工具與產品相關、同義詞/近義詞表格]

## 五、競爭分析
### 主要競爭者
[表格：競爭者類型 | 內容特徵 | Dori & Rito 突破點]
### 低競爭機會關鍵字

## 六、AEO（Answer Engine Optimization）關鍵字
### 適合 AI 摘要的問題格式
[定義型、原因解析型、步驟型、表格型]
### Featured Snippet 攻佔策略

## 七、內容矩陣建議
### 旗艦文章（Pillar Content）
[表格：標題草案 | 核心關鍵字 | 目標受眾 | 預期效益]
### 叢集文章（Cluster Content）— 低競爭優先
[表格：標題草案 | 長尾關鍵字 | 文章類型 | 串連策略]

## 八、執行策略建議
### 差異化定位
### 三階段執行優先順序
[第一階段（立刻執行）、第二階段（擴展）、第三階段（長尾收割）]
```

### Step 5：寫入 Notion
使用 `notion-create-pages` 工具寫入 Notion 資料庫：

```
parent: { data_source_id: "30f17e11-503d-801a-820f-000beadd6413" }
pages: [{
  properties: {
    "主題": "[主題中文] / [English Topic] — 關鍵字研究報告",
    "date:Date:start": "[YYYY-MM-DD]",
    "date:Date:is_datetime": 0,
    "status": "Not started"
  },
  content: "[完整報告 Markdown]"
}]
```

### Step 6：完成通知
告知使用者報告已建立，提供 Notion 頁面連結。
