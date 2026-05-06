# PayPal 海外金流整合 — 完整開發路線圖

> 對應品牌：Dori & Rito Happydays
> 商品：1-on-1 線上指導服務（NT$5,000-30,000）
> 海外占比預估：20-50%
> 與現有 ECPay 並存

---

## 0. TL;DR 路線圖

| 階段 | 範圍 | 預估工時 | 是否可上線 |
|---|---|---|---|
| **P0** 基礎打通 | 後端 + DB + Smart Buttons + 沙盒 E2E | 6-8h | 沙盒可 |
| **P1** 資安強化 | Webhook 驗章 / Idempotency / Secret 管理 / Audit log | 3-4h | ✅ Production |
| **P2** UX / a11y | Loading / Error / Empty / 國際化文案 / 鍵盤操作 | 3h | ✅ |
| **P3** 維運 | 監控告警 / 退款 SOP / 對帳腳本 | 2-3h | ✅ |
| **P4** 進階 | 匯率自動更新 / A/B 測試 / Webhook re-deliver dashboard | 視需求 | optional |

P0 已在前一輪完成。本路線圖**從 P1 開始補齊**，達到生產級水準。

---

## 1. 系統架構

### 1.1 整體流程圖

```
┌──────────────┐                                   ┌──────────────┐
│   Browser    │                                   │   PayPal     │
│  (Next.js)   │                                   │   Servers    │
└──────┬───────┘                                   └──────┬───────┘
       │ ① 選擇付款方式 (PayPal)                          │
       ▼                                                  │
┌─────────────────────────────────────────────┐           │
│  POST /api/booking/create                   │           │
│  ② Server: createPaypalOrder()              │──────────▶│
│     - OAuth token (cached)                  │           │
│     - Orders v2: intent=CAPTURE              │◀──────────│
│  ③ DB: insert pending order                  │  orderId  │
└──────────────┬──────────────────────────────┘           │
               │ orderId / clientId                       │
               ▼                                          │
┌─────────────────────────────────────────────┐           │
│  Client: load PayPal SDK script             │──────────▶│
│  ④ paypal.Buttons({ createOrder, onApprove })│           │
│     使用者完成 PayPal Checkout 彈窗付款      │           │
└──────────────┬──────────────────────────────┘           │
               │ onApprove(data.orderID)                  │
               ▼                                          │
┌─────────────────────────────────────────────┐           │
│  POST /api/booking/paypal-capture           │──────────▶│
│  ⑤ Server: capturePaypalOrder(orderId)      │           │
│  ⑥ DB: atomic claim + run automations        │◀──────────│
│     - Notion CRM                            │  COMPLETED│
│     - Mailgun confirmation                  │           │
│     - Google Calendar / Meet 邀請           │           │
│  ⑦ return { redirectUrl }                   │           │
└──────────────┬──────────────────────────────┘           │
               │ window.location = /booking/confirmation  │
               ▼                                          │
                                                          │
┌─────────────────────────────────────────────┐           │
│  POST /api/booking/paypal-webhook  ◀────────┼───── PAYMENT.CAPTURE.COMPLETED
│  (safety net — runs only if capture-onApprove│           │
│   never reached the server, e.g. tab closed) │           │
│  Idempotent via automation_completed_at     │           │
└─────────────────────────────────────────────┘
```

### 1.2 為什麼有兩個 server endpoint（capture + webhook）

- **`paypal-capture`**：使用者完成 PayPal 彈窗 → 立即觸發 → **走主要流程**（最即時的成功路徑）
- **`paypal-webhook`**：使用者在彈窗關閉後沒回到我們網站、或網路斷線 → PayPal 5 分鐘內補送事件 → **safety net**

兩者**共享同一個冪等鎖**（`automation_completed_at`），不會跑兩次自動化。

### 1.3 模組分層

