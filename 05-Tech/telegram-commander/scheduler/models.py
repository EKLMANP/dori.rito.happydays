"""
資料模型 — 對應 Google Sheet 的排課資料結構
"""

from dataclasses import dataclass, field
from datetime import date, time, datetime, timezone, timedelta
from typing import Optional

# 台北時區 (UTC+8)
TZ_TAIPEI = timezone(timedelta(hours=8))


# Google Sheet 欄位對應（A~H）
SHEET_COLUMNS = {
    "dog_name": 0,       # A: 狗狗名字
    "client_email": 1,   # B: 客戶 Email
    "first_date": 2,     # C: 第一堂日期
    "class_time": 3,     # D: 上課時間
    "total_classes": 4,  # E: 總堂數
    "address": 5,        # F: 上課地址
    "teacher_email": 6,  # G: 老師 Email
    "status": 7,         # H: 狀態
}

# Calendar 事件標題格式
EVENT_TITLE_TEMPLATE = "【Dori&Rito】{dog_name}_1對1課程_W{week}/{total}"


@dataclass
class CourseRecord:
    """一筆排課資料（對應 Sheet 的一列）"""
    dog_name: str
    client_email: str
    first_date: date
    class_time: time
    total_classes: int
    address: str
    teacher_email: str
    status: str
    row_index: int  # Sheet 中的列號（1-based，含標題列）

    @classmethod
    def from_sheet_row(cls, row_values: list, row_index: int) -> Optional["CourseRecord"]:
        """從 Sheet 一列資料解析為 CourseRecord"""
        try:
            dog_name = str(row_values[0]).strip()
            if not dog_name:
                return None

            client_email = str(row_values[1]).strip()

            # 解析日期（Sheet 回傳格式可能是 serial number 或字串）
            first_date = _parse_date(row_values[2])
            if not first_date:
                return None

            # 解析時間
            class_time = _parse_time(row_values[3])
            if not class_time:
                return None

            total_classes = int(row_values[4]) if row_values[4] else 0
            address = str(row_values[5]).strip() if len(row_values) > 5 else ""
            teacher_email = str(row_values[6]).strip() if len(row_values) > 6 else ""
            status = str(row_values[7]).strip() if len(row_values) > 7 else ""

            return cls(
                dog_name=dog_name,
                client_email=client_email,
                first_date=first_date,
                class_time=class_time,
                total_classes=total_classes,
                address=address,
                teacher_email=teacher_email,
                status=status,
                row_index=row_index,
            )
        except (IndexError, ValueError, TypeError) as e:
            print(f"⚠️ 解析第 {row_index} 列失敗: {e}")
            return None

    @property
    def is_scheduled(self) -> bool:
        return "✅" in self.status

    @property
    def needs_scheduling(self) -> bool:
        return "✅" not in self.status and "⏳" not in self.status

    def get_event_title(self, week: int) -> str:
        return EVENT_TITLE_TEMPLATE.format(
            dog_name=self.dog_name,
            week=week,
            total=self.total_classes,
        )

    def get_class_datetime(self, week: int) -> datetime:
        """取得第 N 堂課的開始時間"""
        from datetime import timedelta
        d = self.first_date + timedelta(weeks=week - 1)
        return datetime.combine(d, self.class_time)


@dataclass
class CalendarEvent:
    """行事曆事件的簡化表示"""
    event_id: str
    title: str
    start: datetime
    end: datetime
    week_number: int  # 從標題解析的 W 數字
    total_weeks: int  # 從標題解析的總堂數
    dog_name: str     # 從標題解析的狗狗名字

    @property
    def is_past(self) -> bool:
        return self.start < datetime.now(TZ_TAIPEI)

    @property
    def date_str(self) -> str:
        weekdays = ["一", "二", "三", "四", "五", "六", "日"]
        wd = weekdays[self.start.weekday()]
        return f"{self.start.month}/{self.start.day}（{wd}）"

    @property
    def time_str(self) -> str:
        return self.start.strftime("%H:%M")


# ── 輔助函式 ──────────────────────────────────────────────


def _parse_date(value) -> Optional[date]:
    """解析各種日期格式"""
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value

    s = str(value).strip()
    if not s:
        return None

    # Google Sheets serial number (天數從 1899-12-30 起算)
    try:
        serial = float(s)
        if serial > 40000:  # 合理的日期範圍
            from datetime import timedelta
            base = date(1899, 12, 30)
            return base + timedelta(days=int(serial))
    except ValueError:
        pass

    # 常見字串格式
    for fmt in ("%Y/%m/%d", "%Y-%m-%d", "%Y/%m/%d %H:%M:%S", "%m/%d/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue

    return None


def _parse_time(value) -> Optional[time]:
    """解析各種時間格式"""
    if isinstance(value, time):
        return value
    if isinstance(value, datetime):
        return value.time()

    s = str(value).strip()
    if not s:
        return None

    # Google Sheets 時間 serial (0~1 的小數，代表一天中的比例)
    try:
        serial = float(s)
        if 0 <= serial < 1:
            total_minutes = int(serial * 24 * 60)
            return time(total_minutes // 60, total_minutes % 60)
    except ValueError:
        pass

    # 字串格式
    for fmt in ("%H:%M", "%H:%M:%S", "%I:%M %p"):
        try:
            return datetime.strptime(s, fmt).time()
        except ValueError:
            continue

    # 嘗試從 datetime 字串取時間部分 (e.g. "1899-12-30T11:00:00.000Z")
    if "T" in s:
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00")).time()
        except ValueError:
            pass

    return None


def parse_user_date(text: str) -> Optional[date]:
    """解析使用者輸入的日期（如 4/12 或 2026/4/12）"""
    text = text.strip().replace("-", "/")

    # 補年份
    if text.count("/") == 1:
        text = f"{datetime.now().year}/{text}"

    for fmt in ("%Y/%m/%d", "%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def parse_user_time(text: str) -> Optional[time]:
    """解析使用者輸入的時間（如 14:00）"""
    text = text.strip()
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(text, fmt).time()
        except ValueError:
            continue
    return None


def parse_user_datetime(text: str) -> tuple[Optional[date], Optional[time]]:
    """解析使用者輸入的日期+時間（如 '4/12 14:00' 或 '4/12'）"""
    parts = text.strip().split()
    d = parse_user_date(parts[0]) if parts else None
    t = parse_user_time(parts[1]) if len(parts) > 1 else None
    return d, t
