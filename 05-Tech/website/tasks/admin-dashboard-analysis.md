# Admin 營運儀表板 — 可行性 / 成本 / 效益分析

> 日期：2026-03-13
> 目標：一進 admin 就能掌握 MKT / Operations / Finance / Tech / CS 營運全貌

---

## 一、現有資源盤點

### 已接通的資料來源

| 來源 | 用途 | 現有 API 權限 | 可拉的數據 |
|------|------|--------------|-----------|
| **Neon PostgreSQL** | 核心訂單/服務 | ✅ 完整讀寫 | 預約數、營收、服務項目、時段、問卷結構 |
| **ECPay 綠界** | 金流 | ⚠️ 僅 webhook 接收 | 付款成功通知（無主動查詢 API） |
| **Google Calendar** | 排程 | ✅ OAuth refresh token | 行事曆事件、忙碌時段、Meet 連結 |
| **Notion CRM** | 客戶管理 | ✅ API key | 客戶資料、付款狀態、問卷回覆 |
| **Mailgun** | 交易信 | ✅ API key | 寄送/開信/點擊/退信統計 |
| **Ghost CMS** | 部落格+電子報 | ✅ Admin API key | 會員數、文章數、電子報發送統計 |
| **Telegram Bot** | 團隊通知 | ✅ Bot token | 發送通知（無歷史查詢價值） |
| **GTM/GA4** | 網站分析 | ⚠️ 僅前端追蹤碼 | 需新建 Service Account 才能 server-side 拉數據 |
| **Instagram** | 社群 | ❌ 未接通 | 需 Business Account + Facebook App Review |

---

## 二、各部門指標規劃 & 可行性

### 🟢 可行性分類說明
- **🟢 綠燈**：現有 API 已接通，改動少，1-2 天可完成
- **🟡 黃燈**：需新建 API 串接或設定，3-5 天可完成
- **🔴 紅燈**：需外部審核流程或重大架構改動，時程不可控

---

### A. 行銷部 (MKT)

| 指標 | 資料來源 | 可行性 | 開發時間 | 說明 |
|------|---------|--------|---------|------|
| 電子報訂閱人數 | Ghost Admin API | 🟢 | 0.5 天 | `GET /members/?limit=1` 取 pagination.total |
| 電子報訂閱成長趨勢 | Ghost Admin API | 🟢 | 0.5 天 | filter `created_at` 做 weekly/monthly grouping |
| 電子報開信率 | Ghost Admin API | 🟡 | 1 天 | 需呼叫非公開的 `/emails/` endpoint，有 breaking change 風險 |
| 交易信寄送成功率 | Mailgun Stats API | 🟢 | 0.5 天 | `GET /v3/{domain}/stats/total` |
| 交易信開信/點擊率 | Mailgun Stats API | 🟢 | 0.5 天 | 同上，含 opened/clicked |
| 部落格文章數 | Ghost Admin API | 🟢 | 0.5 天 | `GET /posts/?limit=1` 取 total |
| 部落格文章瀏覽量 | GA4 Data API | 🟡 | 2 天 | 需建 Service Account + 設定 GA4 Property 權限 |
| 網站流量 (sessions/users) | GA4 Data API | 🟡 | 同上 | 同一次串接 |
| 流量來源分布 | GA4 Data API | 🟡 | 同上 | dimension: sessionDefaultChannelGroup |
| IG 粉絲數 | Instagram Graph API | 🔴 | 5-10天+ | 需 FB App Review，token 60 天過期要自動刷新 |
| IG 貼文互動率 | Instagram Graph API | 🔴 | 同上 | 同一次串接，但 API 版本頻繁更新 |

**MKT 小結：**
- 🟢 電子報 + 交易信指標 → 立即可做，高 ROI
- 🟡 GA4 網站流量 → 需一次性設定，完成後長期受益
- 🔴 IG 數據 → 成本高、維護重、建議暫緩

