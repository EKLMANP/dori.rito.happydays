"""
Email 通知模板 — 排課/調課通知
"""


def reschedule_email(
    dog_name: str,
    mode_desc: str,
    original_time: str,
    new_time: str,
) -> tuple[str, str]:
    """調課通知 Email，回傳 (subject, body)"""
    subject = f"【Dori & Rito課程異動通知】 {dog_name}  1對1課程調整"
    body = (
        f"親愛的家長您好：\n\n"
        f"我們已為您更新了課程行事曆。\n"
        f"🐕 狗狗名字：{dog_name}\n"
        f"📝 調整模式：{mode_desc}\n"
        f"📅 該堂課原定時間：{original_time}\n"
        f"🆕 更新後的時間：{new_time}\n\n"
        f"Google Calendar 行程已同步更新，請您確認。\n"
        f"如有問題歡迎隨時聯繫！\n\n"
        f"Dori & Rito Happydays"
    )
    return subject, body


def schedule_email(
    dog_name: str,
    total_classes: int,
    first_date: str,
    class_time: str,
    address: str,
) -> tuple[str, str]:
    """新課程排定通知 Email，回傳 (subject, body)"""
    subject = f"【Dori & Rito】{dog_name} 1對1課程已排定"
    body = (
        f"親愛的家長您好：\n\n"
        f"您的課程已排定完成！\n"
        f"🐕 狗狗名字：{dog_name}\n"
        f"📚 總堂數：{total_classes} 堂\n"
        f"📅 第一堂日期：{first_date}\n"
        f"⏰ 上課時間：{class_time}\n"
        f"📍 上課地點：{address}\n\n"
        f"Google Calendar 邀請已寄出，請您確認。\n"
        f"如需請假請提前3天聯繫我們！\n\n"
        f"Dori & Rito Happydays"
    )
    return subject, body


MODE_DESCRIPTIONS = {
    "A": "課程日期平移（上課時段不變）",
    "B": "課程日期與時段皆調整",
    "C": "單次調課/補課（後續課程維持原時段作息）",
}