```
src/
├─ lib/
│  ├─ paypal.js              # SDK wrapper：OAuth、Orders、verify webhook
│  ├─ paypal-pricing.js      # NEW：TWD↔USD 換算、buffer、rate cache
│  ├─ booking-automations.js # 共用：Notion / Email / Calendar / Meet
│  └─ audit-log.js           # NEW：所有金流事件的結構化日誌
│
├─ app/api/booking/
│  ├─ create/route.js        # 分流：ecpay | paypal
│  ├─ paypal-capture/route.js
│  ├─ paypal-webhook/route.js
│  └─ paypal-refund/route.js # NEW：管理者觸發退款
│
└─ components/booking/
   ├─ BookingSummary.js      # Stage A picker + Stage B gateways
   ├─ PaymentMethodPicker.js # NEW：抽出獨立元件，便於測試
   ├─ PaypalButtons.js       # NEW：抽出獨立元件
   └─ PaymentErrorBoundary.js# NEW：金流錯誤統一處理
```

---

## 2. 資安規範（最重要）

### 2.1 PCI 合規邊界

| 項目 | 我們的責任 | PayPal 責任 |
|---|---|---|
| 卡號 / CVV | **永遠不接觸** | ✅ 全部由 PayPal 託管 |
| 卡號傳輸 | iframe / popup 直連 PayPal | ✅ |
| Server logs | 不可記錄任何 PayPal 回傳的卡資料 | — |

> **規則**：我們落入 **PCI-DSS SAQ A**（最低合規層級），因為從不碰卡資料。**確保**：
> - 不在 console.log / Sentry breadcrumb 印出任何 PayPal raw response
> - 退款資料只記 `captureId`、金額、時間，不記其他欄位

### 2.2 Webhook 簽章驗證（強制）

- 每個 webhook 請求**必須**通過 `verify-webhook-signature` API
- `PAYPAL_WEBHOOK_ID` **不可** commit、不可在前端出現
- 驗證失敗 → 直接 400，**絕對不**記錄 event 內容（避免被攻擊者灌假資料污染日誌）

```js
// 已實作於 src/lib/paypal.js#verifyPaypalWebhook
// P1 增強：加入 5 分鐘 transmission_time 視窗檢查，防 replay
```

### 2.3 Idempotency（冪等）— 三層防線

| 層 | 機制 | 防止 |
|---|---|---|
| 1. PayPal API | `PayPal-Request-Id` header 帶 `merchantTradeNo` | 重試導致雙開單 |
| 2. DB row lock | `UPDATE ... WHERE automation_completed_at IS NULL RETURNING ...` | capture + webhook 競態 |
| 3. 業務層 | Notion / Mailgun 操作前 check `notion_order_id` 是否已存在 | 自動化雙跑 |

### 2.4 Race Conditions

**已處理**：capture endpoint 跟 webhook 同時到達 → atomic UPDATE 只有一個會 RETURNING 到 row → 另一個短路

**P1 補強**：
- 在 DB 加 `payment_provider, payment_status` 的複合 partial index 確保查詢在 paid 訂單表上是 O(log n)
- `INSERT ON CONFLICT DO NOTHING` 確保即使 /create 被瘋狂點擊也只建立一筆

### 2.5 CSRF / 認證

- `/paypal-capture` 接受任意人呼叫看似可疑，但因為 `merchantTradeNo` + `paypalOrderId` 必須**雙比對成功**才會 capture，攻擊者無法用別人的 orderId 觸發，**安全**
- P1 補強：在 `/create` 回傳 capture 用的 short-lived signed token（HMAC `merchantTradeNo`），capture 時帶回；增加一層保險

### 2.6 Rate Limit

| 端點 | 上限 | 已有 |
|---|---|---|
| /api/booking/create | 5 / 10min / IP | ✅ |
| /api/booking/paypal-capture | 10 / 10min / IP | ✅ |
| /api/booking/paypal-webhook | **不可** rate limit（PayPal 是固定 IP，rate limit 反而會丟事件） | ✅ |

### 2.7 Secret 管理

| Secret | 存放 | 暴露範圍 |
|---|---|---|
| `PAYPAL_CLIENT_SECRET` | Vercel env (server only) | server runtime only |
| `PAYPAL_WEBHOOK_ID` | Vercel env (server only) | server runtime only |
| `PAYPAL_CLIENT_ID` | Vercel env (server) | server only |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Vercel env | **公開**（同 client_id 但走 NEXT_PUBLIC 前綴給前端 SDK） |
| `PAYPAL_TWD_TO_USD_RATE` | Vercel env | server only |

