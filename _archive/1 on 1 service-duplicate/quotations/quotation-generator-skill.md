# Dori & Rito - 報價單自動化生成 Skill

## Skill Overview

此 Skill 用於自動化生成 Dori & Rito 訓犬服務的專業報價單。訓犬師可透過 Telegram Bot 發送結構化指令，系統會自動：
1. 生成 PDF 報價單
2. 上傳至 Notion 客戶頁面
3. 回傳確認訊息

---

## 訓犬師指令範本

### 💡 完整指令格式

```
1-1 訓犬服務報價
客戶姓名：[客戶姓名]
地址：[完整地址]
電話：[電話號碼]
數量：[6 或 8]
單價：[單價金額]
訓犬師：[Eric Pan / Pennee Tan]
```

### 📝 範例（直接複製修改）

```
1-1 訓犬服務報價
客戶姓名：Ethan
地址：基隆市中正區新豐街345號
電話：0976-765432
數量：6
單價：2,800
訓犬師：Eric Pan
```

---

## 欄位說明

| 欄位 | 必填 | 說明 | 範例 |
|------|------|------|------|
| 客戶姓名 | ✅ | 客戶的姓名（將用於搜尋 Notion 客戶頁面） | `Ethan` |
| 地址 | ✅ | 客戶完整地址 | `基隆市中正區新豐街345號` |
| 電話 | ✅ | 客戶聯絡電話 | `0976-765432` |
| 數量 | ✅ | 課程堂數，只能填 `6` 或 `8` | `6` |
| 單價 | ✅ | 每堂課單價（TWD） | `2,800` 或 `2800` |
| 訓犬師 | ✅ | 負責的訓犬師姓名 | `Eric Pan` 或 `Pennee Tan` |

---

## 自動計算規則

### 日期
- **報價日期**：系統產生報價單的當天日期
- **有效日期**：報價日期 + 3 天

### 項目名稱
- 數量 = 6 → `專業訓犬服務(總計6堂課)`
- 數量 = 8 → `專業訓犬服務(總計8堂課)`

### 金額計算
- **總價** = 數量 × 單價
- **小計** = 總價（目前只有一個項目）
- **其他** = 0
- **總計** = 小計 + 其他

### 流水編號
- 格式：`#0000001`、`#0000002`...
- 自動累加，永不跳號
- 儲存於 `quotation_counter.json`

---

## 訓犬師清單

| 訓犬師姓名 | 簽名顯示 |
|-----------|----------|
| Eric Pan | Eric Pan |
| Pennee Tan | Pennee Tan |

> 如需新增訓犬師，請聯繫管理員更新此清單。

---

## 注意事項

1. **數量限制**：目前只支援 6 堂或 8 堂課程
2. **客戶必須存在**：指令中的客戶姓名必須已存在於 Notion「Customer database 客戶管理」中
3. **單價格式**：可以包含逗號（如 `2,800`）或不含（如 `2800`）
4. **電話格式**：可以包含連字號（如 `0976-765432`）或不含

---

## 常見問題

### Q: 報價單沒有上傳到 Notion？
A: 請確認：
- 客戶姓名拼寫與 Notion database 完全一致
- Notion Integration 有存取 Customer database 的權限

### Q: 流水編號跳號了？
A: 請檢查 `automation/quotation_counter.json` 檔案是否被意外修改

### Q: 如何新增訓犬師？
A: 請聯繫管理員更新 `quotation_generator.py` 中的 `TRAINERS` 清單

---

## 技術細節

### 檔案位置
- 報價單 PDF：`1 on 1 service/quotations/`
- 流水編號記錄：`automation/quotation_counter.json`
- 中文字體：`automation/fonts/NotoSansTC-Regular.ttf`

### 依賴服務
- Telegram Bot API
- Notion API
- Python 3.10+
- ReportLab（PDF 生成）

---

**Skill Version**: 1.0  
**Last Updated**: February 2026  
**For**: Dori & Rito Professional Dog Training
