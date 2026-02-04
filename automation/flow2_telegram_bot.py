"""
Dori & Rito Automation Bot - Flow 2
====================================
功能一：Telegram Bot → Claude API → Notion → Telegram 通知 (Email 自動化)
功能二：Telegram Bot → PDF 生成 → Notion 客戶頁面 (報價單自動化)

這個腳本會持續運行，監聯 Telegram 訊息，
根據指令自動產生 email 或報價單。

使用方式：
    python flow2_telegram_bot.py

訊息格式（Email）：
    主題: [你的主題]
    格式: [nurture_email / social_post]
    CTA: [你想要的 CTA]
    參考: [參考資料或靈感]

訊息格式（報價單）：
    1-1 訓犬服務報價
    客戶姓名：[姓名]
    地址：[地址]
    電話：[電話]
    數量：[6 或 8]
    單價：[單價]
    訓犬師：[Eric Pan / Pennee Tan]

部署選項：
    1. 本地運行: python flow2_telegram_bot.py
    2. 雲端部署: Railway, Render, AWS Lambda 等
"""

import os
import sys
import time
import re
from typing import Optional
import anthropic
from notion_client import NotionClient, QuotationNotionClient
from telegram_client import TelegramClient
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ANTHROPIC_API_KEY, SKILL_FILE_PATH

# Add quotation generator path
QUOTATION_DIR = os.path.join(os.path.dirname(__file__), "..", "1 on 1 service", "quotations")
sys.path.append(QUOTATION_DIR)

from quotation_generator import QuotationGenerator, parse_quotation_request, is_quotation_request


