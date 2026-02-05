"""
Dori & Rito - 報價單自動生成器 (Template Overlay Version)
=========================================================
使用原始 PDF 模板作為基底，覆蓋動態內容

使用方式：
    from quotation_generator import QuotationGenerator
    
    generator = QuotationGenerator()
    result = generator.generate({
        'customer_name': 'Ethan',
        'address': '基隆市中正區新豐街345號',
        'phone': '0976-765432',
        'quantity': 6,
        'unit_price': 2800,
        'trainer': 'Eric Pan'
    })
"""

import os
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF

# 設定路徑
QUOTATION_DIR = Path(__file__).parent
TEMPLATE_PATH = QUOTATION_DIR / "resources" / "template.pdf"
COUNTER_PATH = QUOTATION_DIR / "quotation_counter.json"
OUTPUT_DIR = QUOTATION_DIR

# 可用的訓犬師列表
TRAINERS = ["Eric Pan", "Pennee Tan"]

# 公司資訊
COMPANY_INFO = {
    "name": "Dori & Rito.",
    "contact_name": "Eric Pan",
    "address": "台北市大安區安和路一段415號",
    "phone": "+886 986608876",
    "bank_name": "富邦銀行（012）",
    "bank_account": "00674168203218"
}

# 文字位置定義 (從模板分析得出)
# 格式: (x, y, width, height) - y 是從頁面頂部算起
TEXT_POSITIONS = {
    # 報價單編號 - 調整 y 座標對齊 "報價單" 文字 (y:90.5)
    'quotation_id': {'rect': (130.7, 90.5, 231.8, 111.3), 'fontsize': 20.78, 'align': 'left'},
    
    # 日期
    'quote_date': {'rect': (459.6, 205.9, 522.5, 220.7), 'fontsize': 12.0, 'align': 'left'},
    'valid_date': {'rect': (459.6, 222.4, 522.5, 237.2), 'fontsize': 12.0, 'align': 'left'},
    
    # 第一行項目 (6堂課) - 數量位置
    'row1_qty_label': {'rect': (172.0, 341.6, 205.0, 356.5), 'fontsize': 12.0, 'align': 'left'},  # "6" in item name
    'row1_qty': {'rect': (330.1, 341.6, 338.0, 356.5), 'fontsize': 12.0, 'align': 'left'},  # qty column
    'row1_unit': {'rect': (393.6, 341.6, 425.0, 356.5), 'fontsize': 12.0, 'align': 'left'},  # unit price
    'row1_total': {'rect': (466.8, 341.6, 503.0, 356.5), 'fontsize': 12.0, 'align': 'left'},  # total
    
    # 第二行項目 (8堂課) - 數量位置
    'row2_qty_label': {'rect': (172.0, 376.1, 205.0, 391.0), 'fontsize': 12.0, 'align': 'left'},
    'row2_qty': {'rect': (330.1, 376.1, 338.0, 391.0), 'fontsize': 12.0, 'align': 'left'},
    'row2_unit': {'rect': (393.6, 376.1, 425.0, 391.0), 'fontsize': 12.0, 'align': 'left'},
    'row2_total': {'rect': (465.5, 376.1, 504.0, 391.0), 'fontsize': 12.0, 'align': 'left'},
    
    # 小計
    'subtotal': {'rect': (480.2, 469.9, 520.2, 484.8), 'fontsize': 12.0, 'align': 'left'},
    
    # 總計
    'grand_total': {'rect': (446.8, 525.3, 520.2, 540.2), 'fontsize': 12.0, 'align': 'left'},
    
    # 訓犬師簽名
    'trainer_signature': {'rect': (73.0, 664.0, 200.0, 722.3), 'fontsize': 38.86, 'align': 'left'},
}