---

### B. 運營部 (Operations)

| 指標 | 資料來源 | 可行性 | 開發時間 | 說明 |
|------|---------|--------|---------|------|
| 本週/本月預約數 | PostgreSQL | 🟢 | ✅ 已完成 | 現有 Dashboard 已有 |
| 即將到來的預約清單 | PostgreSQL | 🟢 | 0.5 天 | 擴充現有 API，加入未來 7 天預約列表 |
| 預約完成率 | PostgreSQL | 🟢 | 0.5 天 | `processed_at IS NOT NULL` / 全部 orders 比率 |
| 各服務預約佔比 | PostgreSQL | 🟢 | 0.5 天 | GROUP BY serviceName |
| 時段熱度分析 | PostgreSQL | 🟢 | 0.5 天 | GROUP BY slotTime，顯示哪個時段最多人預約 |
| 未來可用時段總覽 | PostgreSQL + GCal | 🟢 | 1 天 | 結合 slot_rules + blocked_dates + GCal 忙碌 |
| 問卷填寫轉預約率 | Notion + PostgreSQL | 🟡 | 1 天 | Notion 問卷提交數 vs PostgreSQL 完成預約數 |
| 平均預約提前天數 | PostgreSQL | 🟢 | 0.5 天 | slotDate - processed_at 計算 |

**Operations 小結：**
- 🟢 幾乎所有指標都在 PostgreSQL 可查，開發快
- 🟡 轉換率需跨 Notion + DB 計算，但不複雜

---

### C. 財務部 (Finance)

| 指標 | 資料來源 | 可行性 | 開發時間 | 說明 |
|------|---------|--------|---------|------|
| 本月營收 | PostgreSQL | 🟢 | ✅ 已完成 | 現有 Dashboard 已有 |
| 營收趨勢 (週/月) | PostgreSQL | 🟢 | 1 天 | 按 slotDate 分群加總 price |
| 各服務營收佔比 | PostgreSQL | 🟢 | 0.5 天 | GROUP BY serviceName SUM(price) |
| 客單價 (平均) | PostgreSQL | 🟢 | 0.5 天 | AVG(price) |
| 未付款訂單追蹤 | PostgreSQL | 🟢 | 0.5 天 | `processed_at IS NULL` 的 pending orders |
| 退款紀錄 | ECPay 後台 | 🔴 | N/A | ECPay 無退款查詢 API，需手動操作 ECPay 後台 |
| 發票管理 | 外部服務 | 🔴 | N/A | 需串接電子發票 API（另一大工程） |

**Finance 小結：**
- 🟢 營收分析全部從 PostgreSQL 可出，成本低
- 🔴 退款和發票超出現有系統範圍，建議維持手動

---

### D. 研發部 (Tech)

| 指標 | 資料來源 | 可行性 | 開發時間 | 說明 |
|------|---------|--------|---------|------|
| 系統正常運行狀態 | 內部 health check | 🟢 | 1 天 | 建 `/api/health` 檢查 DB + 各 API 連線 |
| API 回應時間 | Vercel Analytics | 🟡 | 0.5 天 | Vercel 內建，或自建 middleware 記錄 |
| 最近錯誤紀錄 | PostgreSQL (新表) | 🟡 | 1.5 天 | 建 `error_logs` 表 + 錯誤捕獲 middleware |
| 第三方服務狀態 | 即時 ping | 🟢 | 1 天 | 檢查 Ghost/Notion/Mailgun/GCal 是否可連 |
| DB 資料量監控 | PostgreSQL | 🟢 | 0.5 天 | 各 table row count + 空間用量 |

**Tech 小結：**
- 🟢 健康檢查和服務狀態 → 實用且成本低
- 🟡 錯誤紀錄需新建 table，但長期維運價值高

---

### E. 客戶成功部 (Customer Success)

