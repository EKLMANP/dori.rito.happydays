"""
Dori & Rito IG 靈感日報 — Main Bot
===================================
主程式：排程每日靈感日報 + Telegram Bot 訊息輪詢

功能：
1. 每天早上 7:00（台北時間）自動產生並推送靈感日報
2. 每天晚上 23:00 推送系統健康報告
3. 監聽 Telegram 群組訊息，處理待辦任務指令
4. 支援 /start, /help, /status, /report 指令
"""

import os
import sys
import time
import signal
import logging
import threading
from datetime import datetime, timedelta

import schedule
import pytz

from config import (
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
    ANTHROPIC_API_KEY,
    APIFY_API_TOKEN,
    NOTION_API_TOKEN,
    IG_ACCOUNTS,
    REPORT_HOUR,
    REPORT_MINUTE,
    HEALTH_REPORT_HOUR,
    HEALTH_REPORT_MINUTE,
    TIMEZONE,
    APIFY_MONTHLY_LIMIT,
    NUM_INSIGHTS,
    AUTHORIZED_USERS,
    validate_config,
)
from telegram_client import TelegramClient
from ig_scraper import IGScraper
from ai_analyzer import AIAnalyzer
from report_formatter import ReportFormatter
from notion_client import NotionTaskClient
from task_parser import parse_task_command
from data_store import DataStore

# ──────────────────────────────────────
# Logging
# ──────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("ig-daily-bot")


