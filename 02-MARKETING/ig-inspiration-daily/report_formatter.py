"""
Dori & Rito IG 靈感日報 — Report Formatter
==========================================
將 AI 分析結果格式化為 Telegram 訊息
"""

from datetime import datetime


class ReportFormatter:
    """格式化靈感日報為 Telegram 訊息"""

    def format_daily_report(
        self,
        ai_output: str,
        date_str: str = "",
        posts_count: int = 0,
        accounts_count: int = 0,
    ) -> str:
        """Format the full daily report with header and footer."""
        if not date_str:
            date_str = datetime.now().strftime("%Y/%m/%d")

        header = (
            f"【社群內容靈感日報】 {date_str}\n\n"
            f"📊 今日分析：{posts_count} 則新貼文 | {accounts_count} 個帳號\n"
            f"━━━━━━━━━━━━━━━━━━━━\n\n"
        )

        footer = (
            f"\n━━━━━━━━━━━━━━━━━━━━\n"
            f"🤖 Dori & Rito IG 靈感日報 — 自動化系統\n"
            f"📝 回覆「Eric代辦任務：」或「Pennee代辦任務：」建立 Notion 任務"
        )

        return header + ai_output + footer

    def format_health_report(
        self,
        accounts_success: int,
        accounts_total: int,
        insights_count: int,
        apify_usage: int,
        apify_limit: int,
        tasks_created: int,
        errors: int,
    ) -> str:
        """Format the daily health report (sent at 23:00)."""
        usage_pct = (apify_usage / apify_limit * 100) if apify_limit > 0 else 0

        # Warning emoji if usage is high
        usage_emoji = "🟢" if usage_pct < 70 else "🟡" if usage_pct < 90 else "🔴"

        return (
            f"📊 IG 靈感日報 — 系統健康報告\n\n"
            f"✅ 今日抓取：{accounts_success}/{accounts_total} 帳號成功\n"
            f"📝 分析產出：{insights_count} 則靈感\n"
            f"{usage_emoji} Apify 本月用量：{apify_usage} / {apify_limit}"
            f"（{usage_pct:.1f}%）\n"
            f"🔄 待辦任務建立：{tasks_created} 筆\n"
            f"⚠️ 錯誤：{errors} 筆"
        )

    def format_task_confirmation(
        self,
        owner: str,
        topic: str,
        notion_url: str = "",
    ) -> str:
        """Format task creation confirmation."""
        msg = f"✅ 已為 {owner} 建立任務：{topic}"
        if notion_url:
            msg += f"\n🔗 {notion_url}"
        return msg

    def format_task_error(self, owner: str, error: str) -> str:
        """Format task creation error."""
        return f"❌ 為 {owner} 建立任務失敗：{error}"

    def format_error_report(self, error_msg: str) -> str:
        """Format an error notification."""
        return f"⚠️ IG 靈感日報系統錯誤\n\n{error_msg}"

    def format_status(
        self,
        is_running: bool,
        last_report_date: str,
        apify_usage: int,
        apify_limit: int,
        accounts_count: int,
    ) -> str:
        """Format /status command response."""
        status_emoji = "🟢" if is_running else "🔴"
        usage_pct = (apify_usage / apify_limit * 100) if apify_limit > 0 else 0

        return (
            f"📊 IG 靈感日報 — 系統狀態\n\n"
            f"{status_emoji} 運行狀態：{'正常' if is_running else '異常'}\n"
            f"📅 上次報告：{last_report_date or '尚未產生'}\n"
            f"👥 追蹤帳號：{accounts_count} 個\n"
            f"💰 Apify 用量：{apify_usage}/{apify_limit}（{usage_pct:.1f}%）"
        )
