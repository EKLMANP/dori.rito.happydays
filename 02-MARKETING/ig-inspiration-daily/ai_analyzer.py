"""
Dori & Rito IG 靈感日報 — AI Analyzer
======================================
使用 Claude Haiku 分析 IG 貼文並產出內容靈感
"""

import os
import json
import logging
import time
from typing import Optional
from datetime import datetime

import anthropic

from config import (
    ANTHROPIC_API_KEY,
    CLAUDE_MODEL,
    CLAUDE_MAX_TOKENS,
    PROMPTS_DIR,
    NUM_INSIGHTS,
    BRAND_NAME,
    CONSULTATION_FORM_URL,
)

logger = logging.getLogger(__name__)


class AIAnalyzer:
    """Claude Haiku 內容分析引擎"""

    def __init__(self, api_key: str = ANTHROPIC_API_KEY):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.system_prompt = self._load_prompt("analysis_prompt.md")
        self.task_prompt = self._load_prompt("task_extraction_prompt.md")

    def _load_prompt(self, filename: str) -> str:
        """載入 prompt 模板"""
        path = os.path.join(PROMPTS_DIR, filename)
        try:
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            logger.error(f"Prompt 檔案不存在: {path}")
            return ""

    def analyze_posts(self, posts: list[dict], date_str: str = "") -> str:
        """
        分析 IG 貼文並產出靈感日報內容。
        為避免超過 claude-3-haiku 的 4096 output token 上限，
        將 NUM_INSIGHTS 拆成兩批各半數呼叫，最後合併輸出。

        Args:
            posts: 標準化的貼文列表
            date_str: 日期字串（YYYY/MM/DD）

        Returns:
            AI 產出的完整靈感報告（Markdown 格式）
        """
        if not posts:
            logger.warning("沒有貼文可分析")
            return ""

        if not date_str:
            date_str = datetime.now().strftime("%Y/%m/%d")

        accounts = set(p["account"] for p in posts)
        logger.info(f"開始分析 {len(posts)} 則貼文（來自 {len(accounts)} 個帳號）...")

        half = NUM_INSIGHTS // 2  # e.g. 5 if NUM_INSIGHTS=10

        # Batch 1: insights 1 to half (no trends/actions)
        part1 = self._call_claude_batch(
            posts, date_str, len(accounts),
            start_n=1, end_n=half, include_trends=False
        )

        # Batch 2: insights half+1 to NUM_INSIGHTS + trends + action items
        part2 = self._call_claude_batch(
            posts, date_str, len(accounts),
            start_n=half + 1, end_n=NUM_INSIGHTS, include_trends=True
        )

        if not part1 and not part2:
            return self._fallback_summary(posts, date_str)

        return (part1 + "\n\n" + part2).strip()

    def _call_claude_batch(
        self,
        posts: list[dict],
        date_str: str,
        account_count: int,
        start_n: int,
        end_n: int,
        include_trends: bool,
    ) -> str:
        """執行單批次 Claude API 呼叫（529 Overloaded 自動重試）"""
        user_prompt = self._build_user_prompt(
            posts, date_str, account_count, start_n, end_n, include_trends
        )
        max_retries = 3
        for attempt in range(max_retries):
            try:
                message = self.client.messages.create(
                    model=CLAUDE_MODEL,
                    max_tokens=CLAUDE_MAX_TOKENS,
                    system=self.system_prompt,
                    messages=[{"role": "user", "content": user_prompt}]
                )
                result = message.content[0].text
                logger.info(
                    f"批次 {start_n}-{end_n} 完成，使用 "
                    f"{message.usage.input_tokens} input + {message.usage.output_tokens} output tokens"
                )
                return result
            except anthropic.APIStatusError as e:
                if e.status_code == 529 and attempt < max_retries - 1:
                    wait_secs = 15 * (attempt + 1)  # 15s, 30s backoff
                    logger.warning(
                        f"Claude 529 Overloaded（批次 {start_n}-{end_n}），"
                        f"{wait_secs}s 後重試（第 {attempt + 1}/{max_retries - 1} 次）..."
                    )
                    time.sleep(wait_secs)
                    continue
                logger.error(f"Claude API 錯誤（批次 {start_n}-{end_n}）: {e}")
                return ""
            except anthropic.APIError as e:
                logger.error(f"Claude API 錯誤（批次 {start_n}-{end_n}）: {e}")
                return ""
            except Exception as e:
                logger.error(f"AI 分析失敗（批次 {start_n}-{end_n}）: {e}")
                return ""
        return ""

    def _build_user_prompt(
        self,
        posts: list[dict],
        date_str: str,
        account_count: int,
        start_n: int = 1,
        end_n: Optional[int] = None,
        include_trends: bool = True,
    ) -> str:
        """構建使用者 prompt（支援分批請求）"""
        if end_n is None:
            end_n = NUM_INSIGHTS

        lines = [
            f"## 今日 IG 數據（{date_str}）",
            f"共分析 {len(posts)} 則貼文，來自 {account_count} 個帳號",
            "",
        ]

        for i, post in enumerate(posts, 1):
            caption = post.get("caption", "")[:500]  # truncate to 500 chars
            hashtags = ", ".join(post.get("hashtags", [])[:10])
            lines.append(f"### 貼文 {i}")
            lines.append(f"- **帳號:** @{post['account']}")
            lines.append(f"- **類型:** {post.get('post_type', 'Unknown')}")
            lines.append(f"- **互動:** {post.get('likes', 0)} likes, {post.get('comments', 0)} comments")
            if post.get("url"):
                lines.append(f"- **URL:** {post['url']}")
            if hashtags:
                lines.append(f"- **Hashtags:** {hashtags}")
            lines.append(f"- **內容:** {caption}")
            lines.append("")

        count = end_n - start_n + 1
        if include_trends:
            lines.append(
                f"## 重要：你必須產出恰好 {count} 則靈感，從 {start_n}/{NUM_INSIGHTS} 到 {end_n}/{NUM_INSIGHTS}，不多不少。"
                f"並在所有靈感之後加上「📈 趨勢觀察」和「🎯 本週行動建議」。"
            )
        else:
            lines.append(
                f"## 重要：你必須產出恰好 {count} 則靈感，從 {start_n}/{NUM_INSIGHTS} 到 {end_n}/{NUM_INSIGHTS}，不多不少。"
                f"不需要趨勢觀察或行動建議（將由第二批次補充）。"
            )
        lines.append(
            f"請嚴格遵守系統提示中的輸出格式，確保每則靈感（{start_n}/10 到 {end_n}/10）"
            f"都有完整的 🎬 IG Reel 腳本、📑 Carousel 架構、📧 電子報標題、📝 部落格標題和 💰 變現建議。"
            f"不得省略任何一則靈感。\n\n"
            f"## 格式要求（務必遵守）\n"
            f"1. 每則靈感必須包含「來源：@帳號」和「🔗 貼文URL」（從上方貼文數據中取用對應的 URL）\n"
            f"2. 禁止使用任何 Markdown 語法（禁止 **粗體**、禁止 # 標題、禁止 *斜體*），直接輸出純文字\n"
            f"3. 使用 emoji 作為段落分隔符號（如 📌 🔍 🎬 📑 📧 📝 💰），不使用 # 或 ** 做標記"
        )

        return "\n".join(lines)

    def _fallback_summary(self, posts: list[dict], date_str: str) -> str:
        """AI 失敗時的降級摘要"""
        lines = [
            f"⚠️ AI 分析暫時無法使用，以下為原始貼文摘要：",
            f"日期：{date_str}",
            f"共 {len(posts)} 則貼文",
            "",
        ]
        for post in posts[:10]:
            caption = post.get("caption", "")[:100]
            lines.append(f"• @{post['account']}: {caption}...")
            lines.append("")
        return "\n".join(lines)

    def extract_task(self, raw_text: str) -> dict:
        """
        從自然語言提取結構化任務資訊

        Args:
            raw_text: 使用者輸入的任務描述

        Returns:
            {"topic": str, "description": str, "category": str, "priority": str}
        """
        try:
            message = self.client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=512,
                system=self.task_prompt,
                messages=[{"role": "user", "content": raw_text}]
            )

            response_text = message.content[0].text.strip()
            # Try to extract JSON from response
            # Handle cases where model wraps JSON in markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            result = json.loads(response_text)

            # Validate required fields
            valid_categories = [
                "行銷", "研發(系統相關)", "客戶成功",
                "異業合作", "財務/會計(收付款相關)", "其他"
            ]
            valid_priorities = ["Low", "Medium", "High"]

            if result.get("category") not in valid_categories:
                result["category"] = "行銷"  # default for this content-focused bot
            if result.get("priority") not in valid_priorities:
                result["priority"] = "Medium"

            return result

        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.warning(f"任務解析失敗，使用預設值: {e}")
            return {
                "topic": raw_text[:20],
                "description": raw_text,
                "category": "行銷",
                "priority": "Medium"
            }
        except Exception as e:
            logger.error(f"任務提取 API 錯誤: {e}")
            return {
                "topic": raw_text[:20],
                "description": raw_text,
                "category": "行銷",
                "priority": "Medium"
            }
