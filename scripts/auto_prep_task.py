#!/usr/bin/env python3
"""
課後備課任務自動建立腳本

掃描 DR 和犬研室客戶的上課紀錄 database，
找出標題日期 = 今天的課程，自動在「Eric 待辦任務」建立備課卡片。
"""

import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ENV_FILE = SCRIPT_DIR / ".env"
STATE_FILE = SCRIPT_DIR / "prep_task_state.json"

# --- Config ---

def load_env():
    """Load config from .env file, falling back to environment variables."""
    config = {}
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    config[key.strip()] = val.strip()
    # Environment variables take precedence (used in GitHub Actions)
    for key in ("NOTION_TOKEN", "TASK_DB_ID", "DR_DB_ID", "CANINE_LAB_DB_ID"):
        if os.environ.get(key):
            config[key] = os.environ[key]
    return config

ENV = load_env()
NOTION_TOKEN = ENV["NOTION_TOKEN"]
TASK_DB_ID = ENV["TASK_DB_ID"]
DR_DB_ID = ENV["DR_DB_ID"]
CANINE_LAB_DB_ID = ENV["CANINE_LAB_DB_ID"]

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

# Source configs: (database_id, source_label, company_select, dog_field_name)
SOURCES = [
    (DR_DB_ID, "DR", "Dori & Rito", "狗狗名字 Name of your lovely dog"),
    (CANINE_LAB_DB_ID, "犬研室", "犬研室", "狗狗名字"),
]

# --- Notion API helpers ---

