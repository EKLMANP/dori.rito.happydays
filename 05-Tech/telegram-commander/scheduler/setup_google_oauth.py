"""
排課系統 — Google OAuth 2.0 設定工具
=====================================
一次性執行，在本機取得 refresh token，然後設定到 Railway 環境變數。

需要的 API Scopes：
- Google Calendar（讀寫行事曆事件）
- Google Sheets（讀寫排課試算表）
- Gmail（寄送調課通知信）

步驟：
1. 在 Google Cloud Console 建立新的 OAuth 2.0 憑證（Desktop app 類型）
2. 啟用 Calendar API、Sheets API、Gmail API
3. 執行此腳本：python setup_google_oauth.py
4. 瀏覽器授權後，將輸出的環境變數設定到 Railway

使用方式：
    pip install google-auth-oauthlib google-api-python-client
    python setup_google_oauth.py
"""

import sys


def main():
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print("❌ 請先安裝必要套件:")
        print("   pip install google-auth-oauthlib google-api-python-client")
        sys.exit(1)

    SCOPES = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/gmail.send",
    ]

    print("=" * 60)
    print("Dori & Rito 排課系統 — Google OAuth 2.0 設定")
    print("=" * 60)
    print()
    print("需要的 API（請先在 Google Cloud Console 啟用）：")
    print("  - Google Calendar API")
    print("  - Google Sheets API")
    print("  - Gmail API")
    print()

    client_id = input("請輸入 OAuth Client ID: ").strip()
    client_secret = input("請輸入 OAuth Client Secret: ").strip()

    if not client_id or not client_secret:
        print("❌ Client ID 和 Client Secret 不能為空")
        sys.exit(1)

    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }

    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)

    print()
    print("🌐 即將開啟瀏覽器，請登入你的 Google 帳號並授權...")
    print()

    credentials = flow.run_local_server(port=8080)

    print()
    print("=" * 60)
    print("✅ 授權成功！")
    print("=" * 60)
    print()
    print("📋 請將以下環境變數設定到 Railway：")
    print()
    print(f"GOOGLE_SCHEDULER_CLIENT_ID={client_id}")
    print(f"GOOGLE_SCHEDULER_CLIENT_SECRET={client_secret}")
    print(f"GOOGLE_SCHEDULER_REFRESH_TOKEN={credentials.refresh_token}")
    print()
    print("=" * 60)

    # 驗證連線
    from googleapiclient.discovery import build

    print()
    print("🔍 驗證 API 連線...")

    # Calendar
    try:
        cal = build("calendar", "v3", credentials=credentials)
        cal_list = cal.calendarList().get(calendarId="primary").execute()
        print(f"  ✅ Calendar：{cal_list.get('summary', 'OK')}")
    except Exception as e:
        print(f"  ❌ Calendar：{e}")

    # Sheets
    try:
        sheets = build("sheets", "v4", credentials=credentials)
        print("  ✅ Sheets：連線成功")
    except Exception as e:
        print(f"  ❌ Sheets：{e}")

    # Gmail
    try:
        gmail = build("gmail", "v1", credentials=credentials)
        profile = gmail.users().getProfile(userId="me").execute()
        print(f"  ✅ Gmail：{profile.get('emailAddress', 'OK')}")
    except Exception as e:
        print(f"  ❌ Gmail：{e}")

    print()
    print("設定方式：")
    print("1. 打開 Railway 專案 → Variables")
    print("2. 新增上面三個環境變數")
    print("3. 另外新增 GOOGLE_SHEET_ID=你的排課試算表ID")
    print("4. 重新部署")


if __name__ == "__main__":
    main()