class QuotationGenerator:
    """報價單生成器 - 使用模板覆蓋方式"""

    def __init__(self):
        self._ensure_template()
        self._ensure_output_dir()

    def _ensure_template(self):
        """確保模板存在"""
        if not TEMPLATE_PATH.exists():
            raise FileNotFoundError(f"找不到模板檔案: {TEMPLATE_PATH}")

    def _ensure_output_dir(self):
        """確保輸出目錄存在"""
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    def _get_next_number(self) -> int:
        """取得下一個流水編號"""
        if COUNTER_PATH.exists():
            with open(COUNTER_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                current = data.get('current_number', 0)
        else:
            current = 0
        
        next_num = current + 1
        
        with open(COUNTER_PATH, 'w', encoding='utf-8') as f:
            json.dump({
                'current_number': next_num,
                'last_updated': datetime.now().strftime('%Y-%m-%d')
            }, f, ensure_ascii=False, indent=2)
        
        return next_num

    def _format_number(self, num: int) -> str:
        """格式化流水編號"""
        return f"#{num:07d}"

    def _format_price(self, price: int) -> str:
        """格式化價格（加入千分位逗號）"""
        return f"{price:,}"

    def _parse_price(self, price_str) -> int:
        """解析價格字串"""
        if isinstance(price_str, int):
            return price_str
        return int(str(price_str).replace(',', '').replace(' ', ''))

    def _redact_and_replace(self, page, rect, new_text, fontsize=12, fontname="helv", color=(0, 0, 0), baseline_offset=3):
        """
        在指定區域清除原有文字並插入新文字
        """
        # 建立 redaction annotation 來清除區域
        redact_rect = fitz.Rect(rect)
        page.add_redact_annot(redact_rect, fill=(1, 1, 1))  # 白色填充
        page.apply_redactions()
        
        # 插入新文字 - 從 rect 底部往上偏移
        text_point = fitz.Point(rect[0], rect[3] - baseline_offset)
        page.insert_text(
            text_point,
            new_text,
            fontsize=fontsize,
            fontname=fontname,
            color=color
        )

    def generate(self, data: dict) -> dict:
        """
        生成報價單 PDF
        """
        try:
            # 驗證資料
            required_fields = ['customer_name', 'address', 'phone', 'quantity', 'unit_price', 'trainer']
            for field in required_fields:
                if field not in data:
                    return {"success": False, "error": f"缺少必要欄位: {field}"}
            
            quantity = int(data['quantity'])
            if quantity not in [6, 8]:
                return {"success": False, "error": "數量必須是 6 或 8"}
            
            trainer = data['trainer']
            if trainer not in TRAINERS:
                return {"success": False, "error": f"無效的訓犬師: {trainer}"}
            
            unit_price = self._parse_price(data['unit_price'])
            
            # 計算金額
            total_price = quantity * unit_price
            subtotal = total_price
            grand_total = subtotal
            
            # 取得流水編號
            quotation_number = self._get_next_number()
            quotation_id = self._format_number(quotation_number)
            
            # 日期
            today = datetime.now()
            quote_date = today.strftime('%m/%d/%Y')
            valid_date = (today + timedelta(days=3)).strftime('%m/%d/%Y')
            
            # 生成檔名
            safe_name = re.sub(r'[^\w\-]', '_', data['customer_name'])
            filename = f"Quotation_{quotation_id.replace('#', '')}_{safe_name}_{today.strftime('%Y%m%d')}.pdf"
            filepath = OUTPUT_DIR / filename
            
            # 開啟模板並修改
            doc = fitz.open(str(TEMPLATE_PATH))
            page = doc[0]
            
            # === 修改報價單編號 ===
            pos = TEXT_POSITIONS['quotation_id']
            self._redact_and_replace(page, pos['rect'], quotation_id, fontsize=pos['fontsize'])
            
            # === 修改日期 ===
            pos = TEXT_POSITIONS['quote_date']
            self._redact_and_replace(page, pos['rect'], quote_date, fontsize=pos['fontsize'])
            
            pos = TEXT_POSITIONS['valid_date']
            self._redact_and_replace(page, pos['rect'], valid_date, fontsize=pos['fontsize'])
            
            # === 修改項目內容 (根據數量選擇行) ===
            if quantity == 6:
                # 清除第二行 (8堂課那行)
                row2_full_rect = (80.5, 376.1, 504.0, 391.0)
                page.add_redact_annot(fitz.Rect(row2_full_rect), fill=(1, 1, 1))
                page.apply_redactions()
                
                # 更新第一行的數值
                pos = TEXT_POSITIONS['row1_unit']
                self._redact_and_replace(page, pos['rect'], self._format_price(unit_price), fontsize=pos['fontsize'])
                
                pos = TEXT_POSITIONS['row1_total']
                self._redact_and_replace(page, pos['rect'], self._format_price(total_price), fontsize=pos['fontsize'])
                
            else:  # quantity == 8
                # 清除第一行 (6堂課那行)
                row1_full_rect = (80.5, 341.6, 504.0, 356.5)
                page.add_redact_annot(fitz.Rect(row1_full_rect), fill=(1, 1, 1))
                page.apply_redactions()
                
                # 更新第二行的數值
                pos = TEXT_POSITIONS['row2_unit']
                self._redact_and_replace(page, pos['rect'], self._format_price(unit_price), fontsize=pos['fontsize'])
                
                pos = TEXT_POSITIONS['row2_total']
                self._redact_and_replace(page, pos['rect'], self._format_price(total_price), fontsize=pos['fontsize'])
            
            # === 修改小計 ===
            pos = TEXT_POSITIONS['subtotal']
            self._redact_and_replace(page, pos['rect'], self._format_price(subtotal), fontsize=pos['fontsize'])
            
            # === 修改總計 ===
            pos = TEXT_POSITIONS['grand_total']
            self._redact_and_replace(page, pos['rect'], f"TWD {self._format_price(grand_total)}", fontsize=pos['fontsize'])
            
            # === 修改訓犬師簽名 ===
            # 只有當訓犬師不是 Eric Pan 時才需要修改（因為模板已有 Eric Pan 簽名）
            if trainer != "Eric Pan":
                pos = TEXT_POSITIONS['trainer_signature']
                self._redact_and_replace(page, pos['rect'], trainer, fontsize=pos['fontsize'], baseline_offset=15)
            
            # 儲存
            doc.save(str(filepath))
            doc.close()
            
            return {
                "success": True,
                "file_path": str(filepath),
                "quotation_number": quotation_id,
                "customer_name": data['customer_name'],
                "grand_total": grand_total,
                "date_str": today.strftime('%Y%m%d'),
                "message": f"報價單 {quotation_id} 已生成"
            }
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}


