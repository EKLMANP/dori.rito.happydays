"""
Dori & Rito - Telegram 遠端指揮中心 Bot
=========================================
讓 Eric & Pennee 在外時透過 Telegram 指揮 AI 虛擬團隊

虛擬團隊成員：
  /head      - 負責人（戰略決策）
  /trainer   - 訓犬師（訓練課程設計）
  /mkt       - 行銷人員（內容文案）
  /seo       - SEO 專員（關鍵字分析）
  /cs        - 客服人員（客戶回覆）
  /designer  - 設計師（視覺建議）

通用指令：
  /start     - 歡迎訊息
  /help      - 完整說明
  /team      - 顯示虛擬團隊成員
  /status    - 服務狀態

使用範例：
  /mkt 幫我寫一篇關於分離焦慮的 IG 貼文
  /cs 客戶說狗狗對陌生人很有攻擊性，該怎麼回覆？
  /seo 分析「台北訓狗」這個關鍵字的策略
"""

import os
import sys
import time
import requests
import anthropic
from pathlib import Path
from dotenv import load_dotenv

# 載入 .env
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "").strip()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()

PROMPTS_DIR = Path(__file__).parent.parent.parent / "04-TEAM" / "prompts"

# 虛擬團隊成員設定
TEAM_MEMBERS = {
    "head": {
        "name": "負責人",
        "emoji": "👔",
        "prompt_file": "dr-head.md",
        "description": "全局戰略、業務發展、資源分配",
    },
    "trainer": {
        "name": "訓犬師",
        "emoji": "🐕",
        "prompt_file": "dr-trainer.md",
        "description": "訓練課程設計、行為問題、專業建議",
    },
    "mkt": {
        "name": "行銷人員",
        "emoji": "📣",
        "prompt_file": "dr-mkt.md",
        "description": "內容創作、社群文案、品牌行銷",
    },
    "seo": {
        "name": "SEO 專員",
        "emoji": "🔍",
        "prompt_file": "dr-seo.md",
        "description": "關鍵字研究、SEO 優化、流量分析",
    },
    "cs": {
        "name": "客服人員",
        "emoji": "💬",
        "prompt_file": "dr-cs.md",
        "description": "客戶諮詢回覆、FAQ、問題處理",
    },
    "designer": {
        "name": "設計師",
        "emoji": "🎨",
        "prompt_file": "dr-designer.md",
        "description": "視覺設計、品牌素材、UI/UX 建議",
    },
}


