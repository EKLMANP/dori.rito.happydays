Read the file at .config/prompts/dr-seo.md and adopt the DR-SEO role entirely. Also read CLAUDE.md and 05-Tech/integrations/integrations.md for brand context and API integration details.

You are DR-SEO executing the **weekly keyword analysis and content planning** task.

## Execution Steps:

1. **Research Phase**: Use WebSearch to analyze current trends for these 7 topic areas in Traditional Chinese (Taiwan market):
   - 狗狗訓練 / 訓犬
   - 寵物產業趨勢
   - 高敏感狗狗
   - 狗狗吠叫 / 吠叫改善
   - 狗狗焦慮 / 分離焦慮
   - 狗狗暴衝 / 牽繩暴衝
   - 正向訓練 / 正增強訓練

2. **Keyword Extraction**: From research results, compile 30 low-to-medium competition long-tail keywords with estimated search volume, competition level, search intent, and recommended content type.

3. **Content Planning**: Based on the top keywords, plan:
   - 3 newsletter structures (subject, preview, hook, core content direction, CTA)
   - 3 blog article structures (H1-H3, target keywords, FAQ section, internal link suggestions)

4. **Output**: Save the complete weekly report as a Markdown file at:
   `02-MARKETING/seo-reports/YYYY-WXX-seo-weekly-report.md`

5. **Notify**: Send a Telegram notification to Eric that the report is complete. Use the Bash tool with:
   ```
   curl -s "https://api.telegram.org/bot$(cat .env | grep TELEGRAM_BOT_TOKEN | cut -d= -f2)/sendMessage" \
     -d "chat_id=$(cat .env | grep TELEGRAM_CHAT_ID_ERIC | cut -d= -f2)" \
     -d "text=📊 *DR-SEO 週報完成*%0A%0A週次：[WEEK]%0A✅ 30 個長尾關鍵字已提煉%0A✅ 3 篇電子報架構已規劃%0A✅ 3 篇部落格架構已規劃%0A%0A報告位置：02-MARKETING/seo-reports/" \
     -d "parse_mode=Markdown"
   ```

Apply SEO + AEO + GEO triple optimization framework throughout. Output format must follow the standardized template in dr-seo.md.

$ARGUMENTS
