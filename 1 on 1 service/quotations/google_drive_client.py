"""
Dori & Rito - Google Drive Client
==================================
處理報價單 PDF 上傳到 Google Drive
"""

import os
import json
from typing import Optional
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2 import service_account

# 設定
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "1jAWh2nSgfIrxdDK2O06oNQL5wxy_58Ru")
GOOGLE_SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), "Quotation automation_Google Drive API Key.json")

# API 範圍
SCOPES = ['https://www.googleapis.com/auth/drive.file']


class GoogleDriveClient:
    """Google Drive API 客戶端"""

    def __init__(self):
        self.service = self._build_service()
        self.folder_id = GOOGLE_DRIVE_FOLDER_ID

    def _build_service(self):
        """建立 Google Drive API 服務"""
        # 嘗試從檔案讀取憑證
        if os.path.exists(GOOGLE_SERVICE_ACCOUNT_FILE):
            credentials = service_account.Credentials.from_service_account_file(
                GOOGLE_SERVICE_ACCOUNT_FILE,
                scopes=SCOPES
            )
        else:
            # 嘗試從環境變數讀取 JSON
            json_str = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
            if json_str:
                info = json.loads(json_str)
                credentials = service_account.Credentials.from_service_account_info(
                    info,
                    scopes=SCOPES
                )
            else:
                raise ValueError("找不到 Google Service Account 憑證")
        
        return build('drive', 'v3', credentials=credentials)

    def upload_file(self, file_path: str, file_name: str, folder_id: Optional[str] = None) -> dict:
        """
        上傳檔案到 Google Drive
        
        Args:
            file_path: 本地檔案路徑
            file_name: 在 Drive 上的檔案名稱
            folder_id: 目標資料夾 ID（預設使用設定的資料夾）
        
        Returns:
            dict: 包含 file_id, web_view_link 等資訊
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
                fields='id, name, webViewLink, webContentLink'
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
        """
        上傳報價單 PDF（便捷函數）
        
        Args:
            file_path: PDF 檔案路徑
            quotation_number: 流水編號 (例如: #0000001)
            customer_name: 客戶姓名
            date_str: 日期字串 (例如: 20260205)
        
        Returns:
            dict: 上傳結果
        """
        # 格式化檔案名稱: 流水號_客戶姓名_報價日期.pdf
        clean_number = quotation_number.replace('#', '')
        file_name = f"{clean_number}_{customer_name}_{date_str}.pdf"
        
        return self.upload_file(file_path, file_name)


# 便捷函數
def upload_quotation_to_drive(file_path: str, quotation_number: str, customer_name: str, date_str: str) -> dict:
    """上傳報價單到 Google Drive 的便捷函數"""
    client = GoogleDriveClient()
    return client.upload_quotation(file_path, quotation_number, customer_name, date_str)


if __name__ == "__main__":
    # 測試
    print("測試 Google Drive 連線...")
    try:
        client = GoogleDriveClient()
        print("✅ Google Drive API 連線成功")
        print(f"   資料夾 ID: {client.folder_id}")
    except Exception as e:
        print(f"❌ 連線失敗: {e}")
