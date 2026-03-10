"""
Dori & Rito IG 靈感日報 — Configuration
========================================
環境變數與系統常數設定
"""

import os

# 嘗試載入 .env 檔案（override=True 確保 .env 覆蓋系統既有的空值）
try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
except ImportError:
    pass  # python-dotenv 未安裝，使用系統環境變數

# ──────────────────────────────────────
# Telegram Configuration
# ──────────────────────────────────────
TELEGRAM_BOT_TOKEN = os.getenv("IG_DAILY_TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("IG_DAILY_TELEGRAM_CHAT_ID", "")

# ──────────────────────────────────────
# Anthropic Claude API
# ──────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = "claude-3-haiku-20240307"
CLAUDE_MAX_TOKENS = 4096

# ──────────────────────────────────────
# Apify Configuration (IG Scraping)
# ──────────────────────────────────────
APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN", "")
APIFY_MONTHLY_LIMIT = 1850       # 免費方案上限（約 $5 credit）
APIFY_REDUCE_THRESHOLD = 1500    # 超過此值自動降為 1 則/帳號
APIFY_STOP_THRESHOLD = 1800      # 超過此值停止抓取，使用快取
POSTS_PER_ACCOUNT = 2            # 每帳號每天抓取的貼文數

# ──────────────────────────────────────
# Notion Configuration
# ──────────────────────────────────────
NOTION_API_TOKEN = os.getenv("NOTION_API_TOKEN", "")
NOTION_API_VERSION = "2022-06-28"
ERIC_TASK_DB_ID = "31417e11503d80379f75d1ef1313094d"    # Database Page ID (not collection ID)
PENNEE_TASK_DB_ID = "31417e11503d802c8d2ed7a27cbba96e"  # Database Page ID (not collection ID)

# ──────────────────────────────────────
# Schedule Configuration
# ──────────────────────────────────────
TIMEZONE = "Asia/Taipei"
REPORT_HOUR = 7
REPORT_MINUTE = 0
HEALTH_REPORT_HOUR = 23
HEALTH_REPORT_MINUTE = 0

# ──────────────────────────────────────
# IG Accounts to Track (25 accounts)
# ──────────────────────────────────────
IG_ACCOUNTS = [
    "dynamitedogtraining",
    "ameliathedogtrainer",
    "theeverydaytrainer",
    "dogtrainingwithlaura",
    "empoweredpuppyprogram",
    "spiritdogtraining",
    "yourdogbehaviorist",
    "thegooddogyorktown",
    "realethansteinberg",
    "listendogtraining",
    "apex_dogtraining",
    "southenddogtraining",
    "jwdogtraining",
    "summit_homestead",
    "hamiltondogtraining",
    "brandk9dogtraining",
    "thepainfreepettrainer",
    "courtneydownesdogtrainer",
    "ayce.and.aria",
    "woof.wander.co",
    "adventurehoundsnc",
    "lizzysonoda.co",
    "waldrupsomaticmethod",
    "teamk9.training",
]

# ──────────────────────────────────────
# Paths
# ──────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PROMPTS_DIR = os.path.join(BASE_DIR, "prompts")
DB_PATH = os.path.join(DATA_DIR, "posts.db")

# 確保 data 目錄存在
os.makedirs(DATA_DIR, exist_ok=True)

# ──────────────────────────────────────
# Authorized Users (Telegram user IDs)
# ──────────────────────────────────────
_raw_auth = os.getenv("IG_DAILY_AUTHORIZED_USERS", "")
AUTHORIZED_USERS = [uid.strip() for uid in _raw_auth.split(",") if uid.strip()]

# ──────────────────────────────────────
# Brand Info (for AI prompts)
# ──────────────────────────────────────
BRAND_NAME = "Dori & Rito 專業訓犬服務"
CONSULTATION_FORM_URL = "https://tally.so/r/KY55Bg"
INSTAGRAM_HANDLE = "@dori.rito.happydays"

# ──────────────────────────────────────
# Report Configuration
# ──────────────────────────────────────
NUM_INSIGHTS = 10                # 每日靈感數量
TELEGRAM_MAX_LENGTH = 4000       # Telegram 訊息上限（留 96 字元 buffer）


def validate_config() -> bool:
    """驗證必要的設定是否已填寫"""
    missing = []
    if not TELEGRAM_BOT_TOKEN:
        missing.append("IG_DAILY_TELEGRAM_BOT_TOKEN")
    if not TELEGRAM_CHAT_ID:
        missing.append("IG_DAILY_TELEGRAM_CHAT_ID")
    if not ANTHROPIC_API_KEY:
        missing.append("ANTHROPIC_API_KEY")
    if not APIFY_API_TOKEN:
        missing.append("APIFY_API_TOKEN")
    if not NOTION_API_TOKEN:
        missing.append("NOTION_API_TOKEN")

    if missing:
        print("⚠️ 缺少以下環境變數：")
        for key in missing:
            print(f"   - {key}")
        print("\n請建立 .env 檔案或在 Railway 設定環境變數")
        print("參考 .env.example 檔案")
        return False
    return True


if __name__ == "__main__":
    validate_config()