> **重要**：`PAYPAL_CLIENT_ID` 在 PayPal 安全模型裡本來就是公開的（PCI Anti-pattern 不適用），所以 `NEXT_PUBLIC_*` 暴露 OK。
> **絕對不可**：把 `CLIENT_SECRET` 加 `NEXT_PUBLIC_` 前綴。

### 2.8 PII / 日誌

- 不記 email / 手機 / 姓名到 application log
- audit-log.js 寫到獨立 DB 表（或 Vercel Logs filtered），保留 90 天
- `booking_data.formResponses` 已是 PII，DB 加密 at-rest（Neon 預設有）

### 2.9 Sandbox vs Production 切換

```
PAYPAL_API_BASE=
  https://api-m.sandbox.paypal.com  # dev / preview
  https://api-m.paypal.com          # production
```

Vercel 三環境分別設定：
- **Development**: sandbox + 測試 webhook
- **Preview**: sandbox（給 PR review）
- **Production**: live + 真實 webhook

---

## 3. 後端架構

### 3.1 API 合約（API contract）

#### `POST /api/booking/create`
```ts
Request:
{
  serviceId: string
  slotDate: "YYYY-MM-DD"
  slotTime: "HH:mm"
  formResponses: Record<string, unknown>
  formSections: Section[]
  customerName: string
  email: string
  phone?: string
  dogName?: string
  notionPageId?: string
  paymentProvider: "ecpay" | "paypal"   // ← 新
}

Response 200:
{
  success: true
  merchantTradeNo: string
  price: number             // TWD
  serviceName: string
  paymentProvider: "ecpay" | "paypal"
  // ECPay 路徑
  paymentFormHtml?: string
  // PayPal 路徑
  paypal?: {
    orderId: string
    clientId: string        // public client ID
    currency: "USD" | "TWD"
    value: string           // "499.00"
  }
  bookingData: { customerName, dogName, slotDate, slotTime, serviceName, price }
}

Errors:
  400 缺欄位 / 表單驗證 / 過去時段
  404 服務不存在
  429 rate limit
  500 金流端錯誤（不洩漏細節）
```

#### `POST /api/booking/paypal-capture`
```ts
Request:
{
  paypalOrderId: string
  merchantTradeNo: string
}

Response 200:
{
  success: true
  status: "COMPLETED"
  redirectUrl: "/booking/confirmation?order=..."
}

Errors:
  400 訂單不符 / 狀態異常
  404 訂單不存在
  429 rate limit
  502 PayPal capture 失敗
```

#### `POST /api/booking/paypal-webhook`
```
PayPal 直接 POST，header 帶簽章五件組
Response: 200 ok（一律）— 內部錯誤透過 audit log 追蹤
```

### 3.2 錯誤分類與使用者文案

| 內部錯誤 | HTTP | 使用者看到 |
|---|---|---|
| `INSTRUMENT_DECLINED` | 400 | 「卡片被拒絕，請改用其他卡或聯絡發卡銀行」 |
| `PAYER_ACTION_REQUIRED` | 422 | 「請完成 PayPal 認證後重試」 |
| 一般 PayPal 錯誤 | 502 | 「PayPal 暫時無法處理，請稍後重試或改用 ECPay」 |
| 我方資料庫錯誤 | 500 | 「系統發生錯誤，請聯絡客服（訂單編號：XXX）」 |
| 訂單已 paid | 200 | 直接走 redirectUrl（避免重複扣款焦慮） |

### 3.3 觀測性（observability）

- **Audit log 表**（新增）：
  ```sql
  CREATE TABLE payment_audit_log (
    id BIGSERIAL PRIMARY KEY,
    merchant_trade_no TEXT,
    event TEXT,           -- created|approved|captured|failed|refunded|webhook_received
    provider TEXT,        -- ecpay|paypal
    status TEXT,
    amount INTEGER,
    currency TEXT,
    metadata JSONB,       -- {paypalOrderId, captureId, errorCode}
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX ON payment_audit_log (merchant_trade_no, created_at);
  ```

