# Dori & Rito Happydays — Brand Assets

此資料夾為**給 Claude AI Design / Figma / 其他設計 AI 的品牌餵料包**，集中所有生成設計素材時需要的 reference 檔案。

## 內容清單

```
brand-assets/
├── README.md                   ← 本檔，說明此資料夾用途
├── BRAND-GUIDELINE.md          ← 完整品牌識別指南（權威來源）
├── STYLE_GUIDE.md              ← 部落格／電子報文案語調細則
├── design-tokens.css           ← 色彩 / 字體 / 圓角 / 陰影 CSS 變數
├── logo/
│   └── logo-primary.png        ← 主 Logo（透明背景 PNG）
└── badges/
    ├── catch-ccdt-seal.png     ← CATCH CCDT 認證徽章
    └── kpa-ctp-badge.png       ← KPA CTP 認證徽章
```

## 快速上手

### 1. Claude AI Design（claude.ai/design）
- **Link code from your computer** → 選擇本資料夾（`03-Design/brand-assets/`）
- **Add fonts, logos and assets** → 上傳 `logo/logo-primary.png`、`badges/*.png`
- **Any other notes** → 參考 `BRAND-GUIDELINE.md` 第 11.4 節，貼上核心設計 tokens

### 2. Figma
- 建立 Variables collection，依 `design-tokens.css` 逐一建立色彩與文字樣式
- 匯入 Google Fonts：Noto Sans TC、Dancing Script

### 3. Canva
- Brand Kit → 上傳 logo、貼上 12 色色票、設定 Noto Sans TC 為預設字

## 字體（未打包）

Noto Sans TC 與 Dancing Script 皆為 Google Fonts 免費商用字型，**不隨本資料夾打包**（檔案過大且易過時）：

- Noto Sans TC: https://fonts.google.com/specimen/Noto+Sans+TC
- Dancing Script: https://fonts.google.com/specimen/Dancing+Script

如需離線使用，再自行下載至 `fonts/` 子資料夾即可。

## 版本

- 同步 `BRAND-GUIDELINE.md` v1.0（2026-04-21）
- 若官網 CSS token 變動，**務必**同步更新 `design-tokens.css` 與 `BRAND-GUIDELINE.md` 第 3 節、第 11.4 節

---

*Maintained by Eric Pan · dori.rito.happydays@gmail.com*
