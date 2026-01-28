"""
Dori & Rito Email Automation - Configuration
=============================================
請將此檔案的 API tokens 替換為你自己的值，或使用環境變數
"""

import os

# Notion Configuration
NOTION_API_TOKEN = os.getenv("NOTION_API_TOKEN", "ntn_s64100311657oNxDFii2W8pPs9aLLR3vrbo2PtUnEUgbmw")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID", "2f117e11503d805987beebbe6f2fe216")
NOTION_API_VERSION = "2022-06-28"

# Telegram Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8321656314:AAHBb1fCSixexgnUQFK0S4X-Di8nh0fijRM")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")  # 需要先取得你的 chat_id

# Claude API Configuration (for Flow 2)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Skill file path
SKILL_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "dori-rito-copywriter-skill.md")
