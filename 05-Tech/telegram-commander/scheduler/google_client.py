"""
Google API 整合層 — Calendar + Sheets + Gmail
==============================================
處理所有與 Google 服務的互動：
- Calendar：建立/修改/搜尋課程事件
- Sheets：讀取/更新排課資料
- Gmail：寄送通知信
"""

import os
import re
import base64
from datetime import datetime, date, time, timedelta
from email.mime.text import MIMEText
from typing import Optional

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from .models import CourseRecord, CalendarEvent, SHEET_COLUMNS

# ── 環境變數 ──────────────────────────────────────────────

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_SCHEDULER_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_SCHEDULER_CLIENT_SECRET", "")
GOOGLE_REFRESH_TOKEN = os.getenv("GOOGLE_SCHEDULER_REFRESH_TOKEN", "")

GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "")
GOOGLE_SHEET_TAB = os.getenv("GOOGLE_SHEET_TAB_NAME", "Sheet1")

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/gmail.send",
]

TIMEZONE = "Asia/Taipei"


class GoogleClient:
    """Google Calendar + Sheets + Gmail 整合客戶端"""

    def __init__(self):
        if not all([GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN]):
            raise ValueError("缺少 Google OAuth 環境變數 (GOOGLE_SCHEDULER_*)")
        if not GOOGLE_SHEET_ID:
            raise ValueError("缺少 GOOGLE_SHEET_ID 環境變數")

        creds = Credentials(
            token=None,
            refresh_token=GOOGLE_REFRESH_TOKEN,
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            token_uri="https://oauth2.googleapis.com/token",
            scopes=SCOPES,
        )

        self.calendar = build("calendar", "v3", credentials=creds)
        self.sheets = build("sheets", "v4", credentials=creds)
        self.gmail = build("gmail", "v1", credentials=creds)
        print("  ✅ Google API 已連線（Calendar + Sheets + Gmail）")

    # ═══════════════════════════════════════════════════════
    # Sheets 操作
    # ═══════════════════════════════════════════════════════

    def get_all_courses(self) -> list[CourseRecord]:
        """從 Sheet 讀取所有排課資料"""
        result = (
            self.sheets.spreadsheets()
            .values()
            .get(
                spreadsheetId=GOOGLE_SHEET_ID,
                range=f"{GOOGLE_SHEET_TAB}!A2:H",
                valueRenderOption="UNFORMATTED_VALUE",
                dateTimeRenderOption="SERIAL_NUMBER",
            )
            .execute()
        )
        rows = result.get("values", [])
        courses = []
        for i, row in enumerate(rows):
            # 補齊不足的欄位
            while len(row) < 8:
                row.append("")
            record = CourseRecord.from_sheet_row(row, row_index=i + 2)
            if record:
                courses.append(record)
        return courses

    def get_active_courses(self) -> list[CourseRecord]:
        """取得已排課但未完成的學員"""
        return [c for c in self.get_all_courses() if c.is_scheduled]

    def get_unscheduled_courses(self) -> list[CourseRecord]:
        """取得尚未排課的學員"""
        return [c for c in self.get_all_courses() if c.needs_scheduling]

    def update_sheet_status(self, row_index: int, status: str) -> None:
        """更新 Sheet 狀態欄 (H 欄)"""
        self.sheets.spreadsheets().values().update(
            spreadsheetId=GOOGLE_SHEET_ID,
            range=f"{GOOGLE_SHEET_TAB}!H{row_index}",
            valueInputOption="USER_ENTERED",
            body={"values": [[status]]},
        ).execute()

    def set_row_color(self, row_index: int, color: dict) -> None:
        """設定某列的背景色"""
        sheet_id = self._get_sheet_id()
        if sheet_id is None:
            return
        self.sheets.spreadsheets().batchUpdate(
            spreadsheetId=GOOGLE_SHEET_ID,
            body={
                "requests": [
                    {
                        "repeatCell": {
                            "range": {
                                "sheetId": sheet_id,
                                "startRowIndex": row_index - 1,
                                "endRowIndex": row_index,
                                "startColumnIndex": 0,
                                "endColumnIndex": 8,
                            },
                            "cell": {
                                "userEnteredFormat": {
                                    "backgroundColor": color,
                                }
                            },
                            "fields": "userEnteredFormat.backgroundColor",
                        }
                    }
                ]
            },
        ).execute()

    def _get_sheet_id(self) -> Optional[int]:
        """取得 Sheet 的 sheetId（用於格式化）"""
        try:
            meta = (
                self.sheets.spreadsheets()
                .get(spreadsheetId=GOOGLE_SHEET_ID)
                .execute()
            )
            for sheet in meta.get("sheets", []):
                if sheet["properties"]["title"] == GOOGLE_SHEET_TAB:
                    return sheet["properties"]["sheetId"]
        except Exception:
            pass
        return None

    # ═══════════════════════════════════════════════════════
    # Calendar 操作
    # ═══════════════════════════════════════════════════════

    def create_course_events(
        self, record: CourseRecord, from_week: int = 1
    ) -> list[str]:
        """建立課程事件（從指定週次開始），回傳 event IDs"""
        event_ids = []
        for k in range(from_week - 1, record.total_classes):
            dt = record.get_class_datetime(k + 1)
            end_dt = dt + timedelta(hours=1)

            title = record.get_event_title(k + 1)
            guests = [{"email": record.client_email}]
            if record.teacher_email:
                guests.append({"email": record.teacher_email})

            event = (
                self.calendar.events()
                .insert(
                    calendarId="primary",
                    sendUpdates="all",
                    body={
                        "summary": title,
                        "location": record.address,
                        "description": (
                            f"這是第 {k + 1} 堂課，共 {record.total_classes} 堂。\n"
                            f"📍 上課地點：{record.address}\n\n"
                            f"如需請假請提前3天聯繫！"
                        ),
                        "start": {
                            "dateTime": dt.isoformat(),
                            "timeZone": TIMEZONE,
                        },
                        "end": {
                            "dateTime": end_dt.isoformat(),
                            "timeZone": TIMEZONE,
                        },
                        "attendees": guests,
                    },
                )
                .execute()
            )
            event_ids.append(event["id"])

        return event_ids

    def find_events_by_dog(
        self, dog_name: str, time_min: Optional[datetime] = None
    ) -> list[CalendarEvent]:
        """搜尋某隻狗的所有課程事件"""
        if time_min is None:
            time_min = datetime(2024, 1, 1)
        time_max = datetime.now() + timedelta(days=365)

        events_result = (
            self.calendar.events()
            .list(
                calendarId="primary",
                timeMin=time_min.isoformat() + "+08:00",
                timeMax=time_max.isoformat() + "+08:00",
                singleEvents=True,
                orderBy="startTime",
                maxResults=100,
            )
            .execute()
        )

        results = []
        for event in events_result.get("items", []):
            title = event.get("summary", "")
            if dog_name not in title or "1對1課程" not in title:
                continue

            parsed = self._parse_event_title(title)
            if not parsed:
                continue

            start_str = event["start"].get("dateTime", event["start"].get("date", ""))
            end_str = event["end"].get("dateTime", event["end"].get("date", ""))

            try:
                start = datetime.fromisoformat(start_str)
                end = datetime.fromisoformat(end_str)
            except ValueError:
                continue

            results.append(
                CalendarEvent(
                    event_id=event["id"],
                    title=title,
                    start=start,
                    end=end,
                    week_number=parsed["week"],
                    total_weeks=parsed["total"],
                    dog_name=parsed["dog_name"],
                )
            )

        return results

    def find_event_by_dog_and_week(
        self, dog_name: str, week: int
    ) -> Optional[CalendarEvent]:
        """找到特定狗的特定週次事件"""
        events = self.find_events_by_dog(dog_name)
        for e in events:
            if e.week_number == week:
                return e
        return None

    def reschedule_mode_a(
        self,
        dog_name: str,
        target_week: int,
        new_date: date,
    ) -> list[dict]:
        """模式 A：平移日期（時間不變，後續順延）"""
        events = self.find_events_by_dog(dog_name)
        target_events = [e for e in events if e.week_number >= target_week]
        if not target_events:
            return []

        target = next((e for e in target_events if e.week_number == target_week), None)
        if not target:
            return []

        # 計算日期差
        old_date = target.start.date()
        day_diff = (new_date - old_date).days

        changes = []
        for event in target_events:
            old_start = event.start
            new_start = old_start + timedelta(days=day_diff)
            new_end = event.end + timedelta(days=day_diff)

            self._update_event_time(event.event_id, new_start, new_end)
            changes.append({
                "week": event.week_number,
                "old": old_start,
                "new": new_start,
            })

        return changes

    def reschedule_mode_b(
        self,
        dog_name: str,
        target_week: int,
        new_datetime: datetime,
    ) -> list[dict]:
        """模式 B：平移日期+時間（後續全部照改）"""
        events = self.find_events_by_dog(dog_name)
        target_events = [e for e in events if e.week_number >= target_week]
        if not target_events:
            return []

        target = next((e for e in target_events if e.week_number == target_week), None)
        if not target:
            return []

        time_diff = new_datetime - target.start

        changes = []
        for event in target_events:
            old_start = event.start
            new_start = old_start + time_diff
            new_end = event.end + time_diff

            self._update_event_time(event.event_id, new_start, new_end)
            changes.append({
                "week": event.week_number,
                "old": old_start,
                "new": new_start,
            })

        return changes

    def reschedule_mode_c(
        self,
        dog_name: str,
        target_week: int,
        new_datetime: datetime,
    ) -> list[dict]:
        """模式 C：單堂補課（該堂改時間，後續依週次順延但維持原時段）"""
        events = self.find_events_by_dog(dog_name)
        target_events = [e for e in events if e.week_number >= target_week]
        if not target_events:
            return []

        target = next((e for e in target_events if e.week_number == target_week), None)
        if not target:
            return []

        # 計算週數偏移
        diff_days = (new_datetime.date() - target.start.date()).days
        weeks_shift = round(diff_days / 7)

        changes = []
        for event in target_events:
            old_start = event.start

            if event.week_number == target_week:
                # 目標堂：改為新的日期時間
                new_start = new_datetime
                new_end = new_datetime + timedelta(hours=1)
            else:
                # 後續堂：順延 N 週，但維持原時段
                shift = timedelta(weeks=weeks_shift)
                new_start = old_start + shift
                new_end = event.end + shift

            if new_start != old_start:
                self._update_event_time(event.event_id, new_start, new_end)
                changes.append({
                    "week": event.week_number,
                    "old": old_start,
                    "new": new_start,
                })

        return changes

    def _update_event_time(
        self, event_id: str, new_start: datetime, new_end: datetime
    ) -> None:
        """更新事件時間"""
        self.calendar.events().patch(
            calendarId="primary",
            eventId=event_id,
            body={
                "start": {
                    "dateTime": new_start.isoformat(),
                    "timeZone": TIMEZONE,
                },
                "end": {
                    "dateTime": new_end.isoformat(),
                    "timeZone": TIMEZONE,
                },
            },
        ).execute()

    @staticmethod
    def _parse_event_title(title: str) -> Optional[dict]:
        """解析事件標題：【Dori&Rito】Mojito_1對1課程_W4/6"""
        match = re.search(
            r"【Dori&Rito】(.+?)_1對1課程_W(\d+)/(\d+)", title
        )
        if not match:
            return None
        return {
            "dog_name": match.group(1),
            "week": int(match.group(2)),
            "total": int(match.group(3)),
        }

    # ═══════════════════════════════════════════════════════
    # Gmail 操作
    # ═══════════════════════════════════════════════════════

    def send_email(self, to: str, subject: str, body: str) -> bool:
        """透過 Gmail API 寄送 Email"""
        try:
            message = MIMEText(body, "plain", "utf-8")
            message["to"] = to
            message["subject"] = subject

            raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
            self.gmail.users().messages().send(
                userId="me", body={"raw": raw}
            ).execute()
            return True
        except Exception as e:
            print(f"⚠️ Email 發送失敗: {e}")
            return False

    def get_client_email_from_events(self, events: list[CalendarEvent]) -> str:
        """從 Calendar 事件的出席者取得客戶 Email"""
        if not events:
            return ""

        try:
            event_data = (
                self.calendar.events()
                .get(calendarId="primary", eventId=events[0].event_id)
                .execute()
            )
            for attendee in event_data.get("attendees", []):
                email = attendee.get("email", "")
                # 排除自己（organizer）和老師
                if not attendee.get("organizer") and email:
                    return email
        except Exception:
            pass
        return ""