- **Telegram 告警**（已部分有）：
  - 每筆失敗 capture
  - Webhook 簽章驗證失敗
  - 24h 內未完成 paypal_order（catch fall-through）

- **Vercel Logs filter**：
  ```
  [paypal-capture]   → 主流程
  [paypal-webhook]   → 安全網
  [paypal-audit]     → 結構化 audit
  ```

### 3.4 退款流程（P3）

新增 `/api/admin/booking/[id]/refund`（需登入）：
```
POST { reason: string, amount?: number }  // 部分退款可選
→ POST https://api-m.paypal.com/v2/payments/captures/{captureId}/refund
→ DB: payment_status='refunded', order_status='cancelled'
→ Notion 同步、寄退款通知信、Calendar 取消
```

---

## 4. 前端架構

### 4.1 元件樹

```
BookingPage (Suspense + Wizard)
└─ BookingSummary
   ├─ OrderSummaryCard
   ├─ PaymentMethodPicker          ← Stage A
   │   ├─ EcpayButton
   │   └─ PaypalButton
   ├─ EcpaySubmitter (existing)    ← Stage B-ECPay
   └─ PaypalCheckout               ← Stage B-PayPal
       ├─ PaypalSdkLoader (script tag manager)
       ├─ PaypalSmartButtons (paypal.Buttons render)
       ├─ PaypalCaptureSpinner
       └─ PaypalErrorBanner
```

> P2：將 PayPal 部分抽成 `PaypalCheckout` 獨立元件（`components/booking/PaypalCheckout.js`），便於 unit test、之後可在 Repay 流程重用。

### 4.2 狀態機（state machine）

```
idle
  └─ user picks provider ──▶ creating_order
                              ├─ success ──▶ ready (provider=ecpay|paypal)
                              └─ error   ──▶ error (重試或換 provider)

ready (ecpay)
  └─ click submit ──▶ redirected_to_ecpay (window navigates away)

ready (paypal)
  └─ user clicks PayPal Smart Button
      └─ PayPal popup 完成 ──▶ capturing
                                ├─ success ──▶ redirected_to_confirmation
                                └─ error   ──▶ capture_failed
                                                ├─ 重試 capture
                                                └─ 改選 ECPay
```

明確狀態避免「按了又按」、「已付款但還可再按」之類 bug。**P2 用 useReducer 實作**。

### 4.3 SDK 載入策略

- **Lazy load**：只在 `Stage B-PayPal` 進入後才注入 `<script>` 標籤（不要 preload，避免每個 booking 都載 SDK）
- **單例 cache**：用 `data-paypal-sdk={clientId}` 標記 script，避免重複注入
- **Failure recovery**：onerror 顯示「無法載入 PayPal，請改用 ECPay」並提供「返回」按鈕
- **CSP**：`script-src https://www.paypal.com`、`frame-src https://www.paypal.com`

### 4.4 SSR vs CSR

- 結帳元件 100% client-side（`'use client'`）— PayPal SDK 是 window-bound
- 但 `/api/booking/create` 必須是 server action / route handler，**不可**從 client 直連 PayPal Orders API（會洩 secret）

---

## 5. UX / a11y 設計

### 5.1 流程設計（Step 3 完整流）

```
┌────────────────────────────────────┐
│ 預約摘要                            │
│ 服務：突破成長方案                  │
│ 日期：2026-05-12                   │
│ 時間：14:00                        │
│ 客戶：王小明                        │
│ 狗狗：球球                         │
│ ──────────────────────────────     │
│ 金額：NT$ 15,000                   │
└────────────────────────────────────┘

請選擇付款方式 ▼

┌──────────────────────────────────┐
│ 🇹🇼 台灣信用卡 / ATM / 超商         │  ← orange brand button
│ 由 ECPay 綠界處理                 │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ 🌍 Pay with PayPal               │  ← yellow PayPal brand
│ Overseas card / USD $456         │
└──────────────────────────────────┘

ⓘ 海外信用卡請選 PayPal · 國內請選 ECPay

[← 重新選擇時段]
🔒 付款由 ECPay/PayPal 安全處理，本站不儲存任何信用卡資訊
```

