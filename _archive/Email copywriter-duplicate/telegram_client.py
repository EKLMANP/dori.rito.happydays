"""
Dori & Rito Email Automation - Telegram Client
===============================================
處理 Telegram Bot 的訊息發送與接收
"""

import requests
from typing import Optional, Callable
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID


class TelegramClient:
    """Telegram Bot API 客戶端"""

    def __init__(self, bot_token: str = TELEGRAM_BOT_TOKEN):
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"

    def send_message(
        self,
        text: str,
        chat_id: str = TELEGRAM_CHAT_ID,
        parse_mode: str = "Markdown"
    ) -> dict:
        """
        發送訊息到指定的 chat

        Args:
            text: 訊息內容
            chat_id: Telegram chat ID
            parse_mode: 訊息格式（Markdown, HTML, None）

        Returns:
            Telegram API response
        """
        if not chat_id:
            return {
                "success": False,
                "error": "未設定 TELEGRAM_CHAT_ID，請先取得你的 chat_id"
            }

        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }

        response = requests.post(
            f"{self.base_url}/sendMessage",
            json=payload
        )

        if response.status_code == 200:
            return {"success": True, "result": response.json()}
        else:
            return {"success": False, "error": response.text}

    def send_notification(
        self,
        subject: str,
        notion_url: str,
        chat_id: str = TELEGRAM_CHAT_ID
    ) -> dict:
        """
        發送 email 建立完成通知

        Args:
            subject: Email 主旨
            notion_url: Notion 頁面連結
            chat_id: Telegram chat ID
        """
        message = f"""✅ *Email 已建立完成！*

📧 *主旨：* {subject}

🔗 *Notion 連結：*
{notion_url}

---
_Dori & Rito 自動化系統_"""

        return self.send_message(message, chat_id)

    def get_updates(self, offset: Optional[int] = None, timeout: int = 30) -> dict:
        """
        取得 bot 收到的訊息更新

        Args:
            offset: 訊息 offset（用於分頁）
            timeout: long polling timeout

        Returns:
            更新列表
        """
        params = {"timeout": timeout}
        if offset:
            params["offset"] = offset

        response = requests.get(
            f"{self.base_url}/getUpdates",
            params=params
        )

        if response.status_code == 200:
            return response.json()
        else:
            return {"ok": False, "error": response.text}

    def get_me(self) -> dict:
        """取得 bot 資訊"""
        response = requests.get(f"{self.base_url}/getMe")
        return response.json()

    def get_chat_id_from_message(self) -> str:
        """
        透過發送訊息給 bot 來取得你的 chat_id
        請先向 bot 發送任意訊息，然後執行此函數
        """
        updates = self.get_updates()
        if updates.get("ok") and updates.get("result"):
            for update in updates["result"]:
                if "message" in update:
                    chat_id = update["message"]["chat"]["id"]
                    username = update["message"]["from"].get("username", "Unknown")
                    print(f"找到 Chat ID: {chat_id}")
                    print(f"使用者: @{username}")
                    return str(chat_id)
        print("未找到訊息。請先向 bot 發送一條訊息。")
        return ""


# 方便直接呼叫的函數
def send_telegram_notification(subject: str, notion_url: str, chat_id: str = TELEGRAM_CHAT_ID) -> dict:
    """發送通知的便捷函數"""
    client = TelegramClient()
    return client.send_notification(subject, notion_url, chat_id)


if __name__ == "__main__":
    # 取得 chat_id
    print("正在取得 Chat ID...")
    print("請先向 Telegram Bot 發送一條訊息！")
    print(f"Bot 連結: https://t.me/{TELEGRAM_BOT_TOKEN.split(':')[0]}")
    print()

    client = TelegramClient()
    bot_info = client.get_me()
    if bot_info.get("ok"):
        bot_username = bot_info["result"]["username"]
        print(f"Bot: @{bot_username}")
        print(f"請向 https://t.me/{bot_username} 發送訊息")
        print()

    input("發送訊息後，按 Enter 繼續...")
    chat_id = client.get_chat_id_from_message()
    if chat_id:
        print(f"\n請將此 Chat ID 加入 config.py:")
        print(f'TELEGRAM_CHAT_ID = "{chat_id}"')
