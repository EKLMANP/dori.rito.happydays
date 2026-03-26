# Ghost 發布工作流程

## 觸發條件
使用者說：`請將這些 Notion 文章發布到 Ghost：[Notion URLs]`

## 適用對象
- **部落格文章**：建立為 Ghost Post（draft）
- **電子報**：建立為 Ghost Post 並標記 newsletter 屬性（透過 Mailgun 發送）

---

## 執行步驟

### Step 1：讀取 Notion 文章
用 `notion-fetch` 讀取使用者指定的 Notion 頁面，擷取：
- 完整文章 Markdown 內容
- 頁面屬性（Category：Blog 或 Email）
- `📋 Ghost 發布資訊` blockquote 區塊

### Step 2：擷取 Ghost Metadata
從文章底部 `📋 Ghost 發布資訊` blockquote 提取：
- **Ghost Title**：文章標題
- **Slug**：英文 URL slug
- **Meta Title**：SEO 標題（60 字內）
- **Meta Description**：SEO 描述（120-155 字）
- **Tags**：標籤（逗號分隔）
- **Featured Image**：Banner 主視覺圖 URL（ImgBB 直連）
- **Status**：固定為 `Draft`

### Step 3：擷取文章正文
- **部落格**：從 Meta 資訊 blockquote 下方到 CTA 結尾段落（不含 `## DR-Designer 視覺設計提案` 區塊和 `## 📋 Ghost 發布資訊` 區塊）
- **電子報**：從 A/B 主旨行下方的 `---` 之後到固定結尾 P.S. 段落（含簽名和 P.S.）

### Step 4：轉換為 Ghost HTML
將 Notion markdown 轉為 Ghost 可接受的 HTML：
- H2/H3 → `<h2>` / `<h3>`
- 粗體 → `<strong>`
- 連結 → `<a href="...">`
- 圖片 → `<img src="ImgBB URL" alt="...">`（使用 ImgBB 公開直連，確保 Ghost 不會斷圖）
- 有序/無序清單 → `<ol>` / `<ul>`
- blockquote → `<blockquote>`
- FAQ 的 Q&A 格式保持結構
- CTA 連結保持不變：`https://tally.so/r/KY55Bg`

### Step 5：呼叫 Ghost Admin API
1. 讀取 `.env.local` 中的環境變數：
   - `GHOST_URL`（`https://cms.doriritohappydays.com`）
   - `GHOST_ADMIN_API_KEY`

2. 產生 JWT Token（參考 `05-Tech/website/scripts/migrate-ghost.js`）：
   ```
   API Key 格式：id:secret（冒號分隔）
   JWT Header：{ alg: 'HS256', typ: 'JWT', kid: id }
   JWT Payload：{ iat: now, exp: now+5min, aud: '/admin/' }
   Secret：從 hex string 轉為 bytes
   ```

3. 建立 Post：
   ```
   POST https://cms.doriritohappydays.com/ghost/api/admin/posts/
   Authorization: Ghost {jwt_token}
   Content-Type: application/json

   {
     "posts": [{
       "title": "[Ghost Title]",
       "slug": "[slug]",
       "html": "[轉換後的 HTML]",
       "status": "draft",
       "feature_image": "[ImgBB Banner URL]",
       "meta_title": "[Meta Title]",
       "meta_description": "[Meta Description]",
       "tags": [{"name": "tag1"}, {"name": "tag2"}]
     }]
   }
   ```

4. **電子報額外設定**：
   - 設定 `newsletter` 屬性，使 Ghost 透過 Mailgun 發送
   - 設定 `email_only: false`（讓文章同時出現在網站和 email）

### Step 6：更新 Notion 狀態
使用 `notion-update-page` 將該頁面的 `status` 更新為 `Under review`。

### Step 7：回報結果
告知使用者：
- Ghost 後台編輯連結：`https://cms.doriritohappydays.com/ghost/#/editor/post/{post_id}`
- 文章狀態：Draft（待 Eric/Pennee 審核後手動發布）
- Notion 狀態已更新為 `Under review`

---

## 注意事項
- 僅處理 Notion 中 `status` 為 `Not started` 或 `Under review` 的文章
- Ghost 發布狀態固定為 `draft`，**永不自動設為 published**
- 批次發布時逐篇處理，每篇完成後回報進度
- 所有圖片必須使用 ImgBB 公開直連 URL，確保 Ghost 預覽和發布時不會斷圖
- Eric 在 Ghost 後台審核通過後，手動將 Draft 改為 Published
