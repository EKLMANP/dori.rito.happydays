#!/usr/bin/env python3
"""
上傳電子報 & 部落格內容到 Notion Database
Content-MKT-Email-blog: https://www.notion.so/Content-MKT-Email-blog-2f117e11503d80b1bca3c00d1c9d959d

用法：
  python3 upload_to_notion.py

需要 .env 檔案（已在 /home/user/dori.rito.happydays/.env 設定）
"""

import os
import sys
import re
import time

# 載入 .env
try:
    from dotenv import load_dotenv
    # 嘗試找到 .env 檔案（從腳本位置往上找）
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(script_dir, '..', '..', '.env')
    load_dotenv(dotenv_path=env_path)
    print(f"✅ 載入 .env 從: {os.path.abspath(env_path)}")
except ImportError:
    print("⚠️  python-dotenv 未安裝，使用系統環境變數")

import requests

# ── 設定 ──────────────────────────────────────────
NOTION_TOKEN = os.getenv("NOTION_API_TOKEN", "")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID", "2f117e11503d80b1bca3c00d1c9d959d")
NOTION_VERSION = "2022-06-28"

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
}

# ── 要上傳的內容 ────────────────────────────────────
CONTENT_BASE = os.path.dirname(os.path.abspath(__file__))

ITEMS_TO_UPLOAD = [
    {
        "file": os.path.join(CONTENT_BASE, "newsletters", "newsletter-05-jumping-up.md"),
        "title": "你家狗狗又撲人了？這個錯誤反應讓牠撲得更起勁",
        "type": "電子報",
        "tags": ["撲人", "行為矯正", "正向訓練"],
        "status": "Ready",
    },
    {
        "file": os.path.join(CONTENT_BASE, "blogs", "blog-04-jumping-up.md"),
        "title": "你家狗狗又撲人了？這個錯誤反應讓牠撲得更起勁（附正確做法）",
        "type": "部落格",
        "tags": ["撲人", "行為矯正", "正向訓練", "SEO"],
        "status": "Ready",
    },
]


# ── Markdown → Notion Blocks ────────────────────────
def markdown_to_blocks(text: str) -> list:
    """將 Markdown 轉換成 Notion blocks（支援標題、清單、分隔線、段落）"""
    blocks = []
    lines = text.split("\n")
    i = 0

    while i < len(lines):
        line = lines[i]

        if not line.strip():
            i += 1
            continue

        # 跳過 front-matter 行（** 開頭的 metadata）
        if line.startswith("**") and ("關鍵字" in line or "字數" in line or "CTA" in line
                                       or "發布" in line or "Meta" in line or "次要" in line
                                       or "Subject" in line or "Preview" in line):
            i += 1
            continue

        # 標題
        if line.startswith("### "):
            blocks.append(heading(3, line[4:]))
        elif line.startswith("## "):
            blocks.append(heading(2, line[3:]))
        elif line.startswith("# "):
            blocks.append(heading(1, line[2:]))

        # 分隔線
        elif line.strip() in ("---", "***", "___"):
            blocks.append({"object": "block", "type": "divider", "divider": {}})

        # 清單項目
        elif re.match(r"^[-•]\s", line.strip()):
            bullet_text = re.sub(r"^[-•]\s+", "", line.strip())
            blocks.append(bullet(bullet_text))
        elif re.match(r"^\d+\.\s", line.strip()):
            num_text = re.sub(r"^\d+\.\s+", "", line.strip())
            blocks.append(numbered(num_text))
        elif line.strip().startswith(("❌", "✅", "✓", "✗", "👉", "📧", "🐕", "💻", "🎥")):
            blocks.append(bullet(line.strip()))

        # 段落
        else:
            para_lines = [line]
            while (i + 1 < len(lines)
                   and lines[i + 1].strip()
                   and not lines[i + 1].startswith("#")
                   and not re.match(r"^[-•\d]\s", lines[i + 1].strip())
                   and lines[i + 1].strip() not in ("---", "***", "___")):
                i += 1
                para_lines.append(lines[i])

            para_text = " ".join(para_lines)
            # 分割超過 2000 字元的段落
            for chunk in [para_text[j:j + 2000] for j in range(0, len(para_text), 2000)]:
                blocks.append(paragraph(chunk))

        i += 1

    return blocks


def heading(level: int, text: str) -> dict:
    h_type = f"heading_{level}"
    return {
        "object": "block",
        "type": h_type,
        h_type: {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }


def bullet(text: str) -> dict:
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }


def numbered(text: str) -> dict:
    return {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }


def paragraph(text: str) -> dict:
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }


# ── 建立 Notion 頁面 ───────────────────────────────
def create_notion_page(item: dict) -> dict:
    """在 Notion database 建立新頁面"""
    # 讀取 Markdown 檔案
    with open(item["file"], "r", encoding="utf-8") as f:
        content = f.read()

    blocks = markdown_to_blocks(content)

    # Notion 單次最多 100 個 blocks
    first_batch = blocks[:100]
    remaining = blocks[100:]

    payload = {
        "parent": {"database_id": DATABASE_ID},
        "properties": {
            "Name": {
                "title": [{"text": {"content": item["title"]}}]
            },
        },
        "children": first_batch,
    }

    # 嘗試加入 Status 欄位（依 database 結構而定）
    # 如果 database 有 Status select 欄位，取消下方注釋
    # payload["properties"]["Status"] = {
    #     "select": {"name": item["status"]}
    # }

    resp = requests.post(
        "https://api.notion.com/v1/pages",
        headers=HEADERS,
        json=payload,
        timeout=30,
    )

    if resp.status_code != 200:
        return {"success": False, "error": resp.text, "status_code": resp.status_code}

    result = resp.json()
    page_id = result["id"]
    page_url = result.get("url", "")

    # 上傳剩餘 blocks（每批最多 100 個）
    for i in range(0, len(remaining), 100):
        batch = remaining[i:i + 100]
        patch_resp = requests.patch(
            f"https://api.notion.com/v1/blocks/{page_id}/children",
            headers=HEADERS,
            json={"children": batch},
            timeout=30,
        )
        if patch_resp.status_code != 200:
            print(f"  ⚠️  部分 blocks 上傳失敗: {patch_resp.text[:200]}")
        time.sleep(0.5)  # 避免 rate limit

    return {"success": True, "page_id": page_id, "page_url": page_url}


# ── 主程式 ─────────────────────────────────────────
def main():
    print("=" * 60)
    print("Dori & Rito — 上傳內容到 Notion")
    print("=" * 60)

    if not NOTION_TOKEN:
        print("❌ 錯誤：NOTION_API_TOKEN 未設定")
        print("   請確認 .env 檔案存在並包含正確的 API key")
        sys.exit(1)

    print(f"Token: {NOTION_TOKEN[:20]}...")
    print(f"Database ID: {DATABASE_ID}")
    print()

    for item in ITEMS_TO_UPLOAD:
        print(f"📤 上傳中: [{item['type']}] {item['title']}")

        if not os.path.exists(item["file"]):
            print(f"   ❌ 找不到檔案: {item['file']}")
            continue

        result = create_notion_page(item)

        if result["success"]:
            print(f"   ✅ 成功！")
            print(f"   🔗 {result['page_url']}")
        else:
            print(f"   ❌ 失敗 (HTTP {result.get('status_code')})")
            print(f"   錯誤訊息: {result.get('error', '')[:300]}")

        print()
        time.sleep(1)  # 避免 rate limit

    print("完成！")


if __name__ == "__main__":
    main()