| 指標 | 資料來源 | 可行性 | 開發時間 | 說明 |
|------|---------|--------|---------|------|
| 總客戶數 | Notion CRM | 🟢 | 0.5 天 | 查詢 `付款狀態=已付款` 的筆數 |
| 新客戶 vs 回頭客 | Notion CRM | 🟡 | 1 天 | 需按 email 分群判斷是否重複預約 |
| 客戶狀態分布 | Notion CRM | 🟢 | 0.5 天 | 按 `付款狀態` group count |
| 諮詢→付款轉換漏斗 | Notion + PostgreSQL | 🟡 | 1.5 天 | 問卷提交數 → 建立訂單數 → 完成付款數 |
| 客戶課程進度追蹤 | Notion CRM (需擴充) | 🟡 | 2 天 | 需在 Notion DB 加「課程進度」欄位 |
| 客戶滿意度/回饋 | 無 | 🔴 | N/A | 需建新的回饋機制（課後問卷、NPS 等） |
| 回購率 | PostgreSQL | 🟡 | 1 天 | 同 email 多次 processed_orders |

**CS 小結：**
- 🟢 客戶基本指標從 Notion CRM 可拉
- 🟡 漏斗和回購分析需跨來源計算，中等複雜度
- 🔴 滿意度目前無資料來源，需另建機制

---

## 三、成本分析

### 開發成本（依 Phase 分）

| Phase | 範圍 | 預估工時 | 包含指標數 | 新 API 串接 |
|-------|------|---------|-----------|------------|
| **Phase 1** | 🟢 全部綠燈指標 | **3-4 天** | ~20 個 | 0（全用現有資料） |
| **Phase 2** | 🟡 黃燈指標（不含 GA4） | **3-4 天** | ~8 個 | Mailgun Stats, Ghost Admin 擴充 |
| **Phase 3** | 🟡 GA4 串接 | **2-3 天** | ~5 個 | Google Analytics Data API |
| **Phase 4** | 🔴 Instagram | **5-10 天+** | ~3 個 | Instagram Graph API + FB App Review |

### 維護成本

| 項目 | 頻率 | 時間 |
|------|------|------|
| Ghost API 非公開 endpoint 監控 | Ghost 升級時 | 每次 0.5 天 |
| Instagram token refresh | 每 60 天 | 自動化後 0 |
| GA4 Service Account | 一次性設定 | 0（設定後免維護） |
| Notion API 版本更新 | 年度 | 每次 0.5 天 |

### 金錢成本

| 項目 | 費用 |
|------|------|
| Mailgun Stats API | **$0**（現有方案已含） |
| Ghost Admin API | **$0**（自架 Ghost 已含） |
| Notion API | **$0**（現有方案已含） |
| GA4 Data API | **$0**（Google 免費） |
| Instagram Graph API | **$0**（免費），但需 Facebook 開發者帳號 |
| 額外伺服器/DB 費用 | **$0**（數據量極小，Neon free tier 足夠） |
| **總金錢成本** | **$0** |

---

## 四、效益分析

### 量化效益

| 效益 | 現狀（無儀表板） | 有儀表板後 | 節省 |
|------|----------------|-----------|------|
| 查看營收 | 登入 ECPay 後台 + 人工加總 | 打開 admin 即見 | **5-10 分/天** |
| 檢查預約 | 查 Google Calendar + DB | admin 一覽 | **5-10 分/天** |
| 電子報表現 | 登入 Ghost + Mailgun 各查 | admin 統一看 | **10 分/週** |
| 客戶 CRM 狀態 | 開 Notion 手動數 | admin 自動統計 | **15 分/週** |
| 網站流量 | 開 GA4 後台 | admin 摘要 | **10 分/週** |
| 系統健康檢查 | 出問題才知道 | 主動監控 | **避免停機損失** |

**每週節省約 1-2 小時**跨平台查閱時間，且降低遺漏重要異常的風險。

### 質化效益