選擇 PayPal 後：

```
┌────────────────────────────────────┐
│ 預約摘要 (與上同)                    │
│ 金額：USD $456                     │
└────────────────────────────────────┘

┌──────────────────────────────────┐
│ [PayPal] [Debit or Credit Card]  │  ← PayPal SDK 渲染
└──────────────────────────────────┘

You will be charged USD $456
NT$ 15,000 ≈ USD $456 (rate 33)

[← 重新選擇付款方式]
```

### 5.2 文案（雙語混排，海外友善）

| 場景 | 中文 | English |
|---|---|---|
| Picker title | 請選擇付款方式 | Choose payment method |
| ECPay button | 台灣信用卡／ATM／超商 | TW Credit Card / ATM / CVS |
| PayPal button | Pay with PayPal (海外信用卡) | Pay with PayPal (overseas card) |
| Capturing | 付款處理中，請勿關閉視窗 | Processing payment, please don't close this window |
| Success | 付款成功！正在發送預約確認信... | Payment successful! Sending confirmation... |
| Decline | 卡片被拒絕，請改用其他卡 | Card declined — please try a different card |
| Network err | 連線中斷，已為您保留訂單，請重試 | Connection lost. Order is reserved — please retry |

### 5.3 可訪問性（a11y）

- 所有按鈕 `role="button"` + `aria-label`
- Loading 狀態用 `aria-busy="true"`、`aria-live="polite"` 通知 screen reader
- PayPal Buttons 是 iframe，PayPal 自身已過 a11y；我們的 wrapper 加 `aria-label="PayPal payment options"`
- 鍵盤導航：Tab order = ECPay → PayPal → 返回；Esc 不關閉付款 popup（避免誤觸）
- 顏色對比：PayPal 黃 `#ffc439` + 文字 `#003087` 過 WCAG AA

### 5.4 錯誤狀態 UI

| 狀態 | 顯示 | Action |
|---|---|---|
| SDK 載入中 | Skeleton + spinner | — |
| SDK 載入失敗 | 紅色 banner + 「改用 ECPay」 | 自動切回 picker |
| Capture 失敗 | 紅色 banner | 「重試」+「改用 ECPay」雙 CTA |
| 已付款但跳轉失敗 | 綠色 banner「付款已成功」+ 「查看訂單」 | redirect retry |
| 使用者取消 PayPal 視窗 | 維持原狀，無報錯 | 可重按 |

### 5.5 行動裝置

- PayPal Smart Buttons 自動 responsive
- 我方 picker 按鈕 `min-height: 56px` 達 mobile tap target ≥ 44pt
- iOS Safari 注意：popup blocker → 確保「PayPal click」是真實 user gesture handler 內呼叫，**不要**用 setTimeout 包裹

### 5.6 國際化（i18n）— P4 視需要

目前 booking page 是中文為主，海外使用者已能閱讀英文按鈕。
未來若海外營收 >30% → 加 `next-intl` 完整 i18n，依 `Accept-Language` 切換 UI 語言。

---

## 6. 測試策略

### 6.1 測試金字塔

```
        ┌──────────────┐
        │  E2E (5)     │  Playwright 跑沙盒下單 happy/error
        └──────┬───────┘
   ┌───────────▼────────────┐
   │  Integration (15-20)   │  API route + DB + mock PayPal
   └───────────┬────────────┘
┌──────────────▼─────────────┐
│  Unit (40+)                │  paypal.js / pricing / verify
└────────────────────────────┘
```

### 6.2 必測 case

**Unit**:
- `convertTwdToPaypalAmount`：USD 進位、TWD 不動、未支援幣別 throw
- `verifyPaypalWebhook`：帶錯誤簽章 → false
- OAuth token cache：未過期 → 不重打 API

