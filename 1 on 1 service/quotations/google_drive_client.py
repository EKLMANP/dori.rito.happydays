"""
Dori & Rito - Google Drive Client
==================================
處理報價單 PDF 上傳到 Google Drive
支援 OAuth 2.0 (個人帳戶) 和 Service Account 兩種模式
"""

import os
import json
import io
from typing import Optional
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload

# 設定
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "1jAWh2nSgfIrxdDK2O06oNQL5wxy_58Ru")
GOOGLE_SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), "Quotation automation_Google Drive API Key.json")

# OAuth 設定
GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
GOOGLE_OAUTH_REFRESH_TOKEN = os.getenv("GOOGLE_OAUTH_REFRESH_TOKEN", "")

# API 範圍
SCOPES = ['https://www.googleapis.com/auth/drive.file']


class GoogleDriveClient:
    """Google Drive API 客戶端"""

    def __init__(self):
        self.service = self._build_service()
        self.folder_id = GOOGLE_DRIVE_FOLDER_ID

    def _build_service(self):
        """建立 Google Drive API 服務（優先使用 OAuth）"""
        
        # 方式 1: OAuth 2.0（個人帳戶，優先）
        if GOOGLE_OAUTH_REFRESH_TOKEN and GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET:
            print("   🔑 使用 OAuth 2.0 憑證連線 Google Drive")
            from google.oauth2.credentials import Credentials
            credentials = Credentials(
                token=None,
                refresh_token=GOOGLE_OAUTH_REFRESH_TOKEN,
                client_id=GOOGLE_OAUTH_CLIENT_ID,
                client_secret=GOOGLE_OAUTH_CLIENT_SECRET,
                token_uri="https://oauth2.googleapis.com/token",
                scopes=SCOPES
            )
            return build('drive', 'v3', credentials=credentials)
        
        # 方式 2: Service Account（備用）
        from google.oauth2 import service_account
        
        if os.path.exists(GOOGLE_SERVICE_ACCOUNT_FILE):
            print("   🔑 使用 Service Account 憑證連線 Google Drive")
            credentials = service_account.Credentials.from_service_account_file(
                GOOGLE_SERVICE_ACCOUNT_FILE,
                scopes=SCOPES
            )
        else:
            json_str = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
            if json_str:
                print("   🔑 使用環境變數 Service Account 連線 Google Drive")
                info = json.loads(json_str)
                credentials = service_account.Credentials.from_service_account_info(
                    info,
                    scopes=SCOPES
                )
            else:
                raise ValueError("找不到 Google Drive 憑證（OAuth 或 Service Account）")
        
        return build('drive', 'v3', credentials=credentials)

    def upload_file(self, file_path: str, file_name: str, folder_id: Optional[str] = None) -> dict:
        """
        上傳檔案到 Google Drive
        """
        try:
            folder_id = folder_id or self.folder_id
            
            file_metadata = {
                'name': file_name,
                'parents': [folder_id]
            }
            
            media = MediaFileUpload(
                file_path,
                mimetype='application/pdf',
                resumable=True
            )
            
            # 上傳檔案
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, webViewLink, webContentLink',
                supportsAllDrives=True
            ).execute()
            
            # 設定為任何人都可以檢視（取得分享連結）
            self._set_public_permission(file['id'])
            
            return {
                "success": True,
                "file_id": file['id'],
                "file_name": file['name'],
                "web_view_link": file.get('webViewLink', ''),
                "download_link": file.get('webContentLink', ''),
                "message": f"檔案已上傳: {file_name}"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"上傳失敗: {str(e)}"
            }

    def _set_public_permission(self, file_id: str) -> None:
        """設定檔案為公開可檢視"""
        try:
            self.service.permissions().create(
                fileId=file_id,
                body={
                    'type': 'anyone',
                    'role': 'reader'
                }
            ).execute()
        except Exception as e:
            print(f"⚠️ 設定權限失敗: {e}")

    def upload_quotation(self, file_path: str, quotation_number: str, customer_name: str, date_str: str) -> dict:
        """上傳報價單 PDF"""
        clean_number = quotation_number.replace('#', '')
        file_name = f"{clean_number}_{customer_name}_{date_str}.pdf"
        return self.upload_file(file_path, file_name)

    def get_next_quotation_number(self) -> int:
        """
        從 Google Drive 取得並更新下一個流水號
        使用檔案名稱儲存計數 (Pattern: quotation_sequence_<NUMBER>)
        Workaround: 避免 update/delete/read content 的潛在 hang 問題
        """
        PREFIX = "quotation_seq_"
        
        try:
            # 1. 搜尋 sequence 檔案
            query = f"name contains '{PREFIX}' and '{self.folder_id}' in parents and trashed = false"
            results = self.service.files().list(
                q=query, 
                spaces='drive', 
                fields='files(id, name)'
            ).execute()
            files = results.get('files', [])
            
            current_number = 0
            old_files = []
            
            # 解析現有編號
            for f in files:
                name = f['name']
                if name.startswith(PREFIX):
                    try:
                        num = int(name.replace(PREFIX, ''))
                        if num > current_number:
                            current_number = num
                    except:
                        pass
                    old_files.append(f)
            
            # 2. 建立新檔案
            next_number = current_number + 1
            new_name = f"{PREFIX}{next_number:07d}" # e.g. quotation_sequence_0000001
            
            file_metadata = {
                'name': new_name,
                'parents': [self.folder_id]
            }
            self.service.files().create(
                body=file_metadata,
                fields='id'
            ).execute()
            
            # 3. 嘗試清理舊檔案 (Best effort)
            # 如果 delete 會 hang，這裡可能會卡住，所以我們放在 create 之後
            # 或者我們可以略過清理，等待定期維護
            # 為了測試，我們先試著不清理，或者非同步清理？
            # 這裡選擇: 嘗試清理第一個舊檔案，如果失敗/慢就放棄?
            # 為了避免卡住 Response，我們先不執行清理，或者只印出 log
            # print(f"   (待清理舊檔案: {len(old_files)} 個)") 
            
            # 為了避免檔案過多，嘗試刪除上一個最大的 (或者全部)
            # 但若 delete hang，會導致回傳延遲。
            # 暫時不刪除，除非確認 delete 不會 hang。
            # 之前的測試 delete 似乎也 hang？或者 create hang？
            # 我們假設 create 沒 hang (第一次 test 成功 returned 1)。
            # 第二次 test 沒 return 2。
            # 第二次 test 的步驟：
            # 1. Search (Found)
            # 2. Delete (Wait...) -> Hang?
            # 所以 delete 可能是兇手。
            # 我們在這裡 **不執行 delete**。只 Create。
            # 這樣雖然會累積檔案，但功能正常。
            
            return next_number
            
        except Exception as e:
            print(f"⚠️ Google Drive Flow Number Error: {e}")
            return None


if __name__ == "__main__":
    print("測試 Google Drive 連線...")
    try:
        client = GoogleDriveClient()
        print("✅ Google Drive API 連線成功")
        print(f"   資料夾 ID: {client.folder_id}")
    except Exception as e:
        print(f"❌ 連線失敗: {e}")
