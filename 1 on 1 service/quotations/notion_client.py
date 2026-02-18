"""
Dori & Rito Email Automation - Notion Client
=============================================
處理與 Notion API 的所有互動
"""

import os
import requests
from typing import Optional
from config import (
    NOTION_API_TOKEN, 
    NOTION_DATABASE_ID, 
    NOTION_API_VERSION,
    NOTION_QUOTATION_TOKEN,
    NOTION_CUSTOMER_DATABASE_ID
)


class NotionClient:
    """Notion API 客戶端"""

    def __init__(self, token: str = NOTION_API_TOKEN):
        self.token = token
        self.base_url = "https://api.notion.com/v1"
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Notion-Version": NOTION_API_VERSION
        }

    def create_email_page(
        self,
        subject: str,
        content: str,
        database_id: str = NOTION_DATABASE_ID,
        status: str = "Draft"
    ) -> dict:
        """
        在 Notion database 中建立新的 email 頁面

        Args:
            subject: Email 主旨（將作為頁面標題）
            content: Email 內文（Markdown 格式）
            database_id: Notion database ID
            status: 狀態（Draft, Ready, Sent）

        Returns:
            Notion API response
        """
        # 將 Markdown 內容轉換為 Notion blocks
        blocks = self._markdown_to_blocks(content)

        # 建立頁面
        payload = {
            "parent": {"database_id": database_id},
            "properties": {
                "Name": {
                    "title": [
                        {
                            "text": {"content": subject}
                        }
                    ]
                }
            },
            "children": blocks
        }

        response = requests.post(
            f"{self.base_url}/pages",
            headers=self.headers,
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            page_url = result.get("url", "")
            return {
                "success": True,
                "page_id": result.get("id"),
                "page_url": page_url,
                "message": f"頁面建立成功！\n{page_url}"
            }
        else:
            return {
                "success": False,
                "error": response.text,
                "status_code": response.status_code,
                "message": f"建立失敗：{response.text}"
            }

    def _markdown_to_blocks(self, markdown_text: str) -> list:
        """
        將 Markdown 文字轉換為 Notion blocks
        這是簡化版本，處理常見的格式
        """
        blocks = []
        lines = markdown_text.split('\n')

        i = 0
        while i < len(lines):
            line = lines[i]

            # 空行
            if not line.strip():
                i += 1
                continue

            # 標題
            if line.startswith('### '):
                blocks.append({
                    "object": "block",
                    "type": "heading_3",
                    "heading_3": {
                        "rich_text": [{"type": "text", "text": {"content": line[4:]}}]
                    }
                })
            elif line.startswith('## '):
                blocks.append({
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [{"type": "text", "text": {"content": line[3:]}}]
                    }
                })
            elif line.startswith('# '):
                blocks.append({
                    "object": "block",
                    "type": "heading_1",
                    "heading_1": {
                        "rich_text": [{"type": "text", "text": {"content": line[2:]}}]
                    }
                })
            # 項目符號
            elif line.strip().startswith('- ') or line.strip().startswith('• '):
                bullet_text = line.strip()[2:]
                blocks.append({
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": bullet_text}}]
                    }
                })
            elif line.strip().startswith('✓ ') or line.strip().startswith('✗ '):
                bullet_text = line.strip()
                blocks.append({
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": bullet_text}}]
                    }
                })
            # 分隔線
            elif line.strip() in ['---', '***', '___']:
                blocks.append({
                    "object": "block",
                    "type": "divider",
                    "divider": {}
                })
            # 一般段落
            else:
                # 收集連續的非空行作為一個段落
                paragraph_lines = [line]
                while i + 1 < len(lines) and lines[i + 1].strip() and not lines[i + 1].startswith('#') and not lines[i + 1].strip().startswith('-'):
                    i += 1
                    paragraph_lines.append(lines[i])

                paragraph_text = ' '.join(paragraph_lines)

                # Notion block 內容長度限制為 2000 字元
                if len(paragraph_text) > 2000:
                    # 分割成多個 blocks
                    chunks = [paragraph_text[j:j+2000] for j in range(0, len(paragraph_text), 2000)]
                    for chunk in chunks:
                        blocks.append({
                            "object": "block",
                            "type": "paragraph",
                            "paragraph": {
                                "rich_text": [{"type": "text", "text": {"content": chunk}}]
                            }
                        })
                else:
                    blocks.append({
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [{"type": "text", "text": {"content": paragraph_text}}]
                        }
                    })

            i += 1

        return blocks

    def get_database_info(self, database_id: str = NOTION_DATABASE_ID) -> dict:
        """取得 database 結構資訊"""
        response = requests.get(
            f"{self.base_url}/databases/{database_id}",
            headers=self.headers,
            timeout=30
        )
        return response.json()