def notion_request(method, url, data=None, timeout=30, retries=3):
    """Make a Notion API request with exponential backoff retry."""
    body = json.dumps(data).encode() if data else None
    for attempt in range(retries):
        req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            if e.code == 429:
                wait = 2 ** attempt
                print(f"  Rate limited, retrying in {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue
            print(f"  API error {e.code}: {error_body[:200]}", file=sys.stderr)
            return None
        except (TimeoutError, ConnectionResetError, OSError) as e:
            if attempt < retries - 1:
                wait = 2 ** attempt
                print(f"  Network error ({e}), retrying in {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue
            print(f"  Network error after {retries} attempts: {e}", file=sys.stderr)
            return None
    return None

def query_database(db_id, body=None):
    """Query a Notion database. Returns all results with pagination."""
    results = []
    url = f"https://api.notion.com/v1/databases/{db_id}/query"
    payload = body or {}
    while True:
        resp = notion_request("POST", url, payload)
        if not resp:
            break
        results.extend(resp.get("results", []))
        if not resp.get("has_more"):
            break
        payload["start_cursor"] = resp["next_cursor"]
    return results

def get_block_children(block_id):
    """Get children blocks of a page/block."""
    url = f"https://api.notion.com/v1/blocks/{block_id}/children?page_size=100"
    resp = notion_request("GET", url)
    return resp.get("results", []) if resp else []

def create_page(db_id, properties):
    """Create a page in a Notion database."""
    url = "https://api.notion.com/v1/pages"
    data = {"parent": {"database_id": db_id}, "properties": properties}
    return notion_request("POST", url, data)

# --- Idempotency check ---

def task_card_exists(title):
    """Check if a task card with this exact title already exists in the task database.

    This is the Notion-side idempotency guard. Even if the local state file is
    out of sync (e.g. create_page succeeded but timed out before the response
    was received), this prevents duplicate cards from being created.
    """
    body = {
        "filter": {
            "property": "Topic 主題",
            "title": {"equals": title},
        }
    }
    results = query_database(TASK_DB_ID, body)
    return len(results) > 0

# --- State management ---

def load_state():
    """Load processed session IDs."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"processed_sessions": []}

def save_state(state):
    """Save processed session IDs."""
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

# --- Core logic ---

def get_customers(db_id, dog_field_name):
    """Get all customers from a customer database."""
    customers = []
    for page in query_database(db_id):
        props = page["properties"]
        name_parts = props.get("客戶姓名", {}).get("title", [])
        name = "".join(t["plain_text"] for t in name_parts)
        dog_parts = props.get(dog_field_name, {}).get("rich_text", [])
        dog = "".join(t["plain_text"] for t in dog_parts)
        customers.append({
            "page_id": page["id"],
            "name": name,
            "dog": dog,
        })
    return customers

def find_class_record_db(customer_page_id):
    """Find the class record child_database within a customer page."""
    blocks = get_block_children(customer_page_id)
    for block in blocks:
        if block["type"] == "child_database":
            title = block.get("child_database", {}).get("title", "")
            # Match patterns: "上課紀錄", "1 on 1 record", "紀錄"
            if any(kw in title for kw in ["上課紀錄", "1 on 1 record", "紀錄", "Session"]):
                return block["id"], title
    return None, None

def find_today_sessions(class_db_id, today_str):
    """Find session pages whose title starts with today's date.

    Supports formats:
      - YYYYMMDD     (e.g. 20260503)
      - YYYY/MM/DD   (e.g. 2026/05/03)
      - YYYY/M/DD    (e.g. 2026/5/03)
      - YYYY/MM/D    (e.g. 2026/05/3)
      - YYYY/M/D     (e.g. 2026/5/3)
    """
    year = today_str[:4]
    month = today_str[4:6]
    day = today_str[6:8]
    slash_prefixes = {
        f"{year}/{month}/{day}",            # 2026/05/03
        f"{year}/{int(month)}/{int(day)}",  # 2026/5/3
        f"{year}/{int(month)}/{day}",       # 2026/5/03
        f"{year}/{month}/{int(day)}",       # 2026/05/3
    }

    sessions = []
    for page in query_database(class_db_id):
        props = page["properties"]
        title_prop = next((v for v in props.values() if v["type"] == "title"), None)
        if not title_prop:
            continue
        title = "".join(t["plain_text"] for t in title_prop.get("title", []))
        if title.startswith(today_str) or any(title.startswith(p) for p in slash_prefixes):
            sessions.append({"page_id": page["id"], "title": title})
    return sessions

def build_task_properties(source_label, company_name, customer_name, dog_name, due_date):
    """Build Notion properties for the prep task card."""
    if dog_name:
        title = f"[{source_label}] {customer_name}/{dog_name} 備課"
    else:
        title = f"[{source_label}] {customer_name} 備課"

    return {
        "Topic 主題": {
            "title": [{"text": {"content": title}}]
        },
        "Assigned To": {
            "multi_select": [{"name": "Eric"}]
        },
        "Due Date": {
            "date": {"start": due_date}
        },
        "Priority 優先級": {
            "select": {"name": "重要不緊急"}
        },
        "Status": {
            "status": {"name": "Not started"}
        },
        "公司別": {
            "select": {"name": company_name}
        },
    }

def main():
    today = datetime.now()
    today_str = today.strftime("%Y%m%d")
    due_date = (today + timedelta(days=5)).strftime("%Y-%m-%d")

    print(f"=== 課後備課任務自動建立 ===")
    print(f"掃描日期: {today.strftime('%Y-%m-%d')} (標題前綴: {today_str})")
    print(f"備課 Due Date: {due_date}")
    print()

    state = load_state()
    processed = set(state["processed_sessions"])
    cards_created = 0

    for db_id, source_label, company_name, dog_field in SOURCES:
        print(f"--- 掃描 {source_label} 客戶 ---")
        customers = get_customers(db_id, dog_field)
        print(f"  找到 {len(customers)} 位客戶")

        for cust in customers:
            class_db_id, _ = find_class_record_db(cust["page_id"])
            if not class_db_id:
                continue

            sessions = find_today_sessions(class_db_id, today_str)
            for session in sessions:
                sid = session["page_id"]

                # Layer 1: local state file check (fast)
                if sid in processed:
                    print(f"  [跳過] {cust['name']}/{cust['dog']} - {session['title']} (state 已記錄)")
                    continue

                props = build_task_properties(
                    source_label, company_name,
                    cust["name"], cust["dog"], due_date,
                )
                card_title = props["Topic 主題"]["title"][0]["text"]["content"]

                # Layer 2: Notion-side idempotency check (guards against response timeout)
                if task_card_exists(card_title):
                    print(f"  [跳過] {card_title} (Notion 端已存在，補記 state)")
                    processed.add(sid)
                    continue

                result = create_page(TASK_DB_ID, props)
                if result and "id" in result:
                    print(f"  [建立] {card_title} (Due: {due_date})")
                    processed.add(sid)
                    cards_created += 1
                else:
                    print(f"  [失敗] {card_title} - 建卡失敗，下次重試")

    # Save state
    state["processed_sessions"] = list(processed)
    save_state(state)

    print()
    print(f"=== 完成: 今天建立了 {cards_created} 張備課卡片 ===")

if __name__ == "__main__":
    main()