class IGInspirationBot:
    """IG 靈感日報 Bot — 主控類別"""

    def __init__(self):
        self.telegram = TelegramClient(TELEGRAM_BOT_TOKEN)
        self.data_store = DataStore()
        self.scraper = IGScraper(APIFY_API_TOKEN, self.data_store)
        self.analyzer = AIAnalyzer(ANTHROPIC_API_KEY)
        self.formatter = ReportFormatter()
        self.notion = NotionTaskClient(NOTION_API_TOKEN)

        self.tz = pytz.timezone(TIMEZONE)
        self.last_update_id = 0
        self.running = True
        self.daily_errors = 0
        self.daily_tasks_created = 0

        # Concurrency guard for report generation
        self._report_lock = threading.Lock()

        # Graceful shutdown
        signal.signal(signal.SIGINT, self._shutdown)
        signal.signal(signal.SIGTERM, self._shutdown)

    def _shutdown(self, signum, frame):
        """優雅關閉"""
        logger.info("收到關閉信號，正在停止...")
        self.running = False

    def _is_authorized(self, user_id: str) -> bool:
        """檢查使用者是否有權限執行特權指令

        若 AUTHORIZED_USERS 為空（未設定），則允許所有人（向下相容）。
        """
        if not AUTHORIZED_USERS:
            return True
        return str(user_id) in AUTHORIZED_USERS

    # ──────────────────────────────────────
    # Daily Report Generation
    # ──────────────────────────────────────

    def generate_daily_report(self, notify_chat_id: str = ""):
        """
        產生並推送每日靈感日報
        此方法由排程器或 /report 指令觸發（可能在 daemon thread 中執行）

        Args:
            notify_chat_id: 若由 /report 觸發，傳入使用者 chat_id 以回覆進度
        """
        acquired = self._report_lock.acquire(blocking=False)
        if not acquired:
            logger.warning("報告產生中，跳過重複觸發")
            if notify_chat_id:
                self.telegram.send_message(
                    "⏳ 報告正在產生中，請稍候...", notify_chat_id
                )
            return

        try:
            logger.info("=" * 60)
            logger.info("開始產生每日靈感日報...")
            logger.info("=" * 60)

            # Check if report was already sent today (crash recovery)
            if self.data_store.is_report_sent_today():
                logger.info("今日報告已送出，跳過")
                return

            now = datetime.now(self.tz)
            date_str = now.strftime("%Y/%m/%d")
            report_date = now.strftime("%Y-%m-%d")  # 鎖定日期，避免跨日後 record_report_sent 記錯日

            # Step 1: Scrape IG posts
            logger.info("Step 1/4: 抓取 IG 貼文...")
            posts = self.scraper.fetch_latest_posts()
            logger.info(f"抓取完成：{len(posts)} 則新貼文")

            if not posts:
                logger.warning("今日無新貼文，使用最近快取資料")
                posts = self.data_store.get_recent_posts(days=1)
                if not posts:
                    msg = self.formatter.format_error_report(
                        "今日未抓取到任何新貼文，且無快取資料可用。"
                    )
                    self.telegram.send_message(msg, TELEGRAM_CHAT_ID)
                    return

            # Step 2: AI Analysis
            logger.info("Step 2/4: AI 分析中...")
            accounts = set(p["account"] for p in posts)
            ai_output = self.analyzer.analyze_posts(posts, date_str)

            if not ai_output:
                msg = self.formatter.format_error_report("AI 分析失敗，無法產出靈感報告。")
                self.telegram.send_message(msg, TELEGRAM_CHAT_ID)
                self.daily_errors += 1
                return

            # Step 3: Format report
            logger.info("Step 3/4: 格式化報告...")
            report = self.formatter.format_daily_report(
                ai_output=ai_output,
                date_str=date_str,
                posts_count=len(posts),
                accounts_count=len(accounts),
            )

            # Step 4: Send to Telegram
            logger.info("Step 4/4: 傳送到 Telegram...")
            # parse_mode="" = plain text: AI output uses Markdown syntax that Telegram
            # HTML mode cannot safely render (AI may output <,> chars that Telegram's
            # HTML parser silently swallows, causing entire insight sections to vanish)
            results = self.telegram.send_long_message(report, TELEGRAM_CHAT_ID, parse_mode="")

            success = all(r.get("success") for r in results)
            if success:
                self.data_store.record_report_sent(
                    insights_count=NUM_INSIGHTS,
                    accounts_scraped=len(accounts),
                    report_date=report_date,
                )
                logger.info("✅ 每日靈感日報傳送成功！")
            else:
                self.daily_errors += 1
                logger.error("❌ 部分訊息傳送失敗")

        except Exception as e:
            self.daily_errors += 1
            logger.exception(f"產生日報時發生錯誤: {e}")
            try:
                msg = self.formatter.format_error_report(f"產生日報錯誤：{str(e)[:200]}")
                self.telegram.send_message(msg, TELEGRAM_CHAT_ID)
            except Exception:
                logger.exception("傳送錯誤通知也失敗了")
        finally:
            self._report_lock.release()

    def send_health_report(self):
        """推送每日系統健康報告（23:00）"""
        try:
            apify_usage = self.data_store.get_monthly_usage()
            report = self.formatter.format_health_report(
                accounts_success=len(IG_ACCOUNTS),  # TODO: track actual success count
                accounts_total=len(IG_ACCOUNTS),
                insights_count=NUM_INSIGHTS,
                apify_usage=apify_usage,
                apify_limit=APIFY_MONTHLY_LIMIT,
                tasks_created=self.daily_tasks_created,
                errors=self.daily_errors,
            )
            self.telegram.send_message(report, TELEGRAM_CHAT_ID)

            # Reset daily counters
            self.daily_errors = 0
            self.daily_tasks_created = 0
            logger.info("健康報告已送出")

        except Exception as e:
            logger.exception(f"健康報告發送失敗: {e}")

    # ──────────────────────────────────────
    # Startup Recovery
    # ──────────────────────────────────────

    def check_missed_report(self):
        """啟動時檢查是否錯過今天的報告（以台北時間的 scrape 時間為基準）"""
        now = datetime.now(self.tz)

        # 深夜（22:00 後）不補送：避免抓取過程跨日導致日期混亂
        # 例：23:50 啟動，抓取花 20 分鐘，00:10 記錄成「明天」的報告，
        # 導致今天 07:00 的排程被跳過。
        if now.hour >= 22:
            logger.info(
                f"啟動時間 {now.strftime('%H:%M')} 台北超過 22:00，"
                "跳過補送檢查（等候隔日 07:00 排程）"
            )
            return

        # 使用排程的 scrape 時間（06:50 台北）作為基準，而非目標送達時間（07:00）
        scrape_tw_hour = REPORT_HOUR if REPORT_MINUTE >= 10 else REPORT_HOUR - 1
        scrape_tw_minute = (REPORT_MINUTE - 10) % 60
        scheduled_time = now.replace(
            hour=scrape_tw_hour, minute=scrape_tw_minute, second=0, microsecond=0
        )

        if now >= scheduled_time and not self.data_store.is_report_sent_today():
            logger.warning("偵測到今日報告未送出，立即產生...")
            self.generate_daily_report()

    # ──────────────────────────────────────
    # Message Handling
    # ──────────────────────────────────────

    def handle_message(self, message: dict):
        """處理收到的 Telegram 訊息"""
        text = message.get("text", "")
        chat_id = str(message.get("chat", {}).get("id", ""))
        user = message.get("from", {})
        user_id = str(user.get("id", ""))
        username = user.get("username", user.get("first_name", "Unknown"))

        if not text:
            return

        logger.info(f"收到訊息 from @{username} (uid:{user_id}): {text[:50]}...")

        # Commands
        if text.startswith("/"):
            self._handle_command(text, chat_id, username, user_id)
            return

        # Task commands (requires authorization)
        task = parse_task_command(text)
        if task:
            if not self._is_authorized(user_id):
                logger.warning(f"未授權的任務建立嘗試：uid={user_id} @{username}")
                self.telegram.send_message(
                    "⛔ 你沒有權限建立任務。請聯繫管理員。", chat_id
                )
                return
            self._handle_task(task, chat_id)
            return

    def _handle_command(self, text: str, chat_id: str, username: str, user_id: str = ""):
        """處理 Bot 指令"""
        command = text.split()[0].lower().split("@")[0]  # Handle /command@botname

        if command == "/start":
            self.telegram.send_message(
                "👋 歡迎使用 IG 靈感日報 Bot！\n\n"
                "📝 每天早上 7:00 自動推送訓犬 IG 內容靈感\n\n"
                "📌 指令列表：\n"
                "/report — 立即產生靈感日報\n"
                "/status — 查看系統狀態\n"
                "/help — 查看使用說明\n\n"
                "💡 代辦任務：\n"
                "輸入「Eric代辦任務：{描述}」或「Pennee代辦任務：{描述}」\n"
                "即可自動建立 Notion 任務\n"
                "（支援一次輸入多筆：1. xxx\\n2. xxx）",
                chat_id,
            )

        elif command == "/help":
            self.telegram.send_message(
                "📖 IG 靈感日報使用說明\n\n"
                "🔄 自動功能：\n"
                "• 每天 07:00 推送 10 則內容靈感\n"
                "• 每天 23:00 推送系統健康報告\n\n"
                "📌 指令：\n"
                "/report — 手動觸發靈感日報\n"
                "/status — 系統運行狀態\n"
                "/help — 本說明\n\n"
                "📝 建立任務：\n"
                "Eric代辦任務：{任務描述}\n"
                "Pennee代辦任務：{任務描述}\n\n"
                "一次多筆：\n"
                "Eric代辦任務：\n"
                "1. 任務A\n"
                "2. 任務B\n\n"
                f"👥 追蹤帳號數：{len(IG_ACCOUNTS)} 個",
                chat_id,
            )

        elif command == "/status":
            apify_usage = self.data_store.get_monthly_usage()
            is_sent = self.data_store.is_report_sent_today()
            status = self.formatter.format_status(
                is_running=self.running,
                last_report_date="今日已送出" if is_sent else "今日尚未送出",
                apify_usage=apify_usage,
                apify_limit=APIFY_MONTHLY_LIMIT,
                accounts_count=len(IG_ACCOUNTS),
            )
            self.telegram.send_message(status, chat_id)

        elif command == "/report":
            if not self._is_authorized(user_id):
                logger.warning(f"未授權的 /report 嘗試：uid={user_id} @{username}")
                self.telegram.send_message(
                    "⛔ 你沒有權限觸發報告。請聯繫管理員。", chat_id
                )
                return
            self.telegram.send_message("⏳ 正在產生靈感日報，請稍候...", chat_id)
            # Run in a thread so it doesn't block polling
            thread = threading.Thread(
                target=self.generate_daily_report,
                args=(chat_id,),
                daemon=True,
            )
            thread.start()

        else:
            pass  # Ignore unknown commands

    def _handle_task(self, task: dict, chat_id: str):
        """處理待辦任務建立（支援多任務、建立中狀態、自動重試）"""
        owner = task["owner"]
        tasks = task["tasks"]        # list[str] — one or more task descriptions
        owner_display = "Eric" if owner == "eric" else "Pennee"
        count = len(tasks)

        # ① Immediate acknowledgment — send "建立中" before any API calls
        ack = (
            f"⏳ 正在為 {owner_display} 建立 {count} 筆任務，請稍候..."
            if count > 1
            else f"⏳ 正在為 {owner_display} 建立任務，請稍候..."
        )
        self.telegram.send_message(ack, chat_id)
        logger.info(f"開始建立 {owner_display} 的 {count} 筆任務...")

        # ② Process each task
        results = []
        for raw_text in tasks:
            try:
                logger.info(f"解析任務：{raw_text[:60]}...")
                parsed = self.analyzer.extract_task(raw_text)
                result = self.notion.create_task(
                    owner=owner,
                    topic=parsed["topic"],
                    description=parsed["description"],
                    category=parsed.get("category", "行銷"),
                    priority=parsed.get("priority", "Medium"),
                )
                results.append({"raw": raw_text, "parsed": parsed, "result": result})
            except Exception as e:
                logger.exception(f"任務處理失敗：{raw_text[:60]}")
                results.append({
                    "raw": raw_text,
                    "parsed": {"topic": raw_text[:30]},
                    "result": {"success": False, "url": "", "error": str(e)[:200], "retried": False},
                })

        # ③ Build reply based on outcomes
        success_items = [r for r in results if r["result"]["success"]]
        fail_items = [r for r in results if not r["result"]["success"]]
        any_retried = any(r["result"].get("retried") for r in success_items)

        if not fail_items:
            # ── All succeeded ─────────────────────────────────────
            if any_retried:
                # Recovered from transient error via retry
                header = f"🔧 已修復問題，可以重新開始建立代辦任務\n"
            else:
                header = ""

            if count == 1:
                r = success_items[0]
                msg = header + self.formatter.format_task_confirmation(
                    owner=owner_display,
                    topic=r["parsed"]["topic"],
                    notion_url=r["result"].get("url", ""),
                )
            else:
                lines = [header + f"✅ 已為 {owner_display} 建立 {count} 筆任務："]
                for r in success_items:
                    topic = r["parsed"]["topic"]
                    url = r["result"].get("url", "")
                    lines.append(f"• {topic}")
                    if url:
                        lines.append(f"  🔗 {url}")
                msg = "\n".join(lines)

            self.daily_tasks_created += len(success_items)

        elif not success_items:
            # ── All failed ────────────────────────────────────────
            errors = [r["result"].get("error", "未知錯誤") for r in fail_items]
            unique_errors = list(dict.fromkeys(errors))
            was_retried = any(r["result"].get("retried") for r in fail_items)

            if count == 1:
                msg = self.formatter.format_task_error(
                    owner=owner_display, error=unique_errors[0]
                )
            else:
                lines = [f"❌ 為 {owner_display} 建立任務失敗（{count} 筆）"]
                for r in fail_items:
                    lines.append(f"• {r['parsed']['topic']}：{r['result'].get('error', '未知錯誤')}")
                msg = "\n".join(lines)

            if was_retried:
                msg += "\n\n⚠️ 已自動重試但仍失敗，請稍後再試或檢查 Notion 設定。"
            self.daily_errors += len(fail_items)

        else:
            # ── Partial success ───────────────────────────────────
            lines = [f"⚠️ {owner_display}：{len(success_items)} 筆成功，{len(fail_items)} 筆失敗"]
            for r in results:
                topic = r["parsed"]["topic"]
                if r["result"]["success"]:
                    url = r["result"].get("url", "")
                    lines.append(f"✅ {topic}")
                    if url:
                        lines.append(f"   🔗 {url}")
                else:
                    err = r["result"].get("error", "未知錯誤")
                    lines.append(f"❌ {topic}：{err}")
            msg = "\n".join(lines)
            self.daily_tasks_created += len(success_items)
            self.daily_errors += len(fail_items)

        self.telegram.send_message(msg, chat_id)

    # ──────────────────────────────────────
    # Polling Loop
    # ──────────────────────────────────────

    def poll_updates(self):
        """輪詢 Telegram 更新"""
        try:
            updates = self.telegram.get_updates(
                offset=self.last_update_id + 1 if self.last_update_id else None,
                timeout=10,
            )

            if not updates.get("ok"):
                return

            for update in updates.get("result", []):
                update_id = update.get("update_id", 0)
                if update_id > self.last_update_id:
                    self.last_update_id = update_id

                message = update.get("message")
                if message:
                    try:
                        self.handle_message(message)
                    except Exception as e:
                        logger.exception(f"處理訊息時發生錯誤: {e}")

        except Exception as e:
            logger.error(f"輪詢更新失敗: {e}")

    # ──────────────────────────────────────
    # Schedule Setup
    # ──────────────────────────────────────

    def setup_schedule(self):
        """設定每日排程（使用 UTC 時間，因為 Railway 容器以 UTC 運行）"""

        def _tw_to_utc(tw_hour: int, tw_minute: int) -> tuple:
            """將台北時間（UTC+8）換算為 UTC 時間"""
            total_utc_minutes = (tw_hour * 60 + tw_minute - 8 * 60) % (24 * 60)
            return total_utc_minutes // 60, total_utc_minutes % 60

        # 台北 06:50 = UTC 22:50（提前 10 分鐘抓取，確保 07:00 台北送達）
        scrape_tw_hour = REPORT_HOUR if REPORT_MINUTE >= 10 else REPORT_HOUR - 1
        scrape_tw_minute = (REPORT_MINUTE - 10) % 60
        scrape_utc_h, scrape_utc_m = _tw_to_utc(scrape_tw_hour, scrape_tw_minute)

        # 台北 23:00 = UTC 15:00
        health_utc_h, health_utc_m = _tw_to_utc(HEALTH_REPORT_HOUR, HEALTH_REPORT_MINUTE)

        scrape_utc_str = f"{scrape_utc_h:02d}:{scrape_utc_m:02d}"
        health_utc_str = f"{health_utc_h:02d}:{health_utc_m:02d}"

        def _threaded_report():
            """在 daemon thread 中執行報告，避免阻塞主迴圈 5-15 分鐘"""
            thread = threading.Thread(
                target=self.generate_daily_report, daemon=True
            )
            thread.start()

        schedule.every().day.at(scrape_utc_str).do(_threaded_report)
        schedule.every().day.at(health_utc_str).do(self.send_health_report)

        report_time_tw = f"{REPORT_HOUR:02d}:{REPORT_MINUTE:02d}"
        scrape_time_tw = f"{scrape_tw_hour:02d}:{scrape_tw_minute:02d}"
        health_time_tw = f"{HEALTH_REPORT_HOUR:02d}:{HEALTH_REPORT_MINUTE:02d}"

        logger.info(f"排程設定完成（UTC 模式）：")
        logger.info(f"  靈感日報：台北 {scrape_time_tw} = UTC {scrape_utc_str}（目標 {report_time_tw} 台北送達）")
        logger.info(f"  健康報告：台北 {health_time_tw} = UTC {health_utc_str}")

    # ──────────────────────────────────────
    # Main Loop
    # ──────────────────────────────────────

    def run(self):
        """主運行迴圈"""
        logger.info("=" * 60)
        logger.info("🚀 IG 靈感日報 Bot 啟動中...")
        logger.info("=" * 60)

        # Validate config
        if not validate_config():
            logger.error("設定驗證失敗，請檢查環境變數")
            sys.exit(1)

        # Bot info
        bot_info = self.telegram.get_me()
        if bot_info.get("ok"):
            bot_name = bot_info["result"].get("username", "Unknown")
            logger.info(f"Bot: @{bot_name}")
        else:
            logger.warning("無法取得 Bot 資訊")

        # Setup
        self.setup_schedule()

        # Check for missed report
        self.check_missed_report()

        logger.info(f"追蹤帳號：{len(IG_ACCOUNTS)} 個")
        logger.info(f"推播群組：{TELEGRAM_CHAT_ID}")
        logger.info("開始監聽訊息...")

        # Main loop
        consecutive_errors = 0
        while self.running:
            try:
                schedule.run_pending()
                self.poll_updates()
                consecutive_errors = 0
                time.sleep(1)

            except KeyboardInterrupt:
                logger.info("收到鍵盤中斷，停止中...")
                break

            except Exception as e:
                consecutive_errors += 1
                logger.exception(f"主迴圈錯誤 (連續第 {consecutive_errors} 次): {e}")

                if consecutive_errors >= 10:
                    logger.critical("連續錯誤超過 10 次，重新啟動...")
                    try:
                        msg = self.formatter.format_error_report(
                            f"Bot 連續錯誤超過 10 次，最後錯誤：{str(e)[:200]}"
                        )
                        self.telegram.send_message(msg, TELEGRAM_CHAT_ID)
                    except Exception:
                        pass
                    break

                # Exponential backoff
                backoff = min(2**consecutive_errors, 60)
                logger.info(f"等待 {backoff} 秒後重試...")
                time.sleep(backoff)

        logger.info("Bot 已停止")


# ──────────────────────────────────────
# Entry Point
# ──────────────────────────────────────

if __name__ == "__main__":
    # Set timezone for schedule library
    os.environ["TZ"] = TIMEZONE
    try:
        time.tzset()
    except AttributeError:
        pass  # Windows doesn't have tzset

    bot = IGInspirationBot()
    bot.run()
