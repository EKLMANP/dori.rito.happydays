"""
Dori & Rito IG Inspiration Daily -- Instagram Scraper
======================================================
Apify-powered scraper for fetching latest posts from tracked IG accounts.
Includes usage-aware throttling and crash-resilient per-account error handling.
"""

import logging
import re
import time
from datetime import datetime, timezone, timedelta

from apify_client import ApifyClient

from config import APIFY_API_TOKEN, IG_ACCOUNTS, POSTS_PER_ACCOUNT
from data_store import DataStore

logger = logging.getLogger(__name__)

# Taipei timezone offset (UTC+8)
_TZ_TAIPEI = timezone(timedelta(hours=8))

# Apify actor for IG post scraping
# instagram-scraper supports directUrls for profile pages + resultsType
_ACTOR_ID = "apify/instagram-scraper"

# Retry configuration
_MAX_RETRIES = 2
_RETRY_DELAY_SECONDS = 30

# Caption truncation limit
_MAX_CAPTION_LENGTH = 500

# Regex for extracting hashtags from captions
_HASHTAG_PATTERN = re.compile(r"#\w+", re.UNICODE)


def _now_taipei() -> datetime:
    """Return the current datetime in Asia/Taipei timezone."""
    return datetime.now(_TZ_TAIPEI)


