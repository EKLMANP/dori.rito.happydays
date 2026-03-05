#!/bin/bash
# IG 靈感日報 — Railway 環境變數設定腳本
# 使用前請先執行：railway login
# 然後執行：bash setup_railway.sh
#
# 所有 secrets 從 .env 讀取，請確認 .env 檔案存在且包含以下變數：
#   IG_DAILY_TELEGRAM_BOT_TOKEN, IG_DAILY_TELEGRAM_CHAT_ID,
#   APIFY_API_TOKEN, ANTHROPIC_API_KEY, NOTION_API_TOKEN

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ 找不到 .env 檔案：$ENV_FILE"
  echo "請先建立 .env 檔案，參考 .env.example"
  exit 1
fi

# Load environment variables from .env
set -a
source "$ENV_FILE"
set +a

PROJECT_ID="53ddb958-82de-4448-9bab-79843a7d0e9a"
SERVICE_ID="162db91e-7da0-4403-87e6-2925d7347856"

echo "🚀 設定 IG 靈感日報 Railway 環境變數..."

# Link to the project and service
railway link --project "$PROJECT_ID" --service "$SERVICE_ID"

# Set all environment variables
echo "📦 設定環境變數..."

railway variables set \
  IG_DAILY_TELEGRAM_BOT_TOKEN="$IG_DAILY_TELEGRAM_BOT_TOKEN" \
  IG_DAILY_TELEGRAM_CHAT_ID="$IG_DAILY_TELEGRAM_CHAT_ID" \
  APIFY_API_TOKEN="$APIFY_API_TOKEN" \
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  NOTION_API_TOKEN="$NOTION_API_TOKEN" \
  TZ="Asia/Taipei"

echo "✅ 環境變數設定完成！"
echo ""
echo "驗證設定："
railway variables
