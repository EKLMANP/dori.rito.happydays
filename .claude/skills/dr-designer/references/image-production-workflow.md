# DR-Designer 圖片產製工作流程

## 觸發條件
使用者說：`請針對部落格文章：[Notion URL]、電子報文章：[Notion URL] 產圖`

## 執行步驟

### Step 1：讀取文章
用 `notion-fetch` 讀取使用者指定的 Notion 頁面，擷取：
- 所有 H2 標題（用於段落配圖對應）
- DR-Designer 視覺設計提案區塊（含現成 AI Prompt）
- 文章主題和情境（用於 Prompt 補充）

### Step 2：規劃圖片清單

| 內容類型 | 圖片類型 | 數量 | 尺寸 |
|---------|---------|------|------|
| **部落格** | Header Banner | 1 張 | 1080 x 540px |
| **部落格** | 段落配圖 | 每個 H2（從第 2 個起）各 1 張 | 1080 x 540px |
| **電子報** | Header Banner | 1 張 | 1080 x 540px |

### Step 3：準備 AI Prompt
依照 `references/brand-visual-spec.md` 中的 Prompt 必備元素：
1. **場景描述**：台灣真實生活場景
2. **狗狗描述**：真實混種犬或常見品種、自然狀態
3. **光線描述**：自然光為主
4. **情緒氛圍**：溫暖、安全、專業
5. **否定關鍵字**：`NOT cartoon, NOT illustration, NOT studio lighting, NOT exaggerated`

如果文章已包含 DR-Designer 視覺提案區塊的現成 Prompt，直接使用。

### Step 4：產圖
1. 讀取 `.env` 中的 `GOOGLE_AI_STUDIO_API_KEY`
2. 使用 **Google AI Studio Nano Banana** 模型產圖
3. 每張圖產出後立即進行 Step 5

### Step 5：上傳 ImgBB
1. 讀取 `.env` 中的 `IMGBB_API_KEY`
2. 透過 ImgBB API 上傳圖片至雲端
3. 取得直連公開 URL（格式：`https://i.ibb.co/XXXXX/filename.jpg`）

產圖上傳腳本：
```bash
# 產圖後將 base64 圖片上傳至 ImgBB
curl -s "https://api.imgbb.com/1/upload" \
  -F "key=$(grep IMGBB_API_KEY .env | cut -d= -f2)" \
  -F "image=@/path/to/generated_image.png" \
  -F "name=[圖片命名]" \
  | jq -r '.data.url'
```

### Step 6：插入 Notion
使用 `notion-update-page` 的 `update_content` 指令，將圖片 Markdown 插入對應位置：

**Banner 插入**：找到第一個 `---` 分隔線之後，插入：
```markdown
![圖說](https://i.ibb.co/XXXXX/filename.jpg)
```

**段落配圖插入**：找到對應 H2 標題，在標題下方插入：
```markdown
![對應 H2 標題](https://i.ibb.co/XXXXX/filename.jpg)
```

### Step 7：Ghost 相容性確認
- 確保所有圖片 URL 為 ImgBB 直連公開網址
- 不使用 Notion 內部 S3 簽名 URL（會過期）
- 圖片可直接複製到 Ghost 發布，不會跑版或斷圖

### 圖片命名規範
```
Blog_[系列名]_banner_1080x540
Blog_[系列名]_section1_1080x540
Blog_[系列名]_section2_1080x540
Newsletter_[系列名]_banner_1080x540
```

### 完成交付格式
提交成果時，直接使用 Markdown 插入圖片：
```markdown
![設計圖說明](https://i.ibb.co/網址)
```
確保團隊其他成員可以直接預覽無斷圖。

## 品牌視覺規格
色碼表、設計原則、台灣場景參考清單、參考圖片 → 見 `references/brand-visual-spec.md`
