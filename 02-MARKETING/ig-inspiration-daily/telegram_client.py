"""
Dori & Rito IG 靈感日報 — Telegram Client
==========================================
處理 Telegram Bot 的訊息發送與接收
"""

import time
import logging
import requests
from typing import Optional

from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_MAX_LENGTH

logger = logging.getLogger(__name__)


class TelegramClient:
    """Telegram Bot API 客戶端"""

    def __init__(self, bot_token: str = TELEGRAM_BOT_TOKEN):
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"

    def send_message(
        self,
        text: str,
        chat_id: str = TELEGRAM_CHAT_ID,
        parse_mode: str = "HTML",
        retry_count: int = 3,
        retry_delay: float = 5.0,
    ) -> dict:
        """
        Send message with retry logic.
        Uses HTML parse mode by default for more reliable formatting.
        """
        for attempt in range(retry_count):
            try:
                payload = {
                    "chat_id": chat_id,
                    "text": text,
                    "disable_web_page_preview": True,
                }
                if parse_mode:
                    payload["parse_mode"] = parse_mode
                response = requests.post(
                    f"{self.base_url}/sendMessage",
                    json=payload,
                    timeout=30,
                )
                if response.status_code == 200:
                    return {"success": True, "result": response.json()}

                # If Markdown/HTML fails, try plain text
                if response.status_code == 400 and parse_mode:
                    logger.warning("格式化訊息失敗，改用純文字重試")
                    payload["parse_mode"] = ""
                    response = requests.post(
                        f"{self.base_url}/sendMessage",
                        json=payload,
                        timeout=30,
                    )
                    if response.status_code == 200:
                        return {"success": True, "result": response.json()}

                logger.warning(
                    f"Telegram 傳送失敗 (attempt {attempt + 1}): {response.text}"
                )

            except requests.RequestException as e:
                logger.warning(
                    f"Telegram 網路錯誤 (attempt {attempt + 1}): {e}"
                )

            if attempt < retry_count - 1:
                time.sleep(retry_delay)

        return {"success": False, "error": "所有重試均失敗"}

    def send_long_message(
        self,
        text: str,
        chat_id: str = TELEGRAM_CHAT_ID,
        parse_mode: str = "HTML",
    ) -> list[dict]:
        """
        Send a long message by splitting it into chunks.
        Splits on double newlines to keep sections together.
        """
        if len(text) <= TELEGRAM_MAX_LENGTH:
            return [self.send_message(text, chat_id, parse_mode)]

        results = []
        chunks = self._split_message(text)

        for i, chunk in enumerate(chunks):
            logger.info(f"傳送訊息 {i + 1}/{len(chunks)}（{len(chunk)} 字元）")
            result = self.send_message(chunk, chat_id, parse_mode)
            results.append(result)
            if i < len(chunks) - 1:
                time.sleep(1)  # Rate limiting between chunks

        return results

    def _split_message(self, text: str) -> list[str]:
        """Split long message into chunks at natural break points."""
        chunks = []
        while text:
            if len(text) <= TELEGRAM_MAX_LENGTH:
                chunks.append(text)
                break

            # Try to split at double newline
            split_at = text.rfind("\n\n", 0, TELEGRAM_MAX_LENGTH)
            if split_at == -1:
                # Try single newline
                split_at = text.rfind("\n", 0, TELEGRAM_MAX_LENGTH)
            if split_at == -1:
                # Force split at max length
                split_at = TELEGRAM_MAX_LENGTH

            chunks.append(text[:split_at])
            text = text[split_at:].lstrip("\n")

        return chunks

    def get_updates(self, offset: Optional[int] = None, timeout: int = 30) -> dict:
        """取得 bot 收到的訊息更新（long polling）"""
        params: dict = {"timeout": timeout}
        if offset is not None:
            params["offset"] = offset

        try:
            response = requests.get(
                f"{self.base_url}/getUpdates",
                params=params,
                timeout=timeout + 10,  # HTTP timeout > long polling timeout
            )
            if response.status_code == 200:
                return response.json()
            else:
                return {"ok": False, "error": response.text}
        except requests.RequestException as e:
            logger.error(f"取得更新失敗: {e}")
            return {"ok": False, "error": str(e)}

    def get_me(self) -> dict:
        """取得 bot 資訊"""
        try:
            response = requests.get(f"{self.base_url}/getMe", timeout=10)
            return response.json()
        except requests.RequestException as e:
            logger.error(f"取得 bot 資訊失敗: {e}")
            return {"ok": False, "error": str(e)}
