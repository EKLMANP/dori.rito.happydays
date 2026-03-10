"""
Dori & Rito IG Inspiration Daily -- Data Store
================================================
SQLite wrapper for post caching, Apify usage tracking, and report tracking.
Provides crash-recovery support by persisting all state to disk.
"""

import json
import logging
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import Optional

from config import DB_PATH, APIFY_REDUCE_THRESHOLD, APIFY_STOP_THRESHOLD

logger = logging.getLogger(__name__)

# Taipei timezone offset (UTC+8)
_TZ_TAIPEI = timezone(timedelta(hours=8))


def _now_taipei() -> datetime:
    """Return the current datetime in Asia/Taipei timezone."""
    return datetime.now(_TZ_TAIPEI)


def _today_str() -> str:
    """Return today's date string in YYYY-MM-DD format (Taipei time)."""
    return _now_taipei().strftime("%Y-%m-%d")


def _current_year_month() -> str:
    """Return the current year-month string in YYYY-MM format (Taipei time)."""
    return _now_taipei().strftime("%Y-%m")


class DataStore:
    """SQLite-backed storage for IG scraping pipeline state.

    Manages three concerns:
    1. Post cache -- avoids re-processing duplicate IG posts.
    2. Apify usage tracking -- enforces monthly free-tier limits.
    3. Report tracking -- prevents duplicate daily report sends.
    """

    def __init__(self, db_path: str = DB_PATH) -> None:
        self.db_path = db_path
        self._conn: Optional[sqlite3.Connection] = None
        self._init_db()

    # ──────────────────────────────────────
    # Connection & Schema
    # ──────────────────────────────────────

    def _get_conn(self) -> sqlite3.Connection:
        """Return (or create) a persistent SQLite connection."""
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self._conn.row_factory = sqlite3.Row
            self._conn.execute("PRAGMA journal_mode=WAL")
            self._conn.execute("PRAGMA foreign_keys=ON")
        return self._conn

    def _init_db(self) -> None:
        """Create tables if they don't exist."""
        conn = self._get_conn()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS posts (
                id          TEXT PRIMARY KEY,
                account     TEXT NOT NULL,
                caption     TEXT,
                post_type   TEXT,
                likes       INTEGER DEFAULT 0,
                comments    INTEGER DEFAULT 0,
                hashtags    TEXT DEFAULT '[]',
                posted_at   TEXT,
                scraped_at  TEXT NOT NULL,
                analyzed    INTEGER DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_posts_account
                ON posts (account);
            CREATE INDEX IF NOT EXISTS idx_posts_scraped_at
                ON posts (scraped_at);

            CREATE TABLE IF NOT EXISTS apify_usage (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                year_month    TEXT NOT NULL,
                scrape_count  INTEGER NOT NULL,
                recorded_at   TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_apify_usage_year_month
                ON apify_usage (year_month);

            CREATE TABLE IF NOT EXISTS reports (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                report_date       TEXT NOT NULL,
                sent_at           TEXT NOT NULL,
                insights_count    INTEGER DEFAULT 0,
                accounts_scraped  INTEGER DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_reports_date
                ON reports (report_date);
        """)
        conn.commit()
        logger.info("Database initialized at %s", self.db_path)

    def close(self) -> None:
        """Close the database connection."""
        if self._conn is not None:
            self._conn.close()
            self._conn = None
            logger.debug("Database connection closed")

    # ──────────────────────────────────────
    # Post Cache
    # ──────────────────────────────────────

    def is_post_cached(self, post_id: str) -> bool:
        """Check whether a post with the given ID already exists in the cache.

        Args:
            post_id: The IG post shortcode or unique identifier.

        Returns:
            True if the post is already stored, False otherwise.
        """
        conn = self._get_conn()
        row = conn.execute(
            "SELECT 1 FROM posts WHERE id = ?", (post_id,)
        ).fetchone()
        return row is not None

    def get_uncached_posts(self, post_ids: list[str]) -> list[str]:
        """Filter a list of post IDs to only those not yet cached.

        Args:
            post_ids: List of IG post shortcodes to check.

        Returns:
            Subset of post_ids that are NOT in the database.
        """
        if not post_ids:
            return []

        conn = self._get_conn()
        placeholders = ",".join("?" for _ in post_ids)
        rows = conn.execute(
            f"SELECT id FROM posts WHERE id IN ({placeholders})", post_ids
        ).fetchall()
        cached = {row["id"] for row in rows}
        return [pid for pid in post_ids if pid not in cached]

    def save_posts(self, posts: list[dict]) -> int:
        """Save a batch of posts to the cache, skipping duplicates.

        Args:
            posts: List of post dicts, each must contain at minimum
                   'id', 'account', and 'scraped_at'. Other fields are
                   optional and will use column defaults.

        Returns:
            Number of newly inserted posts (duplicates are skipped).
        """
        if not posts:
            return 0

        conn = self._get_conn()
        inserted = 0
        now_str = _now_taipei().isoformat()

        for post in posts:
            hashtags_json = json.dumps(
                post.get("hashtags", []), ensure_ascii=False
            )
            try:
                before = conn.total_changes
                conn.execute(
                    """
                    INSERT OR IGNORE INTO posts
                        (id, account, caption, post_type, likes, comments,
                         hashtags, posted_at, scraped_at, analyzed)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                    """,
                    (
                        post["id"],
                        post["account"],
                        post.get("caption", ""),
                        post.get("post_type", ""),
                        post.get("likes", 0),
                        post.get("comments", 0),
                        hashtags_json,
                        post.get("posted_at", ""),
                        post.get("scraped_at", now_str),
                    ),
                )
                if conn.total_changes > before:
                    inserted += 1
            except sqlite3.IntegrityError:
                # Duplicate post ID, skip silently
                pass

        conn.commit()
        logger.info("Saved %d new posts out of %d total", inserted, len(posts))
        return inserted

    def get_recent_posts(self, days: int = 7) -> list[dict]:
        """Retrieve posts scraped within the last N days for trend analysis.

        Args:
            days: Number of days to look back (default: 7).

        Returns:
            List of post dicts with parsed hashtags (as list, not JSON string).
        """
        conn = self._get_conn()
        cutoff = (_now_taipei() - timedelta(days=days)).isoformat()
        rows = conn.execute(
            """
            SELECT id, account, caption, post_type, likes, comments,
                   hashtags, posted_at, scraped_at, analyzed
            FROM posts
            WHERE scraped_at >= ?
            ORDER BY scraped_at DESC
            """,
            (cutoff,),
        ).fetchall()

        results = []
        for row in rows:
            post = dict(row)
            # Parse hashtags from JSON string to list
            try:
                post["hashtags"] = json.loads(post["hashtags"])
            except (json.JSONDecodeError, TypeError):
                post["hashtags"] = []
            # Convert analyzed int to bool
            post["analyzed"] = bool(post["analyzed"])
            # Reconstruct URL from post ID (not stored in DB)
            post_id = post.get("id", "")
            post["url"] = f"https://www.instagram.com/p/{post_id}/" if post_id else ""
            results.append(post)

        logger.debug("Retrieved %d posts from last %d days", len(results), days)
        return results

    # ──────────────────────────────────────
    # Apify Usage Tracking
    # ──────────────────────────────────────

    def get_monthly_usage(self) -> int:
        """Return total Apify scrape count for the current month.

        Returns:
            Sum of all scrape_count entries for the current YYYY-MM.
        """
        conn = self._get_conn()
        year_month = _current_year_month()
        row = conn.execute(
            """
            SELECT COALESCE(SUM(scrape_count), 0) AS total
            FROM apify_usage
            WHERE year_month = ?
            """,
            (year_month,),
        ).fetchone()
        return row["total"]

    def record_usage(self, count: int) -> None:
        """Record an Apify usage entry for the current month.

        Args:
            count: Number of scrape operations performed in this batch.
        """
        if count <= 0:
            return

        conn = self._get_conn()
        now_str = _now_taipei().isoformat()
        year_month = _current_year_month()

        conn.execute(
            """
            INSERT INTO apify_usage (year_month, scrape_count, recorded_at)
            VALUES (?, ?, ?)
            """,
            (year_month, count, now_str),
        )
        conn.commit()

        total = self.get_monthly_usage()
        logger.info(
            "Recorded %d scrape ops for %s (monthly total: %d)",
            count, year_month, total,
        )

    def should_reduce_posts(self) -> bool:
        """Check if monthly usage has crossed the reduction threshold.

        When True, the scraper should reduce to 1 post per account
        to conserve Apify credits.

        Returns:
            True if monthly usage > APIFY_REDUCE_THRESHOLD.
        """
        usage = self.get_monthly_usage()
        should = usage > APIFY_REDUCE_THRESHOLD
        if should:
            logger.warning(
                "Apify usage (%d) exceeds reduce threshold (%d). "
                "Switching to 1 post/account.",
                usage, APIFY_REDUCE_THRESHOLD,
            )
        return should

    def should_skip_scraping(self) -> bool:
        """Check if monthly usage has crossed the stop threshold.

        When True, the scraper should skip all Apify calls and use
        only cached data.

        Returns:
            True if monthly usage > APIFY_STOP_THRESHOLD.
        """
        usage = self.get_monthly_usage()
        should = usage > APIFY_STOP_THRESHOLD
        if should:
            logger.warning(
                "Apify usage (%d) exceeds stop threshold (%d). "
                "Skipping scraping entirely -- using cache only.",
                usage, APIFY_STOP_THRESHOLD,
            )
        return should

    # ──────────────────────────────────────
    # Report Tracking
    # ──────────────────────────────────────

    def is_report_sent_today(self) -> bool:
        """Check whether today's daily report has already been sent.

        Uses Taipei timezone for date comparison.

        Returns:
            True if a report entry exists for today's date.
        """
        conn = self._get_conn()
        today = _today_str()
        row = conn.execute(
            "SELECT 1 FROM reports WHERE report_date = ?", (today,)
        ).fetchone()
        return row is not None

    def record_report_sent(
        self, insights_count: int, accounts_scraped: int, report_date: Optional[str] = None
    ) -> None:
        """Record that today's report was successfully sent.

        Args:
            insights_count: Number of insights included in the report.
            accounts_scraped: Number of IG accounts scraped for this report.
            report_date: YYYY-MM-DD string to record as the report date.
                If omitted, uses current Taipei date. Pass the date captured
                at the *start* of report generation to avoid cross-midnight drift.
        """
        conn = self._get_conn()
        now_str = _now_taipei().isoformat()
        today = report_date or _today_str()

        conn.execute(
            """
            INSERT INTO reports
                (report_date, sent_at, insights_count, accounts_scraped)
            VALUES (?, ?, ?, ?)
            """,
            (today, now_str, insights_count, accounts_scraped),
        )
        conn.commit()
        logger.info(
            "Report for %s recorded: %d insights, %d accounts",
            today, insights_count, accounts_scraped,
        )

    # ──────────────────────────────────────
    # Context Manager Support
    # ──────────────────────────────────────

    def __enter__(self) -> "DataStore":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()