class IGScraper:
    """Scrapes Instagram posts via Apify, with built-in usage guardrails.

    Integrates with DataStore for:
    - Deduplication (skip already-cached posts)
    - Usage tracking (stay within Apify free tier)
    - Automatic throttling when nearing monthly limits
    """

    def __init__(self, apify_token: str = APIFY_API_TOKEN,
                 data_store: DataStore | None = None) -> None:
        """Initialize the scraper.

        Args:
            apify_token: Apify API token for authentication.
            data_store: DataStore instance for caching and usage tracking.
                        If None, a new DataStore is created.
        """
        if not apify_token:
            raise ValueError(
                "Apify API token is required. Set APIFY_API_TOKEN in .env"
            )
        self.client = ApifyClient(apify_token)
        self.store = data_store or DataStore()

    def fetch_latest_posts(self) -> list[dict]:
        """Fetch the latest posts from all tracked IG accounts.

        Workflow:
        1. Check if monthly Apify usage exceeds the stop threshold.
           If so, skip scraping entirely and return empty.
        2. Check if usage exceeds the reduce threshold.
           If so, fetch only 1 post per account instead of the default.
        3. For each account, call Apify to get recent posts.
        4. Filter out already-cached posts.
        5. Save new posts and record usage.

        Returns:
            List of new (not previously cached) post dicts in
            standardized format.
        """
        # Gate: check if we should skip scraping entirely
        if self.store.should_skip_scraping():
            logger.warning(
                "Monthly Apify usage exceeded stop threshold. "
                "Returning empty -- use cached data instead."
            )
            return []

        # Determine posts per account based on usage level
        if self.store.should_reduce_posts():
            posts_per_account = 1
            logger.info("Reduced mode: fetching 1 post per account")
        else:
            posts_per_account = POSTS_PER_ACCOUNT
            logger.info(
                "Normal mode: fetching %d posts per account",
                posts_per_account,
            )

        all_new_posts: list[dict] = []
        total_scrape_count = 0
        accounts_processed = 0

        for account in IG_ACCOUNTS:
            try:
                new_posts = self._scrape_account(account, posts_per_account)
                all_new_posts.extend(new_posts)
                accounts_processed += 1
                total_scrape_count += 1  # 1 Apify actor run per account

                logger.info(
                    "Account @%s: %d new posts fetched",
                    account, len(new_posts),
                )

            except Exception:
                logger.exception(
                    "Failed to scrape @%s after retries. "
                    "Continuing to next account.",
                    account,
                )
                continue

        # Record total Apify usage for this batch
        if total_scrape_count > 0:
            self.store.record_usage(total_scrape_count)

        # Save all new posts to the cache
        saved_count = self.store.save_posts(all_new_posts)

        logger.info(
            "Scraping complete: %d accounts processed, "
            "%d new posts found, %d saved to cache",
            accounts_processed, len(all_new_posts), saved_count,
        )

        return all_new_posts

    def _scrape_account(
        self, account: str, posts_per_account: int
    ) -> list[dict]:
        """Scrape a single IG account with retry logic.

        Args:
            account: Instagram username (without @).
            posts_per_account: Maximum number of posts to fetch.

        Returns:
            List of new (uncached) post dicts in standardized format.

        Raises:
            Exception: If all retries are exhausted.
        """
        last_error: Exception | None = None

        for attempt in range(1, _MAX_RETRIES + 2):  # 1 initial + 2 retries
            try:
                raw_posts = self._call_apify(account, posts_per_account)

                # Normalize all posts to standard format
                normalized = [
                    self._normalize_post(raw, account) for raw in raw_posts
                ]

                # Filter out already-cached posts
                all_ids = [p["id"] for p in normalized]
                new_ids = set(self.store.get_uncached_posts(all_ids))
                new_posts = [p for p in normalized if p["id"] in new_ids]

                return new_posts

            except Exception as e:
                last_error = e
                if attempt <= _MAX_RETRIES:
                    logger.warning(
                        "Attempt %d/%d for @%s failed: %s. "
                        "Retrying in %ds...",
                        attempt, _MAX_RETRIES + 1, account,
                        str(e), _RETRY_DELAY_SECONDS,
                    )
                    time.sleep(_RETRY_DELAY_SECONDS)
                else:
                    logger.error(
                        "All %d attempts for @%s exhausted.",
                        _MAX_RETRIES + 1, account,
                    )

        raise last_error  # type: ignore[misc]

    def _call_apify(
        self, account: str, results_limit: int
    ) -> list[dict]:
        """Execute the Apify Instagram scraper actor for one account.

        Args:
            account: Instagram username.
            results_limit: Maximum posts to retrieve.

        Returns:
            List of raw post dicts from Apify.
        """
        actor_input = {
            "directUrls": [f"https://www.instagram.com/{account}/"],
            "resultsType": "posts",
            "resultsLimit": results_limit,
        }

        logger.debug(
            "Calling Apify actor %s for @%s (limit=%d)",
            _ACTOR_ID, account, results_limit,
        )

        run = self.client.actor(_ACTOR_ID).call(run_input=actor_input)

        if not run:
            raise RuntimeError(
                f"Apify actor run returned None for @{account}"
            )

        # Collect results from the actor's default dataset
        items = list(
            self.client.dataset(run["defaultDatasetId"]).iterate_items()
        )

        logger.debug(
            "Apify returned %d items for @%s", len(items), account
        )

        return items

    def _normalize_post(self, raw_post: dict, account: str) -> dict:
        """Convert an Apify raw post dict to the standardized format.

        Args:
            raw_post: Raw post data from Apify's Instagram scraper.
            account: The Instagram username this post belongs to.

        Returns:
            Standardized post dict with consistent field names and types.
        """
        # Extract post ID (shortcode is the unique IG identifier)
        post_id = raw_post.get("shortCode") or raw_post.get("id", "")

        # Extract and truncate caption
        caption = raw_post.get("caption", "") or ""
        if len(caption) > _MAX_CAPTION_LENGTH:
            caption = caption[:_MAX_CAPTION_LENGTH] + "..."

        # Determine post type
        post_type = raw_post.get("type", "")
        if not post_type:
            # Fallback: infer from other fields
            if raw_post.get("videoUrl"):
                post_type = "Video"
            elif raw_post.get("childPosts") or raw_post.get("sidecarPosts"):
                post_type = "Sidecar"
            else:
                post_type = "Photo"

        # Extract hashtags from caption
        full_caption = raw_post.get("caption", "") or ""
        hashtags = _HASHTAG_PATTERN.findall(full_caption)

        # Parse posted timestamp
        posted_at = ""
        raw_timestamp = raw_post.get("timestamp")
        if raw_timestamp:
            try:
                # Apify typically returns ISO format strings
                if isinstance(raw_timestamp, str):
                    posted_at = raw_timestamp
                elif isinstance(raw_timestamp, (int, float)):
                    # Unix timestamp
                    posted_at = datetime.fromtimestamp(
                        raw_timestamp, tz=timezone.utc
                    ).isoformat()
            except (ValueError, OSError):
                logger.warning(
                    "Could not parse timestamp %r for post %s",
                    raw_timestamp, post_id,
                )

        # Build the post URL
        url = f"https://www.instagram.com/p/{post_id}/" if post_id else ""

        return {
            "id": post_id,
            "account": account,
            "caption": caption,
            "post_type": post_type,
            "likes": int(raw_post.get("likesCount", 0) or 0),
            "comments": int(raw_post.get("commentsCount", 0) or 0),
            "hashtags": hashtags,
            "posted_at": posted_at,
            "scraped_at": _now_taipei().isoformat(),
            "url": url,
        }
