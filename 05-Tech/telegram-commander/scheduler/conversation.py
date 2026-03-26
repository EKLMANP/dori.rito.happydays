"""
對話狀態管理 — 處理多步驟 Telegram 互動
========================================
用 in-memory dict 管理對話狀態，每個 chat_id 同時只有一個對話。
10 分鐘無操作自動過期。
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional


SESSION_TIMEOUT_MINUTES = 10


@dataclass
class ConversationSession:
    """一個對話 session"""
    chat_id: str
    flow: str          # "schedule" | "supplement" | "reschedule"
    step: str          # 當前步驟名稱
    data: dict = field(default_factory=dict)  # 收集到的資料
    created_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)

    def touch(self):
        """更新最後活動時間"""
        self.last_activity = datetime.now()

    @property
    def is_expired(self) -> bool:
        return (datetime.now() - self.last_activity) > timedelta(
            minutes=SESSION_TIMEOUT_MINUTES
        )


class ConversationManager:
    """管理所有 chat_id 的對話狀態"""

    def __init__(self):
        self._sessions: dict[str, ConversationSession] = {}

    def get(self, chat_id: str) -> Optional[ConversationSession]:
        """取得當前對話（過期則自動清除）"""
        session = self._sessions.get(chat_id)
        if session and session.is_expired:
            del self._sessions[chat_id]
            return None
        return session

    def start(self, chat_id: str, flow: str, step: str) -> ConversationSession:
        """開始新對話（自動結束舊的）"""
        session = ConversationSession(chat_id=chat_id, flow=flow, step=step)
        self._sessions[chat_id] = session
        return session

    def end(self, chat_id: str) -> None:
        """結束對話"""
        self._sessions.pop(chat_id, None)

    def has_active(self, chat_id: str) -> bool:
        """是否有進行中的對話"""
        return self.get(chat_id) is not None

    def cleanup(self) -> int:
        """清除所有過期 session，回傳清除數量"""
        expired = [
            cid
            for cid, sess in self._sessions.items()
            if sess.is_expired
        ]
        for cid in expired:
            del self._sessions[cid]
        return len(expired)
