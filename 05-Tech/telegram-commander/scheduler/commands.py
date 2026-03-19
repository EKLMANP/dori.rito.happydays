"""
排課指令處理器 — /排課 /補課 /調課
===================================
處理 Telegram 文字指令和 Inline Keyboard 回調。
使用 ConversationManager 管理多步驟流程。
"""

import json
from datetime import datetime, timedelta, date, time

from .conversation import ConversationManager
from .google_client import GoogleClient
from .models import (
    CourseRecord,
    CalendarEvent,
    TZ_TAIPEI,
    parse_user_date,
    parse_user_time,
    parse_user_datetime,
)
from .email_templates import (
    reschedule_email,
    schedule_email,
    MODE_DESCRIPTIONS,
)


class SchedulerCommands:
    """排課系統指令處理器"""

    # 支援的指令
    COMMANDS = {"排課", "schedule", "補課", "supplement", "調課", "reschedule"}

    def __init__(self, bot):
        """
        Args:
            bot: TelegramCommander 實例（用於發送訊息）
        """
        self.bot = bot
        self.google = GoogleClient()
        self.conv = ConversationManager()

    # ═══════════════════════════════════════════════════════
    # 公開介面
    # ═══════════════════════════════════════════════════════

    def handle_command(self, chat_id: str, cmd: str, args: str) -> bool:
        """處理文字指令，回傳 True 表示已處理"""
        if cmd in ("排課", "schedule"):
            self._start_schedule(chat_id)
            return True
        if cmd in ("補課", "supplement"):
            self._start_supplement(chat_id)
            return True
        if cmd in ("調課", "reschedule"):
            self._start_reschedule(chat_id)
            return True
        return False

    def handle_callback(self, chat_id: str, callback_data: str) -> bool:
        """處理 Inline Keyboard 回調，回傳 True 表示已處理"""
        # 格式: flow:action:value
        parts = callback_data.split(":", 2)
        if len(parts) < 2:
            return False

        flow = parts[0]
        action = parts[1]
        value = parts[2] if len(parts) > 2 else ""

        if flow == "sch":
            self._handle_schedule_callback(chat_id, action, value)
            return True
        if flow == "sup":
            self._handle_supplement_callback(chat_id, action, value)
            return True
        if flow == "rsch":
            self._handle_reschedule_callback(chat_id, action, value)
            return True
        if flow == "cancel":
            self.conv.end(chat_id)
            self.bot.send(chat_id, "❌ 已取消操作", parse_mode=None)
            return True

        return False

    def handle_text_input(self, chat_id: str, text: str) -> bool:
        """處理對話中的文字輸入，回傳 True 表示已處理"""
        session = self.conv.get(chat_id)
        if not session:
            return False

        session.touch()

        if session.flow == "reschedule" and session.step == "input_date":
            self._reschedule_process_date(chat_id, text)
            return True
        if session.flow == "supplement" and session.step == "input_week":
            self._supplement_process_week(chat_id, text)
            return True

        return False

    # ═══════════════════════════════════════════════════════
    # 排課流程 (/排課)
    # ═══════════════════════════════════════════════════════

    def _start_schedule(self, chat_id: str):
        """步驟 1：顯示未排課的學員列表"""
        try:
            courses = self.google.get_unscheduled_courses()
        except Exception as e:
            self.bot.send(chat_id, f"❌ 讀取排課資料失敗：{e}", parse_mode=None)
            return

        if not courses:
            self.bot.send(chat_id, "🎉 沒有需要排課的新學員！", parse_mode=None)
            return

        session = self.conv.start(chat_id, "schedule", "select_student")
        session.data["courses"] = {str(c.row_index): c for c in courses}

        # 建立 Inline Keyboard
        keyboard = []
        for c in courses:
            keyboard.append(
                [{"text": f"🐕 {c.dog_name}", "callback_data": f"sch:sel:{c.row_index}"}]
            )
        keyboard.append([{"text": "❌ 取消", "callback_data": "cancel:x:x"}])

        self._send_with_keyboard(
            chat_id,
            f"📋 *排課系統*\n\n發現 {len(courses)} 位待排課學員：",
            keyboard,
        )

    def _handle_schedule_callback(self, chat_id: str, action: str, value: str):
        session = self.conv.get(chat_id)
        if not session:
            self.bot.send(chat_id, "⏰ 操作已過期，請重新輸入 /排課", parse_mode=None)
            return

        if action == "sel":
            # 選了一個學員
            course = session.data["courses"].get(value)
            if not course:
                self.bot.send(chat_id, "❌ 找不到該學員", parse_mode=None)
                return

            session.data["selected"] = course
            session.step = "confirm"
            session.touch()

            # 計算課程日期預覽
            preview = self._format_schedule_preview(course)
            keyboard = [
                [{"text": "✅ 確認排課", "callback_data": "sch:confirm:y"}],
                [{"text": "❌ 取消", "callback_data": "cancel:x:x"}],
            ]

            self._send_with_keyboard(
                chat_id,
                f"📋 *排課確認*\n\n"
                f"🐕 *{course.dog_name}*\n"
                f"📧 {course.client_email}\n"
                f"📚 共 {course.total_classes} 堂\n"
                f"⏰ {course.class_time.strftime('%H:%M')}\n"
                f"📍 {course.address}\n\n"
                f"*課程日期：*\n{preview}\n\n"
                f"確定要建立行事曆邀請嗎？",
                keyboard,
            )

        elif action == "confirm":
            course = session.data.get("selected")
            if not course:
                return
            self.conv.end(chat_id)
            self._execute_schedule(chat_id, course)

    def _execute_schedule(self, chat_id: str, course: CourseRecord):
        """執行排課"""
        self.bot.send(chat_id, f"⏳ 正在為 {course.dog_name} 建立 {course.total_classes} 堂課程...", parse_mode=None)

        try:
            event_ids = self.google.create_course_events(course)
            today_str = datetime.now(TZ_TAIPEI).strftime("%-m/%-d/%Y")
            self.google.update_sheet_status(
                course.row_index,
                f"✅ 排課完成 ({today_str})",
            )
            self.google.set_row_color(
                course.row_index,
                {"red": 0.9, "green": 0.96, "blue": 0.91, "alpha": 1},
            )
            self.bot.send(
                chat_id,
                f"🎉 *排課完成！*\n\n"
                f"🐕 {course.dog_name}\n"
                f"📚 已建立 {len(event_ids)} 堂課程\n"
                f"📧 邀請已寄送給 {course.client_email}\n"
                f"{'📧 副本：' + course.teacher_email if course.teacher_email else ''}",
            )
        except Exception as e:
            self.bot.send(chat_id, f"❌ 排課失敗：{e}", parse_mode=None)

    # ═══════════════════════════════════════════════════════
    # 補課流程 (/補課)
    # ═══════════════════════════════════════════════════════

    def _start_supplement(self, chat_id: str):
        """步驟 1：顯示已排課的學員列表"""
        try:
            courses = self.google.get_active_courses()
        except Exception as e:
            self.bot.send(chat_id, f"❌ 讀取資料失敗：{e}", parse_mode=None)
            return

        if not courses:
            self.bot.send(chat_id, "⚠️ 沒有找到已排課的學員", parse_mode=None)
            return

        session = self.conv.start(chat_id, "supplement", "select_student")
        session.data["courses"] = {str(c.row_index): c for c in courses}

        keyboard = []
        for c in courses:
            keyboard.append(
                [{"text": f"🐕 {c.dog_name}", "callback_data": f"sup:sel:{c.row_index}"}]
            )
        keyboard.append([{"text": "❌ 取消", "callback_data": "cancel:x:x"}])

        self._send_with_keyboard(
            chat_id,
            f"📌 *補寄邀請*\n\n請選擇要補寄的學員：",
            keyboard,
        )

    def _handle_supplement_callback(self, chat_id: str, action: str, value: str):
        session = self.conv.get(chat_id)
        if not session:
            self.bot.send(chat_id, "⏰ 操作已過期，請重新輸入 /補課", parse_mode=None)
            return

        if action == "sel":
            course = session.data["courses"].get(value)
            if not course:
                return
            session.data["selected"] = course
            session.step = "input_week"
            session.touch()

            self.bot.send(
                chat_id,
                f"🐕 *{course.dog_name}*\n"
                f"📚 共 {course.total_classes} 堂\n\n"
                f"請輸入要從「第幾堂」開始補寄邀請？\n"
                f"（例如：已上完第1堂，輸入 `2`）",
            )

        elif action == "confirm":
            course = session.data.get("selected")
            from_week = session.data.get("from_week")
            if not course or not from_week:
                return
            self.conv.end(chat_id)
            self._execute_supplement(chat_id, course, from_week)

    def _supplement_process_week(self, chat_id: str, text: str):
        """處理使用者輸入的堂數"""
        session = self.conv.get(chat_id)
        if not session:
            return

        try:
            week = int(text.strip())
        except ValueError:
            self.bot.send(chat_id, "❌ 請輸入數字", parse_mode=None)
            return

        course = session.data.get("selected")
        if not course:
            return

        if week < 1 or week > course.total_classes:
            self.bot.send(
                chat_id,
                f"❌ 請輸入 1 到 {course.total_classes} 之間的數字",
                parse_mode=None,
            )
            return

        session.data["from_week"] = week
        session.step = "confirm"
        session.touch()

        total_to_create = course.total_classes - week + 1

        keyboard = [
            [{"text": "✅ 確認補寄", "callback_data": "sup:confirm:y"}],
            [{"text": "❌ 取消", "callback_data": "cancel:x:x"}],
        ]

        self._send_with_keyboard(
            chat_id,
            f"📌 *補寄確認*\n\n"
            f"🐕 {course.dog_name}\n"
            f"📌 補寄範圍：W{week} ～ W{course.total_classes}（共 {total_to_create} 堂）\n"
            f"📧 {course.client_email}\n\n"
            f"確定要補寄行事曆邀請嗎？",
            keyboard,
        )

    def _execute_supplement(self, chat_id: str, course: CourseRecord, from_week: int):
        """執行補寄"""
        total = course.total_classes - from_week + 1
        self.bot.send(chat_id, f"⏳ 正在補寄 W{from_week}～W{course.total_classes}（{total} 堂）...", parse_mode=None)

        try:
            event_ids = self.google.create_course_events(course, from_week=from_week)
            today_str = datetime.now(TZ_TAIPEI).strftime("%-m/%-d/%Y")
            self.google.update_sheet_status(
                course.row_index,
                f"✅ 補寄 W{from_week}-W{course.total_classes} ({today_str})",
            )
            self.bot.send(
                chat_id,
                f"🎉 *補寄完成！*\n\n"
                f"🐕 {course.dog_name}\n"
                f"📚 已建立 {len(event_ids)} 堂課程（W{from_week}～W{course.total_classes}）\n"
                f"📧 邀請已寄送給 {course.client_email}",
            )
        except Exception as e:
            self.bot.send(chat_id, f"❌ 補寄失敗：{e}", parse_mode=None)

    # ═══════════════════════════════════════════════════════
    # 調課流程 (/調課)
    # ═══════════════════════════════════════════════════════

    def _start_reschedule(self, chat_id: str):
        """步驟 1：顯示有課程的學員列表"""
        try:
            courses = self.google.get_active_courses()
        except Exception as e:
            self.bot.send(chat_id, f"❌ 讀取資料失敗：{e}", parse_mode=None)
            return

        if not courses:
            self.bot.send(chat_id, "⚠️ 沒有找到已排課的學員", parse_mode=None)
            return

        session = self.conv.start(chat_id, "reschedule", "select_student")
        session.data["courses"] = {c.dog_name: c for c in courses}

        keyboard = []
        for c in courses:
            keyboard.append(
                [{"text": f"🐕 {c.dog_name}", "callback_data": f"rsch:sel:{c.dog_name}"}]
            )
        keyboard.append([{"text": "❌ 取消", "callback_data": "cancel:x:x"}])

        self._send_with_keyboard(
            chat_id,
            "📅 *智慧調課*\n\n請選擇要調整的學員：",
            keyboard,
        )

    def _handle_reschedule_callback(self, chat_id: str, action: str, value: str):
        session = self.conv.get(chat_id)
        if not session:
            self.bot.send(chat_id, "⏰ 操作已過期，請重新輸入 /調課", parse_mode=None)
            return

        if action == "sel":
            # 選了學員 → 顯示課表 + 選模式
            dog_name = value
            course = session.data["courses"].get(dog_name)
            if not course:
                return

            session.data["selected"] = course
            session.data["dog_name"] = dog_name
            session.touch()

            # 從 Calendar 讀取實際課程
            try:
                events = self.google.find_events_by_dog(dog_name)
            except Exception as e:
                self.bot.send(chat_id, f"❌ 讀取行事曆失敗：{e}", parse_mode=None)
                return

            if not events:
                self.bot.send(chat_id, f"⚠️ 找不到 {dog_name} 的行事曆事件", parse_mode=None)
                return

            session.data["events"] = events
            session.step = "select_mode"

            # 格式化課表
            schedule_text = self._format_event_list(events)
            keyboard = [
                [{"text": "A: 改日期（時間不變）", "callback_data": "rsch:mode:A"}],
                [{"text": "B: 改日期+時間", "callback_data": "rsch:mode:B"}],
                [{"text": "C: 單堂補課", "callback_data": "rsch:mode:C"}],
                [{"text": "❌ 取消", "callback_data": "cancel:x:x"}],
            ]

            self._send_with_keyboard(
                chat_id,
                f"🐕 *{dog_name}* 目前課程：\n{schedule_text}\n\n請選擇調課模式：",
                keyboard,
            )

        elif action == "mode":
            # 選了模式 → 選堂數
            mode = value
            session.data["mode"] = mode
            session.step = "select_week"
            session.touch()

            events = session.data.get("events", [])
            # 只顯示未來的堂次
            future = [e for e in events if not e.is_past]
            if not future:
                future = events  # 沒有未來的就全部顯示

            keyboard = []
            for e in future:
                label = f"W{e.week_number}: {e.date_str} {e.time_str}"
                keyboard.append(
                    [{"text": label, "callback_data": f"rsch:week:{e.week_number}"}]
                )
            keyboard.append([{"text": "❌ 取消", "callback_data": "cancel:x:x"}])

            mode_desc = {"A": "改日期", "B": "改日期+時間", "C": "單堂補課"}.get(mode, mode)
            self._send_with_keyboard(
                chat_id,
                f"*模式 {mode}：{mode_desc}*\n\n請選擇要從哪一堂開始調整：",
                keyboard,
            )

        elif action == "week":
            # 選了堂數 → 要求輸入日期
            week = int(value)
            session.data["target_week"] = week
            session.step = "input_date"
            session.touch()

            mode = session.data.get("mode", "A")
            if mode == "A":
                prompt = "請輸入新日期（例如 `4/12` 或 `2026/4/12`）："
            else:
                prompt = "請輸入新日期和時間（例如 `4/12 15:00`）："

            self.bot.send(chat_id, prompt)

        elif action == "confirm":
            # 確認執行
            self.conv.end(chat_id)
            self._execute_reschedule(chat_id, session.data)

    def _reschedule_process_date(self, chat_id: str, text: str):
        """處理使用者輸入的日期/時間"""
        session = self.conv.get(chat_id)
        if not session:
            return

        mode = session.data.get("mode", "A")
        target_week = session.data.get("target_week")
        events = session.data.get("events", [])
        dog_name = session.data.get("dog_name", "")

        if mode == "A":
            new_date = parse_user_date(text)
            if not new_date:
                self.bot.send(chat_id, "❌ 日期格式錯誤，請重新輸入（例如 `4/12`）")
                return
            session.data["new_date"] = new_date
        else:
            new_date, new_time = parse_user_datetime(text)
            if not new_date or not new_time:
                self.bot.send(chat_id, "❌ 格式錯誤，請重新輸入（例如 `4/12 15:00`）")
                return
            session.data["new_date"] = new_date
            session.data["new_time"] = new_time

        # 計算變更預覽
        preview = self._format_reschedule_preview(session.data, events)

        # 取得客戶 email
        client_email = ""
        course = session.data.get("selected")
        if course:
            client_email = course.client_email
        if not client_email:
            client_email = self.google.get_client_email_from_events(events)
        session.data["client_email"] = client_email

        session.step = "confirm"
        session.touch()

        keyboard = [
            [{"text": "✅ 確認執行", "callback_data": "rsch:confirm:y"}],
            [{"text": "❌ 取消", "callback_data": "cancel:x:x"}],
        ]

        email_line = f"📧 通知：{client_email}" if client_email else "⚠️ 未找到客戶 Email"
        mode_desc = MODE_DESCRIPTIONS.get(mode, mode)

        self._send_with_keyboard(
            chat_id,
            f"📋 *調課確認*\n\n"
            f"🐕 {dog_name} — 模式 {mode}\n"
            f"📝 {mode_desc}\n\n"
            f"{preview}\n\n"
            f"{email_line}",
            keyboard,
        )

    def _execute_reschedule(self, chat_id: str, data: dict):
        """執行調課"""
        mode = data.get("mode")
        dog_name = data.get("dog_name")
        target_week = data.get("target_week")
        new_date = data.get("new_date")
        new_time = data.get("new_time")
        client_email = data.get("client_email", "")
        events = data.get("events", [])

        self.bot.send(chat_id, f"⏳ 正在調整 {dog_name} 的課程...", parse_mode=None)

        try:
            if mode == "A":
                changes = self.google.reschedule_mode_a(dog_name, target_week, new_date)
            elif mode == "B":
                new_dt = datetime.combine(new_date, new_time, tzinfo=TZ_TAIPEI)
                changes = self.google.reschedule_mode_b(dog_name, target_week, new_dt)
            elif mode == "C":
                new_dt = datetime.combine(new_date, new_time, tzinfo=TZ_TAIPEI)
                changes = self.google.reschedule_mode_c(dog_name, target_week, new_dt)
            else:
                self.bot.send(chat_id, "❌ 不支援的模式", parse_mode=None)
                return

            if not changes:
                self.bot.send(chat_id, "⚠️ 沒有事件被調整", parse_mode=None)
                return

            # 寄送通知 Email
            email_sent = False
            if client_email:
                target_event = next((e for e in events if e.week_number == target_week), None)
                original_time = target_event.start.strftime("%Y/%m/%d %H:%M") if target_event else "N/A"

                if mode == "A":
                    new_time_str = f"{new_date.strftime('%Y/%-m/%-d')} (時間不變)"
                else:
                    new_time_str = f"{new_date.strftime('%Y/%-m/%-d')} {new_time.strftime('%H:%M')}"

                subject, body = reschedule_email(
                    dog_name=dog_name,
                    mode_desc=MODE_DESCRIPTIONS.get(mode, mode),
                    original_time=original_time,
                    new_time=new_time_str,
                )
                email_sent = self.google.send_email(client_email, subject, body)

            email_msg = "📧 通知信已寄出" if email_sent else "⚠️ 通知信未發送"
            self.bot.send(
                chat_id,
                f"✅ *調課完成！*\n\n"
                f"🐕 {dog_name}\n"
                f"📅 已調整 {len(changes)} 堂課\n"
                f"{email_msg}",
            )

        except Exception as e:
            self.bot.send(chat_id, f"❌ 調課失敗：{e}", parse_mode=None)

    # ═══════════════════════════════════════════════════════
    # 格式化輔助
    # ═══════════════════════════════════════════════════════

    def _format_schedule_preview(self, course: CourseRecord) -> str:
        """格式化排課預覽"""
        lines = []
        for k in range(course.total_classes):
            dt = course.get_class_datetime(k + 1)
            weekdays = ["一", "二", "三", "四", "五", "六", "日"]
            wd = weekdays[dt.weekday()]
            lines.append(
                f"  W{k+1}: {dt.month}/{dt.day}（{wd}）{dt.strftime('%H:%M')}"
            )
        return "\n".join(lines)

    def _format_event_list(self, events: list[CalendarEvent]) -> str:
        """格式化行事曆事件列表"""
        lines = []
        now = datetime.now(TZ_TAIPEI)
        for e in events:
            status = "✅" if e.start < now else "⬜"
            lines.append(f"  {status} W{e.week_number} {e.date_str} {e.time_str}")
        return "\n".join(lines)

    def _format_reschedule_preview(self, data: dict, events: list[CalendarEvent]) -> str:
        """格式化調課變更預覽"""
        mode = data.get("mode", "A")
        target_week = data.get("target_week")
        new_date = data.get("new_date")
        new_time = data.get("new_time")

        target_events = [e for e in events if e.week_number >= target_week]
        if not target_events:
            return "（無可調整的堂次）"

        target = next((e for e in target_events if e.week_number == target_week), None)
        if not target:
            return "（找不到目標堂次）"

        lines = []
        if mode == "A":
            day_diff = (new_date - target.start.date()).days
            for e in target_events:
                old = e.start
                new = old + timedelta(days=day_diff)
                weekdays = ["一", "二", "三", "四", "五", "六", "日"]
                wd = weekdays[new.weekday()]
                lines.append(
                    f"  W{e.week_number}: {old.month}/{old.day} → "
                    f"{new.month}/{new.day}（{wd}）{old.strftime('%H:%M')}"
                )
        elif mode == "B":
            new_dt = datetime.combine(new_date, new_time, tzinfo=TZ_TAIPEI)
            time_diff = new_dt - target.start
            for e in target_events:
                old = e.start
                new = old + time_diff
                weekdays = ["一", "二", "三", "四", "五", "六", "日"]
                wd = weekdays[new.weekday()]
                lines.append(
                    f"  W{e.week_number}: {old.month}/{old.day} {old.strftime('%H:%M')} → "
                    f"{new.month}/{new.day}（{wd}）{new.strftime('%H:%M')}"
                )
        elif mode == "C":
            new_dt = datetime.combine(new_date, new_time, tzinfo=TZ_TAIPEI)
            diff_days = (new_date - target.start.date()).days
            weeks_shift = round(diff_days / 7)
            for e in target_events:
                old = e.start
                if e.week_number == target_week:
                    new = new_dt
                else:
                    new = old + timedelta(weeks=weeks_shift)
                weekdays = ["一", "二", "三", "四", "五", "六", "日"]
                wd = weekdays[new.weekday()]
                if e.week_number == target_week:
                    lines.append(
                        f"  W{e.week_number}: {old.month}/{old.day} {old.strftime('%H:%M')} → "
                        f"{new.month}/{new.day}（{wd}）{new.strftime('%H:%M')} ★"
                    )
                else:
                    lines.append(
                        f"  W{e.week_number}: {old.month}/{old.day} → "
                        f"{new.month}/{new.day}（{wd}）{old.strftime('%H:%M')}"
                    )

        return "\n".join(lines)

    def _send_with_keyboard(self, chat_id: str, text: str, keyboard: list):
        """發送帶有 Inline Keyboard 的訊息"""
        reply_markup = json.dumps({"inline_keyboard": keyboard})
        self.bot._tg(
            "sendMessage",
            chat_id=chat_id,
            text=text,
            parse_mode="Markdown",
            reply_markup=reply_markup,
        )
