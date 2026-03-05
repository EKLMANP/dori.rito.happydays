"""
Dori & Rito - Daily Health Check Bot
=====================================
每日巡視所有自動化機器人、系統、網站的健康狀況，
透過 Telegram Bot「Dori & Rito 虛擬團隊回報」發送給 Eric。

監控項目（共 11 項）：
  ── 網站 & CMS ──
  1. Website (doriritohappydays.com) - Vercel 部署
  2. Ghost CMS (Zeabur) - Content API
  ── Railway 部署機器人 ──
  3. Email Copywriter Bot - Railway
  4. IG Inspiration Daily Bot - Railway
  5. Quotation Bot - Railway
  ── 本機服務 ──
  6. Telegram Commander Bot - 本機進程
  ── 第三方 API ──
  7. Anthropic Claude API - AI 引擎
  8. Notion API - 資料庫
  9. Kit (ConvertKit) API - 電子報
  10. Mailgun API - 郵件發送
  ── 手動確認 ──
  11. Google Apps Script (LINE 課程提醒) - 無法直接檢查

使用方式：
  python3 health_check.py          # 立即執行一次巡檢
  python3 health_check.py --cron   # 設定 launchd 每日 07:30 自動執行
  python3 health_check.py --remove # 移除自動排程
"""

import os
import re
import sys
import json
import subprocess
import time
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# ── 專案根目錄 ────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent  # Dori & Rito Happydays (Dog training)


# ── 載入 .env ─────────────────────────────────────────────────

def load_env(path: Path) -> dict:
    """簡易 .env 載入器"""
    env = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip()
    return env


# 各服務的 .env
COMMANDER_ENV = load_env(PROJECT_ROOT / "05-Tech" / "telegram-commander" / ".env")
WEBSITE_ENV = load_env(PROJECT_ROOT / "05-Tech" / "website" / ".env.local")
IG_DAILY_ENV = load_env(PROJECT_ROOT / "02-Marketing" / "ig-inspiration-daily" / ".env")
QUOTATION_ENV = load_env(PROJECT_ROOT / "01-Training" / "1-on-1-service" / "quotations" / ".env")
CONFIG_ENV = load_env(PROJECT_ROOT / ".config" / ".env")

# 共用 API Keys
TELEGRAM_BOT_TOKEN = COMMANDER_ENV.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = COMMANDER_ENV.get("TELEGRAM_CHAT_ID", "")
ANTHROPIC_API_KEY = COMMANDER_ENV.get("ANTHROPIC_API_KEY", "")
KIT_API_SECRET = COMMANDER_ENV.get("KIT_API_SECRET", "")

# Ghost CMS
GHOST_URL = WEBSITE_ENV.get("GHOST_URL", "")
GHOST_CONTENT_API_KEY = WEBSITE_ENV.get("GHOST_CONTENT_API_KEY", "")
MAILGUN_API_KEY = WEBSITE_ENV.get("MAILGUN_API_KEY", "")
MAILGUN_DOMAIN = WEBSITE_ENV.get("MAILGUN_DOMAIN", "")

# Railway Bots 的 Telegram Tokens（用來驗證 bot 是否存活）
IG_DAILY_BOT_TOKEN = IG_DAILY_ENV.get("IG_DAILY_TELEGRAM_BOT_TOKEN", "")
IG_DAILY_CHAT_ID = IG_DAILY_ENV.get("IG_DAILY_TELEGRAM_CHAT_ID", "")
QUOTATION_BOT_TOKEN = QUOTATION_ENV.get("TELEGRAM_BOT_TOKEN", "")
# Email bot 使用與 Commander 相同的 token，透過 Railway 部署狀態檢查

# IG Daily Bot 依賴
APIFY_API_TOKEN = IG_DAILY_ENV.get("APIFY_API_TOKEN", "")

# Notion tokens
NOTION_TOKEN_AR = CONFIG_ENV.get("NOTION_TOKEN_Dori&Rito_AR_update", "")
NOTION_TOKEN_EMAIL = CONFIG_ENV.get("NOTION_TOKEN_Dori & Rito_Email copywriter",
                     CONFIG_ENV.get("NOTION_TOKEN_Dori&Rito_Emailcopywriter", ""))

