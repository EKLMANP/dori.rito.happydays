"""
Dori & Rito IG 靈感日報 — Notion Client
=======================================
處理 Notion API 的任務建立（含自動重試）
"""

import logging
import time
import requests
from typing import Optional

from config import (
    NOTION_API_TOKEN,
    NOTION_API_VERSION,
    ERIC_TASK_DB_ID,
    PENNEE_TASK_DB_ID,
)

logger = logging.getLogger(__name__)

# HTTP status codes eligible for retry
_RETRYABLE_STATUSES = {429, 500, 502, 503, 504}


class NotionTaskClient:
    """Notion 任務建立客戶端（自動重試暫時性錯誤）"""

    def __init__(self, token: str = NOTION_API_TOKEN):
        self.token = token
        self.base_url = "https://api.notion.com/v1"
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Notion-Version": NOTION_API_VERSION,
        }
        self.db_map = {
            "eric": ERIC_TASK_DB_ID,
            "pennee": PENNEE_TASK_DB_ID,
        }

    def create_task(
        self,
        owner: str,
        topic: str,
        description: str,
        category: str = "行銷",
        priority: str = "Medium",
        max_retries: int = 3,
    ) -> dict:
        """
        Create a task page in the appropriate Notion database.

        Returns:
            {
                "success": bool,
                "url": str,          # Notion page URL on success
                "error": str,        # Error message on failure
                "retried": bool,     # True if recovered via retry
            }
        """
        database_id = self.db_map.get(owner.lower())
        if not database_id:
            return {"success": False, "url": "", "error": f"未知的擁有者: {owner}", "retried": False}

        payload = {
            "parent": {"database_id": database_id},
            "properties": {
                "Topic 主題": {
                    "title": [{"text": {"content": topic}}]
                },
                "Description 任務說明": {
                    "rich_text": [{"text": {"content": description}}]
                },
                "類別": {
                    "multi_select": [{"name": category}]
                },
                "Priority 優先級": {
                    "select": {"name": priority}
                },
                "Status": {
                    "status": {"name": "Not started"}
                },
            },
        }

        last_error = ""
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    f"{self.base_url}/pages",
                    headers=self.headers,
                    json=payload,
                    timeout=30,
                )

                if response.status_code == 200:
                    data = response.json()
                    page_url = data.get("url", "")
                    logger.info(f"Notion 任務建立成功：{topic} → {owner}")
                    return {
                        "success": True,
                        "url": page_url,
                        "error": "",
                        "retried": attempt > 0,
                    }

                # Retryable HTTP errors
                if response.status_code in _RETRYABLE_STATUSES and attempt < max_retries - 1:
                    wait_secs = 5 * (attempt + 1)
                    last_error = f"HTTP {response.status_code}"
                    logger.warning(
                        f"Notion API {response.status_code}（{owner}：{topic}），"
                        f"{wait_secs}s 後重試（第 {attempt + 1}/{max_retries - 1} 次）..."
                    )
                    time.sleep(wait_secs)
                    continue

                # Non-retryable error — give actionable guidance for common cases
                try:
                    error_body = response.json()
                    error_msg = error_body.get("message", response.text[:200])
                except Exception:
                    error_msg = response.text[:200]

                # 401: invalid token
                if response.status_code == 401:
                    error_msg = "Notion API 金鑰無效，請檢查 NOTION_API_TOKEN 環境變數"
                # 404: integration not connected to database
                elif response.status_code == 404 and "shared with your integration" in error_msg:
                    error_msg = (
                        "Notion 整合無法存取此資料庫 ⚠️\n"
                        "請確認 Railway 環境變數 NOTION_API_TOKEN 使用的是「Dori & Rito_Eric's Tasks from TG Bot」整合的 token"
                    )
                # 403: permission denied
                elif response.status_code == 403:
                    error_msg = "Notion 存取被拒，請確認整合權限是否包含「插入內容」"

                logger.error(f"Notion API 錯誤 {response.status_code}: {error_msg}")
                return {"success": False, "url": "", "error": error_msg, "retried": attempt > 0}

            except requests.Timeout:
                last_error = "請求超時"
                if attempt < max_retries - 1:
                    wait_secs = 5 * (attempt + 1)
                    logger.warning(
                        f"Notion 請求超時（{owner}：{topic}），"
                        f"{wait_secs}s 後重試（第 {attempt + 1}/{max_retries - 1} 次）..."
                    )
                    time.sleep(wait_secs)
                    continue
                logger.error(f"Notion 請求超時，已達最大重試次數")
                return {"success": False, "url": "", "error": last_error, "retried": True}

            except requests.RequestException as e:
                logger.error(f"Notion 網路錯誤: {e}")
                return {"success": False, "url": "", "error": str(e), "retried": attempt > 0}

        # Exhausted all retries
        return {"success": False, "url": "", "error": f"{last_error}（已重試 {max_retries - 1} 次）", "retried": True}