**Integration（mock PayPal）**:
- /create 帶 `paymentProvider=paypal` → DB 有 paypal_order_id
- /paypal-capture happy path → automation_completed_at 寫入
- /paypal-capture 重複呼叫 → 第二次回 success 但不再跑 automation
- /paypal-webhook 簽章錯誤 → 400，DB 無變動
- /paypal-webhook 在 capture 之前到達 → 完成自動化；capture 後到達 → no-op
- merchantTradeNo + paypalOrderId 不符 → 400
- 付款金額被竄改（client 改 amount）→ server 重新從 DB 抓 service.price 計算 ✅

**E2E（Playwright + PayPal sandbox）**:
1. Happy path：完整下單 → confirmation 頁顯示正確 → 信箱收到信
2. 拒絕卡：使用 PayPal 沙盒拒絕卡號 → 看到友善錯誤
3. 取消：PayPal popup 關閉 → 維持原 picker 狀態
4. 切換 provider：選 PayPal → 改選 ECPay → 確認 ECPay 下單成功
5. 重複提交：快速雙擊 → 只建立一筆訂單

### 6.3 PayPal Sandbox playbook

```bash
# 1. 在 https://developer.paypal.com 建 sandbox app
# 2. 取得 sandbox client_id / secret
# 3. 建 sandbox webhook，URL = https://<vercel-preview>.vercel.app/api/booking/paypal-webhook
#    訂閱：PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED, CHECKOUT.ORDER.APPROVED
# 4. PayPal 提供 sandbox 買家帳號（personal）+ sandbox 信用卡測試卡
#    成功卡：4032035728288280  (Visa)
#    拒絕卡：4000020000000000  (auto-decline)
# 5. 跑 webhook simulator：dashboard → webhooks → simulate event
```

---

## 7. 部署 / Rollout

### 7.1 環境變數矩陣

| 變數 | Dev | Preview | Production |
|---|---|---|---|
| PAYPAL_API_BASE | sandbox | sandbox | live |
| PAYPAL_CLIENT_ID | dev_app | dev_app | live_app |
| PAYPAL_CLIENT_SECRET | dev_secret | dev_secret | **live_secret** |
| PAYPAL_WEBHOOK_ID | dev_wh | dev_wh | live_wh |
| NEXT_PUBLIC_PAYPAL_CLIENT_ID | dev_app | dev_app | live_app |
| PAYPAL_CURRENCY | USD | USD | USD |
| PAYPAL_TWD_TO_USD_RATE | 33 | 33 | 32.5 (動態調) |

### 7.2 階段式上線

1. **Day 1**: 部到 Preview，沙盒 E2E 全綠
2. **Day 2-3**: 部到 Production，**用 feature flag `ENABLE_PAYPAL=false` 隱藏入口**
3. **Day 4**: 內部用真卡刷 USD $1 → 立即退款，驗證 live key
4. **Day 5**: 開啟 `ENABLE_PAYPAL=true`，**僅針對特定 query string**（`?paypal=1`）顯示，先 soft launch
5. **Day 7**: 全部使用者顯示
6. **Day 14**: 觀察 7 天無事故 → 移除 feature flag

### 7.3 Rollback plan

- Vercel `ENABLE_PAYPAL=false` 即關閉入口（30 秒生效）
- 既有 paypal_order 已建立但未 capture → PayPal 自動 3 天後過期，無金流影響
- 已 capture 的訂單 → 不影響（後續流程已執行）

---

## 8. 維運 SOP

### 8.1 每日對帳

新增 cron `/api/cron/paypal-reconcile`（Vercel Cron 已用過模式）：
```
00:00 daily
1. 抓昨日所有 paypal_capture_id
2. 打 PayPal Reports API 確認金額一致
3. 不一致 → Telegram 告警 + 寫 audit_log
```

### 8.2 退款 SOP

1. 客服在 Notion 訂單頁標記「申請退款」
2. 管理者打 `/api/admin/booking/[id]/refund` 帶原因
3. 系統：PayPal API refund → DB 更新 → 寄退款通知信 → 取消 Calendar 邀請
4. 客戶於 3-5 個工作天於原信用卡帳單看到 refund

### 8.3 月底結帳

PayPal Business → Activity → Export CSV → 提供會計師（獨資商號報所得稅 / 公司營業稅依你的登記類型）

### 8.4 監控指標