WEBSITE_URL = "https://doriritohappydays.com"


# ── HTTP helpers ───────────────────────────────────────────────

def http_get(url: str, headers: dict = None, timeout: int = 15) -> tuple:
    """發送 GET 請求，回傳 (status_code, body_or_error)"""
    req = Request(url, headers=headers or {})
    try:
        resp = urlopen(req, timeout=timeout)
        body = resp.read().decode("utf-8", errors="replace")
        return resp.status, body
    except HTTPError as e:
        return e.code, str(e)
    except URLError as e:
        return 0, str(e.reason)
    except Exception as e:
        return 0, str(e)


def http_post(url: str, data: dict = None, headers: dict = None, timeout: int = 15) -> tuple:
    """發送 POST 請求"""
    req_data = json.dumps(data).encode("utf-8") if data else None
    hdrs = {"Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)
    req = Request(url, data=req_data, headers=hdrs, method="POST")
    try:
        resp = urlopen(req, timeout=timeout)
        body = resp.read().decode("utf-8", errors="replace")
        return resp.status, body
    except HTTPError as e:
        return e.code, str(e)
    except URLError as e:
        return 0, str(e.reason)
    except Exception as e:
        return 0, str(e)


def check_telegram_bot_alive(token: str) -> tuple:
    """檢查 Telegram Bot Token 是否有效，回傳 (ok, bot_username)"""
    if not token:
        return False, "缺少 Token"
    url = f"https://api.telegram.org/bot{token}/getMe"
    status, body = http_get(url)
    if status == 200:
        data = json.loads(body)
        if data.get("ok"):
            return True, data["result"].get("username", "unknown")
    return False, f"HTTP {status}"


# ── Health Check 項目 ──────────────────────────────────────────

class CheckResult:
    def __init__(self, name: str, emoji: str, ok: bool, detail: str, fix_hint: str = ""):
        self.name = name
        self.emoji = emoji
        self.ok = ok
        self.detail = detail
        self.fix_hint = fix_hint


# ─── 網站 & CMS ───

def check_website() -> CheckResult:
    """檢查主網站 doriritohappydays.com (Vercel)"""
    status, body = http_get(WEBSITE_URL)
    if 200 <= status < 400:
        return CheckResult("Website (Vercel)", "🌐", True, f"HTTP {status} OK")
    return CheckResult(
        "Website (Vercel)", "🌐", False,
        f"HTTP {status}",
        "檢查 Vercel Dashboard: vercel.com/dashboard"
    )


def check_ghost_cms() -> CheckResult:
    """檢查 Ghost CMS (Zeabur)"""
    if not GHOST_URL or not GHOST_CONTENT_API_KEY:
        return CheckResult("Ghost CMS (Zeabur)", "👻", False, "缺少設定")

    url = f"{GHOST_URL}/ghost/api/content/settings/?key={GHOST_CONTENT_API_KEY}"
    status, body = http_get(url)
    if status == 200:
        return CheckResult("Ghost CMS (Zeabur)", "👻", True, "Content API 正常")
    return CheckResult(
        "Ghost CMS (Zeabur)", "👻", False,
        f"HTTP {status}",
        "檢查 Zeabur Dashboard 的 Ghost 服務"
    )


# ─── Railway 部署機器人 ───

def check_email_copywriter_bot() -> CheckResult:
    """檢查 Email Copywriter Bot (Railway)"""
    # 此 bot 使用與 Commander 相同的 Telegram Bot Token
    # 改用 Telegram getUpdates 確認 bot 可回應
    ok, info = check_telegram_bot_alive(TELEGRAM_BOT_TOKEN)
    if ok:
        return CheckResult("Email Copywriter Bot (Railway)", "✍️", True, f"@{info} Bot API 正常")
    return CheckResult(
        "Email Copywriter Bot (Railway)", "✍️", False,
        f"Bot API 異常: {info}",
        "檢查 Railway Dashboard: railway.app/dashboard"
    )


def check_ig_daily_bot() -> list:
    """檢查 IG Inspiration Daily Bot 完整運行狀況（回傳多項結果）"""
    results = []

    # 1. Telegram Bot Token
    ok, info = check_telegram_bot_alive(IG_DAILY_BOT_TOKEN)
    if ok:
        results.append(CheckResult("IG Daily Bot API", "📸", True, f"@{info} Token 正常"))
    else:
        results.append(CheckResult("IG Daily Bot API", "📸", False,
                                   f"Bot Token 異常: {info}",
                                   "檢查 IG_DAILY_TELEGRAM_BOT_TOKEN"))

    # 2. Bot 活躍度 — 檢查最近是否有發送訊息到群組
    if ok and IG_DAILY_CHAT_ID:
        activity = _check_ig_bot_activity()
        results.append(activity)

    # 3. Apify API（IG 抓取引擎）
    results.append(_check_apify_api())

    return results


def _check_ig_bot_activity() -> CheckResult:
    """檢查 IG Daily Bot 是否有在活躍運作（最近有無推送訊息到群組）"""
    if not IG_DAILY_BOT_TOKEN or not IG_DAILY_CHAT_ID:
        return CheckResult("IG Daily 活躍度", "📡", False, "缺少 Token 或 Chat ID")

    # 用 getChat 確認 bot 能存取目標群組
    url = f"https://api.telegram.org/bot{IG_DAILY_BOT_TOKEN}/getChat"
    status, body = http_post(url, data={"chat_id": IG_DAILY_CHAT_ID})
    if status == 200:
        try:
            data = json.loads(body)
            if data.get("ok"):
                title = data["result"].get("title", data["result"].get("first_name", ""))
                return CheckResult("IG Daily 活躍度", "📡", True,
                                   f"群組連線正常: {title}")
        except json.JSONDecodeError:
            pass
    if status == 403:
        return CheckResult("IG Daily 活躍度", "📡", False,
                           "Bot 被踢出群組或無權限",
                           "將 @IG_DailyInspiration_bot 重新加入群組")
    return CheckResult("IG Daily 活躍度", "📡", False,
                       f"群組存取失敗 (HTTP {status})",
                       "檢查 IG_DAILY_TELEGRAM_CHAT_ID 設定")


def _check_apify_api() -> CheckResult:
    """檢查 Apify API（IG Daily Bot 的抓取引擎）"""
    if not APIFY_API_TOKEN:
        return CheckResult("Apify (IG 抓取)", "🕷️", False, "缺少 APIFY_API_TOKEN")

    url = f"https://api.apify.com/v2/users/me?token={APIFY_API_TOKEN}"
    status, body = http_get(url)
    if status == 200:
        try:
            data = json.loads(body).get("data", {})
            plan = data.get("plan", {}).get("id", "unknown")
            # 檢查月用量
            usage_url = f"https://api.apify.com/v2/users/me/usage/monthly?token={APIFY_API_TOKEN}"
            u_status, u_body = http_get(usage_url)
            usage_info = ""
            if u_status == 200:
                try:
                    u_data = json.loads(u_body).get("data", {})
                    usd_used = u_data.get("usageUsd", 0)
                    usd_limit = u_data.get("usageLimitUsd", 5)
                    pct = (usd_used / usd_limit * 100) if usd_limit > 0 else 0
                    usage_info = f" | 月用量 ${usd_used:.2f}/${usd_limit} ({pct:.0f}%)"
                    if pct > 90:
                        return CheckResult("Apify (IG 抓取)", "🕷️", False,
                                           f"月用量即將超限: ${usd_used:.2f}/${usd_limit} ({pct:.0f}%)",
                                           "考慮減少抓取頻率或升級方案")
                except (json.JSONDecodeError, KeyError):
                    pass
            return CheckResult("Apify (IG 抓取)", "🕷️", True,
                               f"API 正常 (方案: {plan}){usage_info}")
        except (json.JSONDecodeError, KeyError):
            return CheckResult("Apify (IG 抓取)", "🕷️", True, "API 正常回應")
    if status == 401:
        return CheckResult("Apify (IG 抓取)", "🕷️", False, "Token 無效/過期",
                           "到 apify.com 重新取得 API Token")
    return CheckResult("Apify (IG 抓取)", "🕷️", False, f"HTTP {status}",
                       "檢查 Apify Dashboard")


def check_quotation_bot() -> CheckResult:
    """檢查 Quotation Bot (Railway)"""
    ok, info = check_telegram_bot_alive(QUOTATION_BOT_TOKEN)
    if ok:
        return CheckResult("Quotation Bot (Railway)", "📄", True, f"@{info} Bot API 正常")
    return CheckResult(
        "Quotation Bot (Railway)", "📄", False,
        f"Bot API 異常: {info}",
        "檢查 Railway Dashboard: railway.app/dashboard"
    )


# ─── 本機服務 ───

def check_commander_process() -> CheckResult:
    """檢查 Telegram Commander Bot 是否在本機運行"""
    try:
        result = subprocess.run(
            ["pgrep", "-f", "commander_bot.py"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            pids = result.stdout.strip().split("\n")
            return CheckResult("Commander Bot (本機)", "⚙️", True, f"PID: {', '.join(pids)}")
        return CheckResult(
            "Commander Bot (本機)", "⚙️", False,
            "未偵測到進程",
            "cd telegram-commander && python3 commander_bot.py"
        )
    except Exception as e:
        return CheckResult("Commander Bot (本機)", "⚙️", False, f"檢查失敗: {e}")


# ─── 第三方 API ───

def check_anthropic_api() -> CheckResult:
    """檢查 Anthropic Claude API"""
    if not ANTHROPIC_API_KEY:
        return CheckResult("Anthropic Claude", "🧠", False, "缺少 API Key")

    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    data = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 5,
        "messages": [{"role": "user", "content": "ping"}],
    }
    status, body = http_post(url, data=data, headers=headers)
    if status == 200:
        return CheckResult("Anthropic Claude", "🧠", True, "API 正常")
    if status == 401:
        return CheckResult("Anthropic Claude", "🧠", False, "API Key 無效/過期",
                           "console.anthropic.com 重新產生")
    if status == 429:
        return CheckResult("Anthropic Claude", "🧠", True, "API 可達 (速率限制中)")
    return CheckResult("Anthropic Claude", "🧠", False, f"HTTP {status}",
                       "檢查 API Key 和帳戶額度")


def check_notion_api() -> CheckResult:
    """檢查 Notion API 連線"""
    token = NOTION_TOKEN_AR or NOTION_TOKEN_EMAIL
    if not token:
        return CheckResult("Notion API", "📋", False, "缺少 NOTION_TOKEN")

    url = "https://api.notion.com/v1/users/me"
    headers = {
        "Authorization": f"Bearer {token}",
        "Notion-Version": "2022-06-28",
    }
    status, body = http_get(url, headers=headers)
    if status == 200:
        try:
            data = json.loads(body)
            name = data.get("name", "OK")
            return CheckResult("Notion API", "📋", True, f"連線正常 ({name})")
        except json.JSONDecodeError:
            return CheckResult("Notion API", "📋", True, "API 正常回應")
    if status == 401:
        return CheckResult("Notion API", "📋", False, "Token 無效/過期",
                           "到 Notion Integrations 重新取得 Token")
    return CheckResult("Notion API", "📋", False, f"HTTP {status}",
                       "檢查 Notion Integration 設定")


def check_kit_api() -> CheckResult:
    """檢查 Kit (ConvertKit) API"""
    if not KIT_API_SECRET:
        return CheckResult("Kit Newsletter", "📧", False, "缺少 KIT_API_SECRET")

    url = f"https://api.convertkit.com/v3/account?api_secret={KIT_API_SECRET}"
    status, body = http_get(url)
    if status == 200:
        try:
            data = json.loads(body)
            name = data.get("name", "OK")
            return CheckResult("Kit Newsletter", "📧", True, f"帳戶: {name}")
        except json.JSONDecodeError:
            return CheckResult("Kit Newsletter", "📧", True, "API 正常")
    return CheckResult("Kit Newsletter", "📧", False, f"HTTP {status}",
                       "kit.com > Settings > Advanced 重新取得 API Secret")


def check_mailgun_api() -> CheckResult:
    """檢查 Mailgun API"""
    if not MAILGUN_API_KEY or not MAILGUN_DOMAIN:
        return CheckResult("Mailgun", "📬", False, "缺少 API Key 或 Domain")

    # Mailgun 使用 Basic Auth
    import base64
    auth = base64.b64encode(f"api:{MAILGUN_API_KEY}".encode()).decode()
    url = f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/stats/total?event=delivered&duration=1m"
    headers = {"Authorization": f"Basic {auth}"}
    status, body = http_get(url, headers=headers)
    if status == 200:
        return CheckResult("Mailgun", "📬", True, "API 正常")
    if status == 401:
        return CheckResult("Mailgun", "📬", False, "API Key 無效",
                           "到 Mailgun Dashboard 檢查 API Key")
    return CheckResult("Mailgun", "📬", False, f"HTTP {status}",
                       "檢查 Mailgun Dashboard")


# ─── 手動確認 ───

def check_google_apps_script() -> CheckResult:
    """Google Apps Script 無法直接檢查"""
    return CheckResult(
        "GAS LINE 課程提醒", "📅", True,
        "需手動確認 (無外部 API)\n   -> 檢查 LINE 群組是否收到昨天的提醒"
    )


# ── 報告產生 ───────────────────────────────────────────────────

def run_all_checks() -> tuple:
    """執行所有健康檢查，回傳 (results, section_assignments)"""
    # 每項檢查可回傳單個 CheckResult 或 list[CheckResult]
    # section_id: 0=網站&CMS, 1=Railway機器人, 2=本機服務, 3=第三方API, 4=手動確認
    check_plan = [
        # (check_fn, section_id)
        (check_website, 0),
        (check_ghost_cms, 0),
        (check_email_copywriter_bot, 1),
        (check_ig_daily_bot, 1),        # 回傳 list（多項檢查）
        (check_quotation_bot, 1),
        (check_commander_process, 2),
        (check_anthropic_api, 3),
        (check_notion_api, 3),
        (check_kit_api, 3),
        (check_mailgun_api, 3),
        (check_google_apps_script, 4),
    ]

    results = []
    section_ids = []

    for check_fn, sec_id in check_plan:
        try:
            outcome = check_fn()
            if isinstance(outcome, list):
                for r in outcome:
                    results.append(r)
                    section_ids.append(sec_id)
            else:
                results.append(outcome)
                section_ids.append(sec_id)
        except Exception as e:
            results.append(CheckResult(
                check_fn.__name__.replace("check_", ""),
                "❓", False, f"例外: {e}"
            ))
            section_ids.append(sec_id)

    return results, section_ids


def format_report(results: list, section_ids: list) -> str:
    """產生 Telegram 報告訊息（HTML 格式）"""
    now = datetime.now().strftime("%Y/%m/%d %H:%M")
    total = len(results)
    ok_count = sum(1 for r in results if r.ok)
    fail_count = total - ok_count

    if fail_count == 0:
        header = f"✅ <b>每日巡檢報告</b>  {now}\n全部 {total} 項服務正常運作"
    else:
        header = f"🚨 <b>每日巡檢報告</b>  {now}\n⚠️ {fail_count}/{total} 項服務異常"

    section_names = [
        "網站 &amp; CMS",
        "Railway 機器人",
        "本機服務",
        "第三方 API",
        "手動確認",
    ]
    sections = {name: [] for name in section_names}

    for i, r in enumerate(results):
        sec_name = section_names[section_ids[i]] if i < len(section_ids) else section_names[-1]
        status = "✅" if r.ok else "❌"
        line = f"  {r.emoji} {status} <b>{r.name}</b>\n      {r.detail}"
        if not r.ok and r.fix_hint:
            line += f"\n      💡 {r.fix_hint}"
        sections[sec_name].append(line)

    lines = [header, ""]
    for sec_name, items in sections.items():
        if items:
            lines.append(f"<b>[ {sec_name} ]</b>")
            lines.extend(items)
            lines.append("")

    if fail_count > 0:
        lines.append("📌 <b>需處理：</b>")
        for r in results:
            if not r.ok:
                lines.append(f"  • {r.emoji} {r.name}")
    else:
        lines.append("🎉 所有系統正常運作！")

    return "\n".join(lines)


# ── Telegram 發送 ─────────────────────────────────────────────

def send_telegram(text: str) -> bool:
    """透過 Telegram Bot「Dori & Rito 虛擬團隊回報」發送訊息給 Eric"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("缺少 TELEGRAM_BOT_TOKEN 或 TELEGRAM_CHAT_ID")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    limit = 4000
    chunks = [text[i:i+limit] for i in range(0, len(text), limit)]

    for chunk in chunks:
        data = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": chunk,
            "parse_mode": "HTML",
        }
        status, body = http_post(url, data=data)
        if status != 200:
            print(f"Telegram HTML 發送失敗 (HTTP {status})，改用純文字...")
            data.pop("parse_mode", None)
            data["text"] = re.sub(r"<[^>]+>", "", chunk)
            status2, _ = http_post(url, data=data)
            if status2 != 200:
                print(f"純文字也失敗: HTTP {status2}")
                return False
        time.sleep(0.3)
    return True


# ── launchd 排程設定 ──────────────────────────────────────────

PLIST_LABEL = "com.doririto.healthcheck"
PLIST_PATH = Path.home() / "Library" / "LaunchAgents" / f"{PLIST_LABEL}.plist"


def setup_cron():
    """設定 macOS launchd 每日 07:30 自動巡檢"""
    python_path = sys.executable
    script_path = str(Path(__file__).resolve())
    log_path = str(Path(__file__).parent / "health_check.log")

    plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>{PLIST_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>{python_path}</string>
        <string>{script_path}</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>7</integer>
        <key>Minute</key>
        <integer>30</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>{log_path}</string>
    <key>StandardErrorPath</key>
    <string>{log_path}</string>
    <key>WorkingDirectory</key>
    <string>{str(Path(__file__).parent.resolve())}</string>
</dict>
</plist>"""

    PLIST_PATH.parent.mkdir(parents=True, exist_ok=True)
    PLIST_PATH.write_text(plist_content)

    # 卸載舊的再載入新的
    subprocess.run(["launchctl", "bootout", f"gui/{os.getuid()}", str(PLIST_PATH)],
                   capture_output=True)
    result = subprocess.run(
        ["launchctl", "bootstrap", f"gui/{os.getuid()}", str(PLIST_PATH)],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        print(f"✅ 已設定每日 07:30 自動巡檢")
        print(f"   排程檔案: {PLIST_PATH}")
        print(f"   Log 檔案: {log_path}")
        print(f"\n   手動測試: python3 \"{script_path}\"")
        print(f"   取消排程: python3 \"{script_path}\" --remove")
    else:
        print(f"❌ 排程設定失敗: {result.stderr}")


def remove_cron():
    """移除自動巡檢排程"""
    subprocess.run(["launchctl", "bootout", f"gui/{os.getuid()}", str(PLIST_PATH)],
                   capture_output=True)
    if PLIST_PATH.exists():
        PLIST_PATH.unlink()
        print(f"✅ 已移除排程: {PLIST_PATH}")
    else:
        print("排程檔案不存在，無需移除")


# ── 主程式 ─────────────────────────────────────────────────────

def main():
    if "--cron" in sys.argv:
        setup_cron()
        return
    if "--remove" in sys.argv:
        remove_cron()
        return

    print("🔍 Dori & Rito — 每日服務巡檢中...\n")

    results, section_ids = run_all_checks()
    report = format_report(results, section_ids)

    # 印到終端（去掉 HTML tags）
    plain = re.sub(r"<[^>]+>", "", report).replace("&amp;", "&")
    print(plain)

    # 發送 Telegram
    print("\n📱 發送 Telegram 報告...")
    if send_telegram(report):
        print("✅ 已發送至 Telegram")
    else:
        print("⚠️ Telegram 發送失敗")


if __name__ == "__main__":
    main()
