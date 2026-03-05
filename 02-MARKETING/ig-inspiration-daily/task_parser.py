"""
Dori & Rito IG 靈感日報 — Task Parser
=====================================
解析 Telegram 訊息中的待辦任務指令

支援格式：
  Eric代辦任務：xxx          ← 單一任務
  Eric 代辦任務：            ← 多任務（附編號列表）
    1. 電子報idea：xxx
    2. IG Reel idea：xxx
  （待辦/代辦 皆可，有無空格皆可，全/半形冒號皆可）
"""

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ──────────────────────────────────────
# Accepted task prefixes
# 支援：代辦/待辦、有空格/無空格、Eric/eric、Pennee/pennee
# ──────────────────────────────────────
def _build_prefixes(name: str) -> list[str]:
    """Generate all accepted prefix variants for a given name."""
    variants = []
    for char in ["代辦", "待辦"]:
        for sep in ["", " "]:           # with/without space between name and 代辦
            for colon in ["：", ":"]:   # full-width / half-width colon
                variants.append(f"{name}{sep}{char}任務{colon}")
                variants.append(f"{name.lower()}{sep}{char}任務{colon}")
    return variants

ERIC_PREFIXES = _build_prefixes("Eric")
PENNEE_PREFIXES = _build_prefixes("Pennee")


def _parse_task_lines(body: str) -> list[str]:
    """
    Split task body into individual task strings.

    Handles:
      - Numbered list:  "1. task A\n2. task B"
      - Single task:    "task description"
    """
    body = body.strip()
    if not body:
        return []

    # Try numbered list: lines starting with "digit(s). "
    numbered = re.findall(r"^\d+[.、]\s*(.+?)$", body, re.MULTILINE)
    if numbered:
        return [t.strip() for t in numbered if t.strip()]

    # Single task (may be multi-line — treat whole body as one task)
    return [body]


def parse_task_command(text: str) -> Optional[dict]:
    """
    Parse a task command from message text.

    Returns:
        {"owner": "eric"|"pennee", "tasks": ["task1", "task2", ...]}
        or None if not a task command
    """
    if not text:
        return None

    text_stripped = text.strip()

    for prefix in ERIC_PREFIXES:
        if text_stripped.lower().startswith(prefix.lower()):
            body = text_stripped[len(prefix):].strip()
            tasks = _parse_task_lines(body)
            if tasks:
                return {"owner": "eric", "tasks": tasks}
            return None

    for prefix in PENNEE_PREFIXES:
        if text_stripped.lower().startswith(prefix.lower()):
            body = text_stripped[len(prefix):].strip()
            tasks = _parse_task_lines(body)
            if tasks:
                return {"owner": "pennee", "tasks": tasks}
            return None

    return None


def is_task_command(text: str) -> bool:
    """Check if message is a task command."""
    return parse_task_command(text) is not None
