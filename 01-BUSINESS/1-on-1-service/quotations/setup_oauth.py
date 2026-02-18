"""
Google Drive OAuth 設定工具
==========================
執行此腳本以取得 OAuth refresh token，用於 Google Drive 上傳。

步驟：
1. 在 Google Cloud Console 設定 OAuth 2.0 憑證（Desktop app 類型）
2. 執行此腳本，會開啟瀏覽器讓你授權
3. 授權完成後，會印出 refresh_token
4. 將 refresh_token 設定為 Railway 環境變數 GOOGLE_OAUTH_REFRESH_TOKEN

使用方式：
    pip install google-auth-oauthlib
    python setup_oauth.py
"""

import json
import sys

def main():
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print("❌ 請先安裝 google-auth-oauthlib:")
        print("   pip install google-auth-oauthlib")
        sys.exit(1)
    
    # OAuth 範圍
    SCOPES = ['https://www.googleapis.com/auth/drive.file']
    
    print("=" * 60)
    print("Google Drive OAuth 2.0 設定工具")
    print("=" * 60)
    print()
    
    # 方式 1：使用 client_secret.json 檔案
    # 方式 2：手動輸入 Client ID 和 Client Secret
    
    client_id = input("請輸入 OAuth Client ID: ").strip()
    client_secret = input("請輸入 OAuth Client Secret: ").strip()
    
    if not client_id or not client_secret:
        print("❌ Client ID 和 Client Secret 不能為空")
        sys.exit(1)
    
    # 建立 OAuth flow
    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"]
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
    print(f"GOOGLE_OAUTH_CLIENT_ID={client_id}")
    print(f"GOOGLE_OAUTH_CLIENT_SECRET={client_secret}")
    print(f"GOOGLE_OAUTH_REFRESH_TOKEN={credentials.refresh_token}")
    print()
    print("=" * 60)
    print()
    print("設定方式：")
    print("1. 打開 Railway 專案 → Variables")
    print("2. 新增上面三個環境變數")
    print("3. 重新部署")
    print()
    
    # 測試連線
    from googleapiclient.discovery import build
    service = build('drive', 'v3', credentials=credentials)
    about = service.about().get(fields="user").execute()
    print(f"✅ 已連線為: {about['user']['displayName']} ({about['user']['emailAddress']})")


if __name__ == "__main__":
    main()