class DoriRitoBot:
    """Dori & Rito Telegram Bot"""

    def __init__(self):
        self.telegram = TelegramClient(TELEGRAM_BOT_TOKEN)
        self.notion = NotionClient()
        self.quotation_notion = QuotationNotionClient()
        self.quotation_generator = QuotationGenerator()
        self.claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
        self.last_update_id = 0
        self.skill_prompt = self._load_skill()

    def _load_skill(self) -> str:
        """載入 copywriter skill"""
        try:
            with open(SKILL_FILE_PATH, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            print(f"⚠️ 找不到 skill 檔案: {SKILL_FILE_PATH}")
            return ""

    def parse_request(self, text: str) -> dict:
        """
        解析使用者的請求

        支援格式：
            主題: xxx
            格式: nurture_email / social_post
            CTA: xxx
            參考: xxx
        """
        request = {
            "topic": "",
            "format": "nurture_email",
            "cta": "",
            "reference": "",
            "raw_text": text
        }

        # 解析各欄位
        patterns = {
            "topic": r"主題[：:]\s*(.+?)(?=\n|格式|CTA|參考|$)",
            "format": r"格式[：:]\s*(.+?)(?=\n|主題|CTA|參考|$)",
            "cta": r"CTA[：:]\s*(.+?)(?=\n|主題|格式|參考|$)",
            "reference": r"參考[：:]\s*(.+?)(?=\n|主題|格式|CTA|$)"
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                request[key] = match.group(1).strip()

        # 如果沒有解析到主題，把整個文字當主題
        if not request["topic"]:
            request["topic"] = text.strip()

        return request

    def generate_email(self, request: dict) -> tuple[str, str]:
        """
        使用 Claude API 產生 email 內容

        Returns:
            (subject, content) tuple
        """
        if not self.claude:
            raise ValueError("未設定 ANTHROPIC_API_KEY")

        # 建立 prompt
        format_type = "Nurture Email" if "email" in request.get("format", "").lower() else "Social Media Post"

        user_prompt = f"""請幫我用 Dori & Rito 的品牌語調寫一封 {format_type}。

主題: {request.get('topic', '')}
CTA 目標: {request.get('cta', '軟性推廣課程')}
參考資料: {request.get('reference', '無')}

請依照 skill 文件中的格式和規範來撰寫。

輸出格式：
1. 先輸出「主旨：」後面接主旨（8-12 個中文字）
2. 空一行
3. 然後輸出完整的 email 內文

請確保：
- 使用繁體中文（台灣用語）
- 避免 AI 感的用詞
- 遵循 Give-Give-Ask 原則
- 自然流暢的語調"""

        # 呼叫 Claude API
        message = self.claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=f"""你是 Dori & Rito 的 Senior Email Marketing Copywriter。

以下是你的完整技能說明和品牌規範：

{self.skill_prompt}

請嚴格遵循這些規範來創作內容。""",
            messages=[
                {"role": "user", "content": user_prompt}
            ]
        )

        # 解析回應
        response_text = message.content[0].text

        # 提取主旨和內文
        lines = response_text.strip().split('\n')
        subject = ""
        content_lines = []
        content_started = False

        for line in lines:
            if line.startswith("主旨：") or line.startswith("主旨:"):
                subject = line.replace("主旨：", "").replace("主旨:", "").strip()
            elif subject and (line.strip() or content_started):
                content_started = True
                content_lines.append(line)

        content = '\n'.join(content_lines).strip()

        # 如果沒有成功解析，使用預設值
        if not subject:
            subject = request.get("topic", "新 Email")[:20]
        if not content:
            content = response_text

        return subject, content

    def handle_message(self, message: dict) -> None:
        """處理收到的訊息"""
        chat_id = str(message["chat"]["id"])
        text = message.get("text", "")
        user = message["from"].get("username", message["from"].get("first_name", "User"))

        print(f"\n📨 收到訊息 from @{user}")
        print(f"   內容: {text[:50]}...")

        # 檢查是否是命令
        if text.startswith("/start"):
            self.telegram.send_message(
                text="""👋 嗨！我是 Dori & Rito 自動化 Bot！

我可以幫你：
1️⃣ 產生高品質的 email 內容
2️⃣ 建立專業報價單

---

📧 *Email 格式：*
```
主題: 你想寫的主題
格式: nurture_email 或 social_post
CTA: 你想要的行動呼籲
參考: 任何參考資料
```

---

📄 *報價單格式：*
```
1-1 訓犬服務報價
客戶姓名：客戶名字
地址：完整地址
電話：電話號碼
數量：6
單價：2,800
訓犬師：Eric Pan
```

輸入 /help 查看更多說明！""",
                chat_id=chat_id,
                parse_mode="Markdown"
            )
            return

        if text.startswith("/help"):
            self.telegram.send_message(
                text="""📚 *使用說明*

*📧 Email 自動化*
1️⃣ 發送主題或完整請求
2️⃣ Claude AI 產生 email
3️⃣ 自動儲存到 Notion

*📄 報價單自動化*
1️⃣ 發送報價指令
2️⃣ 自動生成 PDF 報價單
3️⃣ 上傳到客戶 Notion 頁面

---

*指令：*
/start - 開始使用
/help - 顯示說明
/status - 檢查服務狀態
/quotation - 報價單範本""",
                chat_id=chat_id,
                parse_mode="Markdown"
            )
            return

        if text.startswith("/quotation"):
            self.telegram.send_message(
                text="""📄 *報價單指令範本*

複製以下範本，填入客戶資料後發送：

```
1-1 訓犬服務報價
客戶姓名：
地址：
電話：
數量：6
單價：2,800
訓犬師：Eric Pan
```

*注意事項：*
• 數量只能填 6 或 8
• 訓犬師：Eric Pan 或 Pennee Tan
• 客戶必須已存在於 Notion 客戶資料庫""",
                chat_id=chat_id,
                parse_mode="Markdown"
            )
            return

        if text.startswith("/status"):
            status = "✅ 正常" if self.claude else "❌ 未設定 API Key"
            self.telegram.send_message(
                text=f"""📊 *服務狀態*

Claude API: {status}
Notion Email: ✅ 已連接
Notion 客戶管理: ✅ 已連接
報價單生成器: ✅ 就緒
Telegram: ✅ 運作中""",
                chat_id=chat_id,
                parse_mode="Markdown"
            )
            return

        # 檢查是否為報價單請求
        if is_quotation_request(text):
            self._handle_quotation(chat_id, text, user)
            return

        # 否則處理 Email 請求
        self._handle_email(chat_id, text, user)

    def _handle_quotation(self, chat_id: str, text: str, user: str) -> None:
        """處理報價單請求"""
        try:
            self.telegram.send_message(
                text="⏳ 正在生成報價單...",
                chat_id=chat_id
            )

            # 解析報價單資料
            data = parse_quotation_request(text)
            print(f"   報價單資料: {data}")

            # 檢查必要欄位
            required = ['customer_name', 'address', 'phone', 'quantity', 'unit_price', 'trainer']
            missing = [f for f in required if f not in data or not data[f]]
            if missing:
                self.telegram.send_message(
                    text=f"❌ 缺少必要欄位：{', '.join(missing)}\n\n請使用 /quotation 查看正確格式",
                    chat_id=chat_id
                )
                return

            # 生成 PDF
            result = self.quotation_generator.generate(data)
            
            if not result["success"]:
                self.telegram.send_message(
                    text=f"❌ 報價單生成失敗：{result['error']}",
                    chat_id=chat_id
                )
                return

            print(f"   報價單生成成功: {result['quotation_number']}")

            # 上傳到 Notion 客戶頁面
            notion_result = self.quotation_notion.add_quotation_to_customer(
                customer_name=data['customer_name'],
                file_path=result['file_path'],
                quotation_number=result['quotation_number'],
                grand_total=result['grand_total']
            )

            if notion_result["success"]:
                self.telegram.send_message(
                    text=f"""✅ *報價單已建立完成！*

📄 *編號：* {result['quotation_number']}
👤 *客戶：* {data['customer_name']}
💰 *金額：* TWD {result['grand_total']:,}
🧑‍🏫 *訓犬師：* {data['trainer']}

📁 *檔案位置：*
`{result['file_path']}`

🔗 *Notion 客戶頁面：*
{notion_result.get('page_url', '已更新')}

---
_Dori & Rito 報價單自動化系統_""",
                    chat_id=chat_id,
                    parse_mode="Markdown"
                )
            else:
                # PDF 生成成功但 Notion 上傳失敗
                self.telegram.send_message(
                    text=f"""⚠️ *報價單已生成，但 Notion 上傳失敗*

📄 *編號：* {result['quotation_number']}
📁 *檔案位置：*
`{result['file_path']}`

❌ *Notion 錯誤：* {notion_result.get('error', '未知錯誤')}

請手動上傳報價單到客戶頁面。""",
                    chat_id=chat_id,
                    parse_mode="Markdown"
                )

        except Exception as e:
            print(f"❌ 報價單錯誤: {e}")
            import traceback
            traceback.print_exc()
            self.telegram.send_message(
                text=f"❌ 處理報價單時發生錯誤: {str(e)}",
                chat_id=chat_id
            )

    def _handle_email(self, chat_id: str, text: str, user: str) -> None:
        """處理 Email 請求"""
        try:
            self.telegram.send_message(
                text="⏳ 正在產生 email 內容...",
                chat_id=chat_id
            )

            request = self.parse_request(text)
            print(f"   解析結果: {request}")

            # 產生 email
            if not self.claude:
                self.telegram.send_message(
                    text="❌ 錯誤：未設定 ANTHROPIC_API_KEY",
                    chat_id=chat_id
                )
                return

            subject, content = self.generate_email(request)
            print(f"   主旨: {subject}")

            # 儲存到 Notion
            notion_result = self.notion.create_email_page(subject, content)

            if notion_result.get("success"):
                page_url = notion_result.get("page_url", "")
                self.telegram.send_message(
                    text=f"""✅ *Email 已建立完成！*

📧 *主旨：* {subject}

🔗 *Notion 連結：*
{page_url}

---
_Dori & Rito 自動化系統_""",
                    chat_id=chat_id,
                    parse_mode="Markdown"
                )
            else:
                self.telegram.send_message(
                    text=f"❌ Notion 儲存失敗: {notion_result.get('error')}",
                    chat_id=chat_id
                )

        except Exception as e:
            print(f"❌ 錯誤: {e}")
            self.telegram.send_message(
                text=f"❌ 處理時發生錯誤: {str(e)}",
                chat_id=chat_id
            )

    def run(self) -> None:
        """啟動 bot（long polling）"""
        print("🤖 Dori & Rito Email Bot 啟動中...")

        bot_info = self.telegram.get_me()
        if bot_info.get("ok"):
            bot_username = bot_info["result"]["username"]
            print(f"✅ Bot: @{bot_username}")
            print(f"   連結: https://t.me/{bot_username}")
        else:
            print(f"❌ Bot 連接失敗: {bot_info}")
            return

        print("\n📡 監聽訊息中... (Ctrl+C 停止)")

        while True:
            try:
                updates = self.telegram.get_updates(
                    offset=self.last_update_id + 1,
                    timeout=30
                )

                if updates.get("ok") and updates.get("result"):
                    for update in updates["result"]:
                        self.last_update_id = update["update_id"]

                        if "message" in update and "text" in update["message"]:
                            self.handle_message(update["message"])

            except KeyboardInterrupt:
                print("\n\n👋 Bot 已停止")
                break
            except Exception as e:
                print(f"⚠️ 錯誤: {e}")
                time.sleep(5)


def main():
    if not ANTHROPIC_API_KEY:
        print("⚠️ 警告：未設定 ANTHROPIC_API_KEY")
        print("   請在 config.py 或環境變數中設定")
        print("   Bot 仍會啟動，但無法產生內容")
        print()

    bot = DoriRitoBot()
    bot.run()


if __name__ == "__main__":
    main()