| 指標 | 目標 | 告警閾值 |
|---|---|---|
| PayPal 受理率 | >85% | <70% 連續 3 天 |
| Capture P99 latency | <3s | >8s 連續 30 分鐘 |
| Webhook 失敗率 | <1% | >5% |
| 對帳差異 | 0 | 任何差異 |
| 退款率 | <5% | >15% |

---

## 9. 待辦事項（從 P0 已完成基礎接續）

### P1 — 資安強化（建議下一步立即做）
- [ ] `payment_audit_log` 資料表 + migration
- [ ] `src/lib/audit-log.js` 寫入 helper
- [ ] webhook transmission_time replay 視窗檢查（5 分鐘）
- [ ] capture endpoint 加 short-lived signed token
- [ ] 所有 PayPal raw response 從 console.error 改成 audit_log 結構化記錄
- [ ] CSP header 加 PayPal domains

### P2 — UX / a11y
- [ ] 抽 `PaypalCheckout.js` 獨立元件
- [ ] state machine 改 useReducer
- [ ] aria-busy / aria-live 加上
- [ ] error 文案中英對照表落地
- [ ] mobile tap target QA
- [ ] CTA「改用 ECPay」一鍵切回

### P3 — 維運
- [ ] `/api/admin/booking/[id]/refund` 退款 endpoint
- [ ] 退款通知信 template
- [ ] Vercel Cron `/api/cron/paypal-reconcile`
- [ ] Telegram 告警分流（fnacc bot vs cs bot）
- [ ] Sentry / Vercel Speed Insights 接入

### P4 — 進階（依需求）
- [ ] 匯率自動每日更新（exchangerate.host API）
- [ ] A/B 測試：USD vs TWD 計價對轉換率影響
- [ ] Webhook re-deliver 後台
- [ ] 多語系（next-intl）

---

## 10. 風險清單

| 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|
| PayPal 沙盒到 live key 切換錯誤 | 中 | 真錢扣不到 | 部署 checklist + Day 4 真實小額測試 |
| 匯率波動超過 buffer | 高 | 短收 | 每月檢視一次 rate；緊急時手動調 env |
| TW PayPal 帳號跨境限制 | 中 | TW 客戶無法用 PayPal | 已隔離：picker UI 文案明確只給海外 |
| Webhook 漏接 | 低 | 自動化未跑 | capture endpoint 是主流程，webhook 只是 safety net |
| 海外退款爭議 | 中 | PayPal Resolution Center 申訴 | 退款 SOP 速度 ≤ 24h；課程頁明寫退款政策 |
| PayPal 凍結帳戶 | 低 | 資金無法提領 | 維持低退款率、保留服務證明（會議錄影、Calendar log） |
| TWD 計價海外卡轉換失敗 | 中 | 棄單 | 已採 USD 計價避開 |

---

## Appendix A：成本試算（重申方案 B）

```
單價 NT$15,000 × 海外占比 30% × 月 10 單 = 海外月營收 NT$45,000

PayPal 抽成：4.4% × 45,000 + ($0.30 × 4.5 單)
            ≈ NT$1,980 + NT$45
            ≈ NT$2,025
匯費（提領回台灣銀行）：~1.5% × 45,000
            ≈ NT$675

合計：≈ NT$2,700/月（實際費率 6%）
```

VS 未來升級路線（US LLC + Stripe）：約 NT$1,560/月，省 ~NT$1,140/月——但 Stripe 在台灣不直接開放（2026-05-04 查證），需先成立美國 LLC（~USD $200/年 + 4-9 週 EIN 等待），建議海外月單量穩定超過 15 單後再評估。

---

## Appendix B：相關官方文件

- [PayPal Orders v2 API](https://developer.paypal.com/docs/api/orders/v2/)
- [Smart Buttons SDK](https://developer.paypal.com/sdk/js/reference/)
- [Webhook Verification](https://developer.paypal.com/api/rest/webhooks/rest/)
- [Sandbox testing](https://developer.paypal.com/api/rest/sandbox/)
- [Refund a captured payment](https://developer.paypal.com/docs/api/payments/v2/#captures_refund)