class QuotationNotionClient:
    """報價單專用 Notion 客戶端 - 處理客戶管理 database"""

    def __init__(self, token: str = NOTION_QUOTATION_TOKEN):
        self.token = token
        self.base_url = "https://api.notion.com/v1"
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Notion-Version": NOTION_API_VERSION
        }

    def find_customer_page(self, customer_name: str) -> dict:
        """
        在客戶管理 database 中搜尋客戶頁面
        
        Args:
            customer_name: 客戶姓名
        
        Returns:
            dict: 包含 success, page_id, page_url 等資訊
        """
        payload = {
            "filter": {
                "property": "客戶姓名",
                "title": {
                    "equals": customer_name
                }
            }
        }
        
        response = requests.post(
            f"{self.base_url}/databases/{NOTION_CUSTOMER_DATABASE_ID}/query",
            headers=self.headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            results = response.json().get("results", [])
            if results:
                page = results[0]
                return {
                    "success": True,
                    "page_id": page["id"],
                    "page_url": page.get("url", ""),
                    "message": f"找到客戶: {customer_name}"
                }
            else:
                return {
                    "success": False,
                    "error": f"找不到客戶: {customer_name}",
                    "message": f"請確認客戶 '{customer_name}' 已存在於 Notion 客戶管理資料庫"
                }
        else:
            return {
                "success": False,
                "error": response.text,
                "status_code": response.status_code,
                "message": f"查詢失敗：{response.text}"
            }

    def upload_file_to_page(self, page_id: str, file_path: str, file_name: str = None, drive_link: str = None) -> dict:
        """
        上傳檔案到客戶頁面（作為 block 附件）
        
        注意：Notion API 不支援直接上傳檔案，需要使用外部 URL
        這裡我們改為在頁面新增一個區塊記錄報價單資訊
        
        Args:
            page_id: Notion 頁面 ID
            file_path: 本地檔案路徑
            file_name: 顯示的檔案名稱
            drive_link: Google Drive 分享連結
        
        Returns:
            dict: 上傳結果
        """
        if file_name is None:
            file_name = os.path.basename(file_path)
        
        # 由於 Notion API 無法直接上傳檔案，我們在頁面新增一個區塊記錄
        from datetime import datetime
        from zoneinfo import ZoneInfo
        
        taipei_time = datetime.now(ZoneInfo('Asia/Taipei'))
        
        blocks = [
            {
                "object": "block",
                "type": "divider",
                "divider": {}
            },
            {
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [{
                        "type": "text",
                        "text": {"content": "📄 報價單記錄"}
                    }]
                }
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": f"檔案：{file_name}"},
                            "annotations": {"bold": True}
                        }
                    ]
                }
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{
                        "type": "text",
                        "text": {"content": f"建立時間：{taipei_time.strftime('%Y-%m-%d %H:%M:%S')}"}
                    }]
                }
            }
        ]
        
        # 如果有 Google Drive 連結，加入連結區塊
        if drive_link:
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "📎 "},
                        },
                        {
                            "type": "text",
                            "text": {
                                "content": "Google Drive 下載連結",
                                "link": {"url": drive_link}
                            },
                            "annotations": {"bold": True, "color": "blue"}
                        }
                    ]
                }
            })
        else:
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{
                        "type": "text",
                        "text": {"content": f"本地路徑：{file_path}"}
                    }]
                }
            })
        
        response = requests.patch(
            f"{self.base_url}/blocks/{page_id}/children",
            headers=self.headers,
            json={"children": blocks},
            timeout=30
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "message": f"報價單記錄已新增到客戶頁面",
                "file_name": file_name,
                "drive_link": drive_link
            }
        else:
            return {
                "success": False,
                "error": response.text,
                "status_code": response.status_code,
                "message": f"上傳失敗：{response.text}"
            }

    def add_quotation_to_customer(self, customer_name: str, file_path: str, quotation_number: str, grand_total: int, drive_link: str = None) -> dict:
        """
        完整流程：搜尋客戶 → 上傳報價單記錄
        
        Args:
            customer_name: 客戶姓名
            file_path: PDF 檔案路徑
            quotation_number: 報價單編號
            grand_total: 總金額
            drive_link: Google Drive 分享連結
        
        Returns:
            dict: 完整結果
        """
        # 1. 搜尋客戶
        customer_result = self.find_customer_page(customer_name)
        if not customer_result["success"]:
            return customer_result
        
        page_id = customer_result["page_id"]
        
        # 2. 上傳報價單記錄
        file_name = f"報價單 {quotation_number} - TWD {grand_total:,}"
        upload_result = self.upload_file_to_page(page_id, file_path, file_name, drive_link)
        
        if upload_result["success"]:
            return {
                "success": True,
                "page_id": page_id,
                "page_url": customer_result["page_url"],
                "drive_link": drive_link,
                "message": f"報價單 {quotation_number} 已新增到客戶 {customer_name} 的頁面"
            }
        else:
            return upload_result


# 方便直接呼叫的函數
def create_email_in_notion(subject: str, content: str) -> dict:
    """建立 email 頁面的便捷函數"""
    client = NotionClient()
    return client.create_email_page(subject, content)


def add_quotation_to_customer(customer_name: str, file_path: str, quotation_number: str, grand_total: int, drive_link: str = None) -> dict:
    """新增報價單到客戶頁面的便捷函數"""
    client = QuotationNotionClient()
    return client.add_quotation_to_customer(customer_name, file_path, quotation_number, grand_total, drive_link)


if __name__ == "__main__":
    # 測試 Email 功能
    print("=== 測試 Email 功能 ===")
    client = NotionClient()
    result = client.create_email_page(
        subject="測試主旨",
        content="這是測試內容\n\n## 小標題\n\n- 項目一\n- 項目二"
    )
    print(result)
    
    # 測試報價單客戶搜尋
    print("\n=== 測試報價單客戶搜尋 ===")
    quotation_client = QuotationNotionClient()
    customer_result = quotation_client.find_customer_page("Ethan")
    print(customer_result)

