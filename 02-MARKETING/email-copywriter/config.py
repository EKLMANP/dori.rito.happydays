"""
Dori & Rito Email Automation - Configuration
=============================================
請建立 .env 檔案並填入你的 API keys，或直接設定環境變數
"""

import os

# 嘗試載入 .env 檔案
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv 未安裝，使用系統環境變數

# Notion Configuration
NOTION_API_TOKEN = os.getenv("NOTION_API_TOKEN", "")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID", "2f117e11503d805987beebbe6f2fe216")
NOTION_API_VERSION = "2022-06-28"

# Notion Quotation Configuration (客戶管理 database)
NOTION_QUOTATION_TOKEN = os.getenv("NOTION_QUOTATION_TOKEN", "")
NOTION_CUSTOMER_DATABASE_ID = os.getenv("NOTION_CUSTOMER_DATABASE_ID", "22a17e11503d80eea2b5ccbe69a16c59")

# Telegram Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# Claude API Configuration (for Flow 2)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Skill file paths
SKILL_FILE_PATH = os.path.join(os.path.dirname(__file__), "dori-rito-copywriter-skill.md")
# QUOTATION_SKILL_PATH is not needed here anymore but leaving it blank or ignoring



def validate_config():
    """驗證必要的設定是否已填寫"""
    missing = []
    if not NOTION_API_TOKEN:
        missing.append("NOTION_API_TOKEN")
    if not TELEGRAM_BOT_TOKEN:
        missing.append("TELEGRAM_BOT_TOKEN")
    if not TELEGRAM_CHAT_ID:
        missing.append("TELEGRAM_CHAT_ID")
    if not ANTHROPIC_API_KEY:
        missing.append("ANTHROPIC_API_KEY")

    if missing:
        print("⚠️ 缺少以下設定：")
        for key in missing:
            print(f"   - {key}")
        print("\n請建立 .env 檔案或設定環境變數")
        print("參考 .env.example 檔案")
        return False
    return True


if __name__ == "__main__":
    validate_config()