def parse_quotation_request(text: str) -> dict:
    """解析訓犬師的報價請求訊息"""
    data = {}
    
    patterns = {
        'customer_name': r'客戶姓名[：:]\s*(.+?)(?:\n|$)',
        'address': r'地址[：:]\s*(.+?)(?:\n|$)',
        'phone': r'電話[：:]\s*(.+?)(?:\n|$)',
        'quantity': r'數量[：:]\s*(\d+)',
        'unit_price': r'單價[：:]\s*([\d,]+)',
        'trainer': r'訓犬師[：:]\s*(.+?)(?:\n|$)'
    }
    
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1).strip()
            if key == 'quantity':
                value = int(value)
            elif key == 'unit_price':
                value = int(value.replace(',', ''))
            data[key] = value
    
    return data


def is_quotation_request(text: str) -> bool:
    """檢查訊息是否為報價請求"""
    return '1-1' in text and '訓犬服務報價' in text


# 測試用
if __name__ == "__main__":
    generator = QuotationGenerator()
    
    result = generator.generate({
        'customer_name': 'Ethan',
        'address': '基隆市中正區新豐街345號',
        'phone': '0976-765432',
        'quantity': 6,
        'unit_price': 2800,
        'trainer': 'Eric Pan'
    })
    
    if result['success']:
        print(f"✅ 報價單生成成功！")
        print(f"   編號: {result['quotation_number']}")
        print(f"   檔案: {result['file_path']}")
        print(f"   金額: TWD {result['grand_total']:,}")
    else:
        print(f"❌ 生成失敗: {result['error']}")
