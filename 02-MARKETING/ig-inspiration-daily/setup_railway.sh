#!/bin/bash
# IG 靈感日報 — Railway 環境變數設定腳本
# 使用前請先執行：railway login
# 然後執行：bash setup_railway.sh

set -e

PROJECT_ID="53ddb958-82de-4448-9bab-79843a7d0e9a"
SERVICE_ID="162db91e-7da0-4403-87e6-2925d7347856"

echo "🚀 設定 IG 靈感日報 Railway 環境變數..."

# Link to the project and service
railway link --project "$PROJECT_ID" --service "$SERVICE_ID"

# Set all environment variables
echo "📦 設定環境變數..."

railway variables set \
  IG_DAILY_TELEGRAM_BOT_TOKEN="***REMOVED_TELEGRAM_TOKEN***" \
  IG_DAILY_TELEGRAM_CHAT_ID="-5153182461" \
  APIFY_API_TOKEN="***REMOVED_APIFY_TOKEN***" \
  ANTHROPIC_API_KEY="***REMOVED_ANTHROPIC_KEY_PARTIAL***XdBNZHl2wvRQbaNjsaTLdyZYWveY8rIJcGmuV3H5vpC93I4pDvG4kOz9f_KX440HuNb7pqilOuyz_MQ-QLfFGQAA" \
  NOTION_API_TOKEN="***REMOVED_NOTION_TOKEN***" \
  TZ="Asia/Taipei"

echo "✅ 環境變數設定完成！"
echo ""
echo "驗證設定："
railway variables
