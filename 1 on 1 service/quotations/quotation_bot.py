"""
Dori & Rito - 報價單自動化 Bot
==============================
專門用於自動生成報價單並上傳到 Notion

使用方式：
    python quotation_bot.py

訊息格式：
    1-1 訓犬服務報價
    客戶姓名：Ethan
    地址：基隆市中正區新豐街345號
    電話：0976-765432
    數量：6
    單價：2,800
    訓犬師：Eric Pan
"""

import os
import sys
import time
import re
from typing import Optional

from telegram_client import TelegramClient
from notion_client import QuotationNotionClient
from quotation_generator import QuotationGenerator, parse_quotation_request, is_quotation_request
from google_drive_client import GoogleDriveClient

# 環境變數
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")


class QuotationBot:
    """報價單自動化 Bot"""

    def __init__(self):
        if not TELEGRAM_BOT_TOKEN:
            raise ValueError("請設定 TELEGRAM_BOT_TOKEN 環境變數")
        
        self.telegram = TelegramClient(TELEGRAM_BOT_TOKEN)
        self.notion = QuotationNotionClient()
        self.generator = QuotationGenerator()
        
        # Google Drive 客戶端(允許失敗以不阻塞 Bot)
        try:
            self.drive = GoogleDriveClient()
            print("✅ Google Drive 連線成功")
        except Exception as e:
            print(f"⚠️ Google Drive 初始化失敗: {e}")
            self.drive = None
        
        self.last_update_id = 0

    def start_command(self, chat_id: str) -> None:
        """處理 /start 指令"""
        welcome_msg = """🐕 *Dori & Rito 報價單自動化 Bot*

歡迎使用！請發送以下格式來產生報價單：

```
1-1 訓犬服務報價
客戶姓名：[姓名]
地址：[地址]
電話：[電話]
數量：[6 或 8]
單價：[單價]
訓犬師：[Eric Pan / Pennee Tan]
```

📋 *指令說明*
/start - 顯示此訊息
/help - 詳細說明
/template - 取得報價單範本
"""
        self.telegram.send_message(chat_id, welcome_msg, parse_mode="Markdown")

    def help_command(self, chat_id: str) -> None:
        """處理 /help 指令"""
        help_msg = """📖 *報價單自動化說明*

*必填欄位*
• 客戶姓名：客戶的姓名
• 地址：客戶的完整地址
• 電話：客戶的聯絡電話
• 數量：課堂數（6 或 8）
• 單價：每堂課的價格
• 訓犬師：Eric Pan 或 Pennee Tan

*自動計算*
• 報價日期：今天
• 有效日期：3 天後
• 總價：數量 × 單價

*流程*
1️⃣ 發送報價請求
2️⃣ Bot 生成 PDF 報價單
3️⃣ 自動上傳到 Notion 客戶頁面
4️⃣ 回傳確認訊息
"""
        self.telegram.send_message(chat_id, help_msg, parse_mode="Markdown")

    def template_command(self, chat_id: str) -> None:
        """提供報價單範本"""
        template = """📋 *報價單範本*（複製並修改）

```
1-1 訓犬服務報價
客戶姓名：
地址：
電話：
數量：6
單價：2,800
訓犬師：Eric Pan
```
"""
        self.telegram.send_message(chat_id, template, parse_mode="Markdown")

    def handle_quotation(self, chat_id: str, text: str, user: str) -> None:
        """處理報價單請求"""
        # 發送處理中訊息
        self.telegram.send_message(chat_id, "⏳ 正在生成報價單...")

        try:
            # 解析請求
            data = parse_quotation_request(text)
            
            # 驗證必要欄位
            required = ['customer_name', 'address', 'phone', 'quantity', 'unit_price', 'trainer']
            missing = [f for f in required if f not in data]
            
            if missing:
                field_names = {
                    'customer_name': '客戶姓名',
                    'address': '地址',
                    'phone': '電話',
                    'quantity': '數量',
                    'unit_price': '單價',
                    'trainer': '訓犬師'
                }
                missing_names = [field_names.get(f, f) for f in missing]
                self.telegram.send_message(
                    chat_id,
                    f"❌ 缺少必要欄位：{', '.join(missing_names)}\n\n請使用 /template 查看範本格式"
                )
                return

            # 生成報價單
            result = self.generator.generate(data)
            
            if not result.get('success'):
                self.telegram.send_message(chat_id, f"❌ 生成失敗：{result.get('error')}")
                return

            # 上傳到 Google Drive（如果可用）
            drive_result = {"success": False, "error": "Drive 未初始化"}
            drive_link = None
            
            if self.drive:
                self.telegram.send_message(chat_id, "📤 正在上傳到 Google Drive...")
                drive_result = self.drive.upload_quotation(
                    file_path=result['file_path'],
                    quotation_number=result['quotation_number'],
                    customer_name=data['customer_name'],
                    date_str=result.get('date_str', '')
                )
                
                if drive_result.get('success'):
                    drive_link = drive_result.get('web_view_link', '')
            
            # 上傳到 Notion（包含 Drive 連結）
            notion_result = self.notion.add_quotation_to_customer(
                customer_name=data['customer_name'],
                file_path=result['file_path'],
                quotation_number=result['quotation_number'],
                grand_total=result['grand_total'],
                drive_link=drive_link
            )

            # 組合回覆訊息
            success_msg = f"""✅ *報價單生成成功！*

📋 *報價單資訊*
• 編號：`{result['quotation_number']}`
• 客戶：{data['customer_name']}
• 金額：TWD {result['grand_total']:,}
"""
            if drive_result.get('success'):
                success_msg += f"\n📎 [Google Drive 連結]({drive_link})"
            else:
                success_msg += f"\n⚠️ Drive 上傳失敗：{drive_result.get('error', '未知錯誤')}"
            
            if notion_result.get('success'):
                success_msg += "\n✅ 已同步到 Notion 客戶頁面"
            else:
                success_msg += f"\n⚠️ Notion 同步失敗：{notion_result.get('message', '未知錯誤')}"

            self.telegram.send_message(chat_id, success_msg, parse_mode="Markdown")

        except Exception as e:
            self.telegram.send_message(chat_id, f"❌ 處理錯誤：{str(e)}")

    def handle_message(self, message: dict) -> None:
        """處理收到的訊息"""
        chat_id = str(message['chat']['id'])
        text = message.get('text', '')
        user = message.get('from', {}).get('username', 'unknown')

        # 處理指令
        if text.startswith('/start'):
            self.start_command(chat_id)
        elif text.startswith('/help'):
            self.help_command(chat_id)
        elif text.startswith('/template'):
            self.template_command(chat_id)
        elif is_quotation_request(text):
            self.handle_quotation(chat_id, text, user)
        else:
            # 不認識的訊息
            self.telegram.send_message(
                chat_id,
                "🤔 不認識這個指令。請使用 /help 查看使用說明，或使用 /template 取得報價單範本。"
            )

    def run(self) -> None:
        """啟動 Bot"""
        print("🤖 報價單自動化 Bot 啟動中...")
        print("   按 Ctrl+C 停止\n")

        while True:
            try:
                response = self.telegram.get_updates(offset=self.last_update_id + 1)
                
                if response.get("ok") and response.get("result"):
                    # DEBUG: Print update count
                    update_count = len(response["result"])
                    if update_count > 0:
                        print(f"📩 收到 {update_count} 則更新")

                    for update in response["result"]:
                        self.last_update_id = update['update_id']
                        
                        if 'message' in update:
                            print(f"   處理訊息 ID: {update['message'].get('message_id')}")
                            self.handle_message(update['message'])

                time.sleep(1)

            except KeyboardInterrupt:
                print("\n👋 Bot 已停止")
                break
            except Exception as e:
                print(f"❌ 錯誤: {e}")
                time.sleep(5)


if __name__ == "__main__":
    bot = QuotationBot()
    bot.run()
