"""
Dori & Rito Email Automation - Flow 1
=====================================
流程一：Claude 對話 → 產生 Email → Notion → Telegram 通知

使用方式：
1. 在 Claude 對話中產生 email 內容
2. 將主旨和內文傳入此腳本
3. 自動建立 Notion 頁面並發送 Telegram 通知

範例：
    python flow1_claude_to_notion.py --subject "你對耐心的理解，可能反了" --content-file email_content.md

    或在 Python 中：
    from flow1_claude_to_notion import publish_email
    publish_email(subject, content)
"""

import argparse
import sys
from notion_client import NotionClient, create_email_in_notion
from telegram_client import TelegramClient, send_telegram_notification
from config import TELEGRAM_CHAT_ID


def publish_email(
    subject: str,
    content: str,
    chat_id: str = TELEGRAM_CHAT_ID,
    notify: bool = True
) -> dict:
    """
    發布 email 到 Notion 並發送 Telegram 通知

    Args:
        subject: Email 主旨
        content: Email 內文（Markdown 格式）
        chat_id: Telegram chat ID
        notify: 是否發送 Telegram 通知

    Returns:
        包含結果的字典
    """
    print(f"📝 正在建立 Notion 頁面...")
    print(f"   主旨: {subject}")

    # 1. 建立 Notion 頁面
    notion_client = NotionClient()
    notion_result = notion_client.create_email_page(subject, content)

    if not notion_result.get("success"):
        print(f"❌ Notion 建立失敗: {notion_result.get('error')}")
        return notion_result

    page_url = notion_result.get("page_url", "")
    print(f"✅ Notion 頁面建立成功!")
    print(f"   連結: {page_url}")

    # 2. 發送 Telegram 通知
    telegram_result = None
    if notify and chat_id:
        print(f"\n📱 正在發送 Telegram 通知...")
        telegram_client = TelegramClient()
        telegram_result = telegram_client.send_notification(
            subject=subject,
            notion_url=page_url,
            chat_id=chat_id
        )

        if telegram_result.get("success"):
            print(f"✅ Telegram 通知已發送!")
        else:
            print(f"⚠️ Telegram 通知失敗: {telegram_result.get('error')}")

    return {
        "success": True,
        "notion": notion_result,
        "telegram": telegram_result,
        "page_url": page_url
    }


def main():
    parser = argparse.ArgumentParser(
        description="Dori & Rito Email Automation - Flow 1"
    )
    parser.add_argument(
        "--subject", "-s",
        required=True,
        help="Email 主旨"
    )
    parser.add_argument(
        "--content", "-c",
        help="Email 內文（直接輸入）"
    )
    parser.add_argument(
        "--content-file", "-f",
        help="Email 內文檔案路徑（Markdown 格式）"
    )
    parser.add_argument(
        "--chat-id",
        default=TELEGRAM_CHAT_ID,
        help="Telegram Chat ID"
    )
    parser.add_argument(
        "--no-notify",
        action="store_true",
        help="不發送 Telegram 通知"
    )

    args = parser.parse_args()

    # 取得內容
    if args.content_file:
        with open(args.content_file, "r", encoding="utf-8") as f:
            content = f.read()
    elif args.content:
        content = args.content
    else:
        print("請透過 --content 或 --content-file 提供 email 內文")
        sys.exit(1)

    # 執行發布
    result = publish_email(
        subject=args.subject,
        content=content,
        chat_id=args.chat_id,
        notify=not args.no_notify
    )

    if result.get("success"):
        print(f"\n🎉 完成！")
        print(f"頁面連結: {result.get('page_url')}")
    else:
        print(f"\n❌ 發布失敗")
        sys.exit(1)


if __name__ == "__main__":
    main()
