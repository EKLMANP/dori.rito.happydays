"""
Dori & Rito Email Automation
============================

自動化產生 email 內容、儲存到 Notion、發送 Telegram 通知。

使用方式：
    from automation import publish_email
    publish_email(subject, content)
"""

from .flow1_claude_to_notion import publish_email
from .notion_client import NotionClient, create_email_in_notion
from .telegram_client import TelegramClient, send_telegram_notification

__all__ = [
    "publish_email",
    "NotionClient",
    "create_email_in_notion",
    "TelegramClient",
    "send_telegram_notification",
]

__version__ = "1.0.0"