class TelegramCommander:
    """遠端指揮中心 Bot"""

    def __init__(self):
        if not TELEGRAM_BOT_TOKEN:
            raise ValueError("請設定 TELEGRAM_BOT_TOKEN 環境變數")
        if not ANTHROPIC_API_KEY:
            raise ValueError("請設定 ANTHROPIC_API_KEY 環境變數")

        self.token = TELEGRAM_BOT_TOKEN
        self.allowed_chat_id = TELEGRAM_CHAT_ID
        self.claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.last_update_id = 0
        self._prompts_cache = {}

        print(f"✅ Claude API 已連接")
        print(f"🔒 授權 Chat ID: {self.allowed_chat_id}")

    # ── Telegram API helpers ──────────────────────────────────────

    def _tg(self, method: str, **kwargs) -> dict:
        """呼叫 Telegram Bot API"""
        url = f"https://api.telegram.org/bot{self.token}/{method}"
        try:
            resp = requests.post(url, json=kwargs, timeout=30)
            return resp.json()
        except Exception as e:
            print(f"❌ Telegram API 錯誤: {e}")
            return {"ok": False, "error": str(e)}

    def send(self, chat_id: str, text: str, parse_mode: str = "Markdown") -> None:
        """發送訊息（自動切割超過 4096 字元的長訊息）"""
        limit = 4000
        if len(text) <= limit:
            self._tg("sendMessage", chat_id=chat_id, text=text, parse_mode=parse_mode)
            return
        # 長訊息切割
        chunks = [text[i:i+limit] for i in range(0, len(text), limit)]
        for i, chunk in enumerate(chunks):
            suffix = f"\n\n_（{i+1}/{len(chunks)}）_" if len(chunks) > 1 else ""
            self._tg("sendMessage", chat_id=chat_id, text=chunk + suffix, parse_mode=parse_mode)
            time.sleep(0.3)

    def send_typing(self, chat_id: str) -> None:
        """顯示「正在輸入...」"""
        self._tg("sendChatAction", chat_id=chat_id, action="typing")

    def get_updates(self, offset: int = 0) -> dict:
        return self._tg("getUpdates", offset=offset, timeout=30, allowed_updates=["message"])

    def get_me(self) -> dict:
        return self._tg("getMe")

    # ── Prompt 載入 ────────────────────────────────────────────────

    def _load_prompt(self, role: str) -> str:
        """載入角色 prompt（使用快取）"""
        if role in self._prompts_cache:
            return self._prompts_cache[role]

        member = TEAM_MEMBERS.get(role)
        if not member:
            return ""

        prompt_path = PROMPTS_DIR / member["prompt_file"]
        try:
            content = prompt_path.read_text(encoding="utf-8")
            self._prompts_cache[role] = content
            return content
        except FileNotFoundError:
            print(f"⚠️ 找不到 prompt 檔案: {prompt_path}")
            return f"你是 Dori & Rito 的{member['name']}，請用專業角度回答問題。"

    # ── 指令處理 ────────────────────────────────────────────────────

    def cmd_start(self, chat_id: str) -> None:
        msg = """🐕 *Dori & Rito 遠端指揮中心*

嗨 Eric & Pennee！我是你們的 AI 虛擬團隊助手 🤖

在外面時，直接對我下指令，虛擬團隊成員會立刻執行任務！

*快速開始：*
• `/team` — 查看所有虛擬團隊成員
• `/help` — 完整使用說明
• `/status` — 服務狀態

*範例：*
`/mkt 幫我寫狗狗分離焦慮的 IG 文案`
`/cs 客戶問說初次上課要準備什麼，幫我回覆`"""
        self.send(chat_id, msg)

    def cmd_team(self, chat_id: str) -> None:
        lines = ["👥 *虛擬團隊成員*\n"]
        for role, info in TEAM_MEMBERS.items():
            lines.append(
                f"{info['emoji']} `/{role}` *{info['name']}*\n"
                f"   _{info['description']}_\n"
            )
        lines.append("\n*使用方式：* `/[角色] [你的任務描述]`")
        self.send(chat_id, "\n".join(lines))

    def cmd_help(self, chat_id: str) -> None:
        msg = """📖 *使用說明*

*指派任務給虛擬團隊：*
```
/[角色] [任務描述]
```

*範例：*
`/trainer 設計一套 6 堂的分離焦慮訓練課程`
`/mkt 寫一篇關於「牽繩暴衝」的部落格開頭`
`/seo 分析台北訓狗師這個關鍵字的競爭度`
`/cs 客戶說狗狗對小孩很兇，怎麼回覆比較好？`
`/head 評估要不要開設線上課程，分析利弊`
`/designer 狗狗萬聖節貼文需要什麼視覺元素？`

*通用指令：*
`/start` — 歡迎頁面
`/team` — 團隊成員列表
`/status` — 系統狀態
`/help` — 本說明

*小提示：*
• 任務描述越詳細，回覆品質越好
• 可以用中文或英文下指令
• 長篇回覆會自動分段發送"""
        self.send(chat_id, msg)

    def cmd_status(self, chat_id: str) -> None:
        # 測試 Claude 連線
        try:
            self.claude.messages.create(
                model="claude-opus-4-6",
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}]
            )
            claude_status = "✅ 正常"
        except Exception as e:
            claude_status = f"❌ 異常：{str(e)[:40]}"

        msg = f"""📊 *系統狀態*

🤖 Claude AI：{claude_status}
📱 Telegram Bot：✅ 運作中
👥 虛擬團隊：✅ {len(TEAM_MEMBERS)} 位成員就緒
📁 Prompts 目錄：{'✅ 找到' if PROMPTS_DIR.exists() else '❌ 找不到'}

*已載入角色：* {', '.join(f"`{r}`" for r in self._prompts_cache) or '尚未呼叫'}"""
        self.send(chat_id, msg)

    def cmd_role(self, chat_id: str, role: str, task: str) -> None:
        """呼叫虛擬團隊成員執行任務"""
        if not task.strip():
            info = TEAM_MEMBERS[role]
            self.send(
                chat_id,
                f"{info['emoji']} *{info['name']}* 在線上！\n\n"
                f"請告訴我你的任務：\n`/{role} [任務描述]`\n\n"
                f"*我擅長：* {info['description']}"
            )
            return

        info = TEAM_MEMBERS[role]
        self.send_typing(chat_id)
        self.send(chat_id, f"{info['emoji']} *{info['name']}* 正在處理...", parse_mode="Markdown")

        system_prompt = self._load_prompt(role)
        if not system_prompt:
            system_prompt = f"你是 Dori & Rito 的{info['name']}，請用專業角度回答問題。"

        try:
            self.send_typing(chat_id)
            response = self.claude.messages.create(
                model="claude-opus-4-6",
                max_tokens=2000,
                system=system_prompt,
                messages=[{"role": "user", "content": task}]
            )
            answer = response.content[0].text
            # 在回覆前加上角色標頭
            header = f"{info['emoji']} *{info['name']} 的回覆：*\n\n"
            self.send(chat_id, header + answer)

        except Exception as e:
            self.send(chat_id, f"❌ 錯誤：{str(e)}", parse_mode=None)

    # ── 主訊息路由 ─────────────────────────────────────────────────

    def _is_authorized(self, chat_id: str) -> bool:
        """只允許授權的 Chat ID"""
        if not self.allowed_chat_id:
            return True  # 未設定時允許所有人（開發模式）
        return str(chat_id) == str(self.allowed_chat_id)

    def handle_message(self, message: dict) -> None:
        chat_id = str(message["chat"]["id"])
        text = message.get("text", "").strip()
        user = message.get("from", {}).get("first_name", "Unknown")

        if not text:
            return

        # 安全驗證
        if not self._is_authorized(chat_id):
            print(f"⛔ 未授權訪問 — chat_id: {chat_id}, user: {user}")
            self.send(chat_id, "⛔ 抱歉，這個 Bot 是 Dori & Rito 私用的。", parse_mode=None)
            return

        print(f"📩 [{user}] {text[:60]}")

        # 解析指令
        if not text.startswith("/"):
            self.send(
                chat_id,
                "💡 請使用指令格式，例如：\n`/mkt 寫一篇狗狗焦慮的 IG 文案`\n\n輸入 `/help` 查看所有指令"
            )
            return

        parts = text.split(maxsplit=1)
        cmd = parts[0].lower().lstrip("/").split("@")[0]  # 去掉 @botname
        args = parts[1] if len(parts) > 1 else ""

        if cmd == "start":
            self.cmd_start(chat_id)
        elif cmd == "help":
            self.cmd_help(chat_id)
        elif cmd == "team":
            self.cmd_team(chat_id)
        elif cmd == "status":
            self.cmd_status(chat_id)
        elif cmd in TEAM_MEMBERS:
            self.cmd_role(chat_id, cmd, args)
        else:
            self.send(
                chat_id,
                f"🤔 不認識指令 `/{cmd}`\n\n輸入 `/help` 查看所有可用指令"
            )

    # ── 主迴圈 ─────────────────────────────────────────────────────

    def run(self) -> None:
        me = self.get_me()
        if not me.get("ok"):
            print(f"❌ Bot Token 無效：{me}")
            sys.exit(1)

        bot_name = me["result"]["username"]
        print(f"\n🤖 @{bot_name} 已啟動")
        print(f"📡 監聽訊息中... (Ctrl+C 停止)\n")

        error_count = 0
        while True:
            try:
                updates = self.get_updates(offset=self.last_update_id + 1)

                if updates.get("ok") and updates.get("result"):
                    for update in updates["result"]:
                        self.last_update_id = update["update_id"]
                        if "message" in update:
                            try:
                                self.handle_message(update["message"])
                            except Exception as e:
                                print(f"❌ 處理訊息失敗: {e}")

                error_count = 0
                time.sleep(1)

            except KeyboardInterrupt:
                print("\n👋 Bot 已停止")
                break
            except Exception as e:
                error_count += 1
                wait = min(30, 5 * error_count)
                print(f"⚠️ 主迴圈錯誤 ({error_count}): {e}，{wait}s 後重試...")
                time.sleep(wait)


if __name__ == "__main__":
    bot = TelegramCommander()
    bot.run()
