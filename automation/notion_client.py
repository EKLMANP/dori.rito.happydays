"""
Dori & Rito Email Automation - Notion Client
=============================================
處理與 Notion API 的所有互動
"""

import requests
from typing import Optional
from config import NOTION_API_TOKEN, NOTION_DATABASE_ID, NOTION_API_VERSION


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
            json=payload
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
            headers=self.headers
        )
        return response.json()


# 方便直接呼叫的函數
def create_email_in_notion(subject: str, content: str) -> dict:
    """建立 email 頁面的便捷函數"""
    client = NotionClient()
    return client.create_email_page(subject, content)


if __name__ == "__main__":
    # 測試
    client = NotionClient()
    result = client.create_email_page(
        subject="測試主旨",
        content="這是測試內容\n\n## 小標題\n\n- 項目一\n- 項目二"
    )
    print(result)