1. **決策速度**：營運數據一目了然，不需跨 5+ 平台拼湊
2. **異常預警**：付款失敗、信件退信、系統異常即時可見
3. **成長追蹤**：訂閱成長、營收趨勢、回購率一眼掌握
4. **專業形象**：如未來有投資人/合作夥伴，儀表板即為營運報告基礎
5. **團隊協作**：Pennee 也能直接看數據，減少口頭溝通成本

---

## 五、建議實施路徑

```
Phase 1（3-4 天）🟢 Zero-cost 快速出價值
├── Operations：預約完成率、服務佔比、時段熱度、提前天數
├── Finance：營收趨勢圖、服務營收佔比、客單價、未付款追蹤
├── CS：總客戶數、客戶狀態分布
└── Tech：系統健康檢查（DB + 各 API 連線狀態）

Phase 2（3-4 天）🟡 新串接，高 ROI
├── MKT：電子報訂閱數+成長趨勢（Ghost Admin）
├── MKT：交易信寄送/開信/點擊率（Mailgun Stats）
├── CS：諮詢→付款轉換漏斗
├── CS：回購率分析
└── Tech：錯誤紀錄表 + 第三方服務狀態檢查

Phase 3（2-3 天）🟡 GA4 串接
├── MKT：網站流量（sessions/users/pageviews）
├── MKT：流量來源分布
├── MKT：部落格文章瀏覽排行
└── MKT：預約頁轉換率

Phase 4（視需求）🔴 暫不建議
├── MKT：Instagram 粉絲 & 互動（FB App Review 耗時）
├── Finance：退款自動追蹤（ECPay 無 API）
├── Finance：電子發票（需另一套 API 串接）
└── CS：客戶滿意度 NPS（需建新機制）
```

---

## 六、架構設計建議

### Dashboard 頁面結構

```
/admin
├── Dashboard (首頁總覽)
│   ├── 今日快報（關鍵數字卡片）
│   ├── 營收趨勢圖（週/月切換）
│   └── 最近預約 + 系統警告
│
├── /admin/analytics
│   ├── MKT Tab：電子報、網站流量、部落格
│   ├── Operations Tab：預約分析、時段熱度、轉換率
│   ├── Finance Tab：營收明細、服務佔比、客單價
│   ├── CS Tab：客戶漏斗、回購率、CRM 統計
│   └── Tech Tab：系統狀態、錯誤紀錄、API 監控
│
├── /admin/services（現有）
├── /admin/slots（現有）
├── /admin/forms（現有）
└── /admin/emails（現有）
```

### 技術方案

- **快取策略**：Notion API 慢（3 req/s），所有跨服務指標做 5 分鐘 server-side cache
- **API 結構**：每個 Tab 一個 API endpoint（`/api/admin/analytics/mkt`、`/api/admin/analytics/ops` 等）
- **圖表元件**：使用 Recharts（React 原生、輕量、Next.js SSR 友好）
- **載入體驗**：Skeleton loading + 個別卡片獨立載入（不等全部 API 回來）

---

## 七、決策點（請審核）

### 必須確認：

1. **Phase 順序是否同意？** 建議 1→2→3 逐步上線，Phase 4 暫緩
2. **GA4 Service Account**：需要你在 Google Cloud Console 建立，我提供步驟指南
3. **Ghost Admin API**：電子報開信率使用的是非公開 endpoint，可能在 Ghost 升級後壞掉——是否接受此風險？（替代方案：只顯示 Mailgun 的開信率，較穩定）
4. **Notion CRM 效能**：客戶超過 500 人後查詢會變慢（需分頁），是否接受 5 分鐘快取延遲？
5. **Instagram 串接**：確認要暫緩還是仍想進行？
6. **Dashboard 頁面結構**：首頁總覽 + 分 Tab 詳細頁，還是全部塞在同一頁？

---

*以上為完整分析，請審核後我再進行開發規劃。*
