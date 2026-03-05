#!/bin/bash
# Create 20 Notion entries for the Dog Barking (吠叫) series
# Database: Email / Blog Content Ideation
# Parent: Dog's Barking SEO 關鍵字研究

NOTION_TOKEN="v03:eyJhbGciOiJkaXIiLCJraWQiOiJwcm9kdWN0aW9uOnRva2VuLXYzOjIwMjQtMTEtMDciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..90np5LGEsovahUcQREDD0A.zMO-8LvTs7EyTFNMVYem1Ghb1I344ItJkVNlYUwfdPlPEDIzEZs7IPBkglkXrMBaKpmJyvbwdiNC5fmg3Oj9Kg0h-K7EvKjvEcuaVMv3Zg-EwQT9XtI0aUtMTlvLyjflu8lLIFx4D-zvNHHMjaVCn7LCQa6BFRA_52UiwjEYabHIGB_R_l4mcOZhrbCWWT3fll8mIWC-Kvl0F31IvhUaBB7fP6sHLZeOtUiyjsYQfGmf1Qc_Nnjj0VlcX_HBMv6o_VfyHUVJmhf2B69SdAtwzVWRXiNzvLtrLUOFfhThO-t99k8LUPjRFYtl2XFZ2D1qtunXvw1X72BZ-DUEGpOUSOKi5zesIGsTbQC1NrNkjfY.aqRzoYSur_DBD-lnhP0BB0x555_Dcxitbqrcyot_YD4"

DATABASE_ID="2f117e11-503d-8059-87be-ebbe6f2fe216"
PARENT_PAGE_ID="31417e11-503d-803a-9eb6-dab259be96b9"
NOTION_VERSION="2022-06-28"

create_page() {
  local title="$1"
  local category="$2"
  local tags_json="$3"
  local content_blocks="$4"

  local payload=$(cat <<EOF
{
  "parent": { "database_id": "${DATABASE_ID}" },
  "properties": {
    "Name": {
      "title": [{ "text": { "content": "${title}" } }]
    },
    "Category": {
      "select": { "name": "${category}" }
    },
    "status": {
      "status": { "name": "Under review" }
    },
    "Tags": {
      "multi_select": ${tags_json}
    },
    "Parent item": {
      "relation": [{ "id": "${PARENT_PAGE_ID}" }]
    }
  },
  "children": ${content_blocks}
}
EOF
)

  local response=$(curl -s -X POST "https://api.notion.com/v1/pages" \
    -H "Authorization: Bearer ${NOTION_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "Notion-Version: ${NOTION_VERSION}" \
    -d "${payload}")

  local page_id=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id','ERROR: '+str(d.get('message',d))))" 2>/dev/null)
  echo "  → Created: ${title} (ID: ${page_id})"
}

# Helper to make a heading block
heading() {
  echo "{\"type\":\"heading_3\",\"heading_3\":{\"rich_text\":[{\"type\":\"text\",\"text\":{\"content\":\"$1\"}}]}}"
}

# Helper to make a paragraph block
para() {
  echo "{\"type\":\"paragraph\",\"paragraph\":{\"rich_text\":[{\"type\":\"text\",\"text\":{\"content\":\"$1\"}}]}}"
}

# Helper to make a bulleted list item
bullet() {
  echo "{\"type\":\"bulleted_list_item\",\"bulleted_list_item\":{\"rich_text\":[{\"type\":\"text\",\"text\":{\"content\":\"$1\"}}]}}"
}

echo "=== 開始建立吠叫系列 20 篇 Notion 頁面 ==="
echo ""

# ========== NEWSLETTERS (10) ==========
echo "📧 建立電子報 (1-10)..."
echo ""

# Newsletter 1
echo "1/20: 吠叫系列 1【電子報】"
create_page \
  "吠叫系列 1【電子報】你聽不懂的每一聲吠叫，其實都有意義" \
  "Newsletter" \
  '[{"name":"吠叫語言"},{"name":"認知翻轉"},{"name":"狗狗溝通"}]' \
  "[$(heading '主旨行（A/B 測試）'),$(bullet 'A：你聽不懂的每一聲吠叫，其實都有意義'),$(bullet 'B：狗狗叫不是亂叫——牠正在跟你說這 6 件事'),$(heading 'Preview Text'),$(para '吠叫不是問題，「聽不懂」才是'),$(heading 'Hook'),$(para '「99% 的飼主第一反應是讓牠閉嘴，但如果有人因為說了你聽不懂的語言就被要求閉嘴——你作何感想？」'),$(heading '核心內容'),$(para '6 種吠叫語言速覽圖（警戒、焦慮、興奮、需求、無聊、疼痛）——每種用 1 句話 + 1 個辨識特徵'),$(heading '品牌連結'),$(para '「在 Dori & Rito 的到府評估中，我們做的第一件事不是制止吠叫，而是花 20 分鐘觀察你的狗狗在叫什麼。」'),$(heading 'CTA'),$(para '想知道你的狗狗在「說」什麼？→ 填寫免費行為評估問卷')]"

sleep 1

# Newsletter 2
echo "2/20: 吠叫系列 2【電子報】"
create_page \
  "吠叫系列 2【電子報】快遞來了又被狗吠到崩潰？3 分鐘搞定門鈴炸裂" \
  "Newsletter" \
  '[{"name":"門鈴吠叫"},{"name":"減敏訓練"},{"name":"環境管理"}]' \
  "[$(heading '主旨行（A/B 測試）'),$(bullet 'A：快遞來了又被狗吠到崩潰？3 分鐘搞定門鈴炸裂'),$(bullet 'B：門鈴響→狗狂吠→你大吼→快遞嚇跑。這個循環，今天結束。'),$(heading 'Preview Text'),$(para '不用止吠器，不用大吼，手機就能練'),$(heading 'Hook'),$(para '「門鈴響→狗狂吠→你大吼→快遞嚇跑→你更崩潰。這個劇情，一天上演幾次？」'),$(heading '核心內容'),$(para '3 步驟門鈴減敏速成法（手機錄音 → 低音量+零食 → 漸進提高）'),$(heading '環境管理 Tips'),$(para '門口貼字條請快遞先打電話；提前將狗狗引導到安全空間'),$(heading 'CTA'),$(para '門鈴吠叫卡關？→ 預約 1 對 1 諮詢')]"

sleep 1

# Newsletter 3
echo "3/20: 吠叫系列 3【電子報】"
create_page \
  "吠叫系列 3【電子報】鄰居終於留了紙條⋯你的狗可能不是亂叫，是在喊「別丟下我」" \
  "Newsletter" \
  '[{"name":"鄰居投訴"},{"name":"公寓養狗"},{"name":"台灣法規"},{"name":"分離焦慮"}]' \
  "[$(heading '主旨行（A/B 測試）'),$(bullet 'A：鄰居終於留了紙條⋯你的狗不是亂叫，是在喊「別丟下我」'),$(bullet 'B：狗叫被檢舉會罰多少？社維法飼主必知的 3 件事'),$(heading 'Preview Text'),$(para '先別慌——了解法規 × 理解吠叫，你可以主動出擊'),$(heading 'Hook'),$(para '「你出門上班覺得沒事，直到鄰居傳來那段錄音——你的狗從你關門那一刻開始叫，一直叫到你回來。」'),$(heading '核心內容'),$(para '社維法第 72 條 + 公寓大廈管理條例重點摘要 → 飼主主動應對 3 步驟'),$(heading 'CTA'),$(para '你的狗狗可能不只是「亂叫」→ 免費行為評估')]"

sleep 1

# Newsletter 4
echo "4/20: 吠叫系列 4【電子報】"
create_page \
  "吠叫系列 4【電子報】上班 8 小時，狗叫 8 小時——分離焦慮 3 個判斷指標" \
  "Newsletter" \
  '[{"name":"分離焦慮"},{"name":"獨處訓練"},{"name":"上班族養狗"}]' \
  "[$(heading '主旨行（A/B 測試）'),$(bullet 'A：上班 8 小時，狗叫 8 小時——「忽略法」反而讓牠更崩潰'),$(bullet 'B：你的狗在你出門後的前 10 分鐘做了什麼？答案可能讓你心碎'),$(heading 'Hook'),$(para '「很多人說不理牠就好了，叫一陣就會停。但如果是分離焦慮——越忽略，越惡化。」'),$(heading '核心內容'),$(para '分離焦慮 vs 無聊吠叫的 3 個判斷指標表格（開門後行為、破壞痕跡、影片觀察）'),$(heading 'CTA'),$(para '填寫問卷讓訓犬師判斷是分離焦慮還是無聊')]"

sleep 1

# Newsletter 5
echo "5/20: 吠叫系列 5【電子報】"
create_page \
  "吠叫系列 5【電子報】散步變噩夢？狗狗見狗就炸——不是牠壞，是牠太害怕" \
  "Newsletter" \
  '[{"name":"反應性吠叫"},{"name":"散步訓練"},{"name":"社會化"}]' \
  "[$(heading '主旨行（A/B 測試）'),$(bullet 'A：散步變噩夢？狗狗見狗就炸——不是牠壞，是牠太害怕'),$(bullet 'B：牠不是在攻擊，是在說「拜託離我遠一點」'),$(heading 'Hook'),$(para '「每次散步都像打仗——遠遠看到一隻狗，牠就開始拉、吠、暴衝。你拽緊牽繩的手已經磨出繭了。」'),$(heading '核心內容'),$(para '反應性的 2 種類型（恐懼型 vs 興奮型）速判法 + U 型轉彎應急技巧'),$(heading 'CTA'),$(para '散步暴衝吠叫讓你崩潰？→ 預約到府評估')]"

sleep 1

# Newsletter 6
echo "6/20: 吠叫系列 6【電子報】"
create_page \
  "吠叫系列 6【電子報】客人一來狗就狂叫，你的臉好綠——對陌生人吠叫怎麼辦" \
  "Newsletter" \
  '[{"name":"陌生人吠叫"},{"name":"社會化"},{"name":"居家訓練"}]' \
  "[$(heading '主旨行（A/B 測試）'),$(bullet 'A：客人一來狗就狂叫，你的臉好綠——3 個讓狗冷靜的居家妙招'),$(bullet 'B：「你的狗會咬人嗎？」——每位飼主最怕被問的那句話'),$(heading 'Hook'),$(para '「朋友來做客，門一開，你的狗就像按了警報鈕——你一邊拉狗一邊道歉，場面極度尷尬。」'),$(heading '核心內容'),$(para '安全距離 + 陌生人拋食法 + 「去位置」指令的快速版'),$(heading 'CTA'),$(para '陌生人吠叫讓社交生活歸零？→ 1 對 1 線上諮詢')]"

sleep 1

# Newsletter 7
echo "7/20: 吠叫系列 7【電子報】"
create_page \
  "吠叫系列 7【電子報】狗叫就給，你正在養出一隻小霸王——需求型吠叫的正確回應" \
  "Newsletter" \
  '[{"name":"需求型吠叫"},{"name":"正向強化"},{"name":"行為塑造"}]' \
  "[$(heading '主旨行（A/B 測試）'),$(bullet 'A：狗叫就給，你正在養出一隻小霸王——需求型吠叫的正確回應'),$(bullet 'B：牠一叫你就理，牠學到的是：「叫=有效」'),$(heading 'Hook'),$(para '「狗狗在門口叫→你開門。狗狗在飯碗旁叫→你餵飯。恭喜，牠已經完成了對你的訓練。」'),$(heading '核心內容'),$(para '需求型吠叫的辨識特徵 + 「等待安靜再獎勵」的正確時機（2 秒法則）'),$(heading 'CTA'),$(para '不確定你是在訓練狗還是狗在訓練你？→ 行為評估')]"

sleep 1

# Newsletter 8
echo "8/20: 吠叫系列 8【電子報】"
create_page \
  "吠叫系列 8【電子報】每天散步 40 分鐘牠還是叫不停——你只做對了一半" \
  "Newsletter" \
  '[{"name":"無聊吠叫"},{"name":"心智消耗"},{"name":"運動迷思"},{"name":"嗅聞遊戲"}]' \
  "[$(heading '主旨行（A/B 測試）'),$(bullet 'A：每天散步 40 分鐘牠還是叫不停？你只做對了一半'),$(bullet 'B：跑了 30 分鐘，回家還是叫個不停——你累了，牠沒有'),$(heading 'Hook'),$(para '「你已經很努力了——每天散步 40 分鐘、假日還帶去狗公園，但牠回家還是叫。問題不在你的努力，在方向。」'),$(heading '核心內容'),$(para '身體疲勞 vs 大腦疲勞 + 3 個今天就能開始的動腦遊戲'),$(heading 'CTA'),$(para '想知道更多讓狗狗「腦累」的方法？→ 加入私密社群')]"

sleep 1

# Newsletter 9
echo "9/20: 吠叫系列 9【電子報】"
create_page \
  "吠叫系列 9【電子報】老狗突然變話癆？別只當牠「老番癲」——可能是認知障礙" \
  "Newsletter" \
  '[{"name":"老犬照護"},{"name":"認知障礙 CDS"},{"name":"夜間吠叫"},{"name":"高齡犬"}]' \
  "[$(heading '主旨行（A/B 測試）'),$(bullet 'A：老狗突然變話癆？別只當牠「老番癲」——可能是大腦在退化'),$(bullet 'B：10歲以上的狗突然愛叫，不是任性——獸醫說的這個詞你該知道'),$(heading 'Hook'),$(para '「牠以前不這樣的。明明睡在旁邊，卻半夜突然對著空氣叫。你叫牠，牠好像沒聽到。」'),$(heading '核心內容'),$(para 'CDS 的 5 大徵兆（DISHA）快速自評 + 何時該看獸醫'),$(heading 'CTA'),$(para '高齡犬行為改變了？→ 填寫問卷讓我們幫你初步判斷')]"

sleep 1

# Newsletter 10
echo "10/20: 吠叫系列 10【電子報】"
create_page \
  "吠叫系列 10【電子報】止吠項圈、大聲喝斥、噴水⋯全都是錯的——3 個止吠真相" \
  "Newsletter" \
  '[{"name":"止吠迷思"},{"name":"正向訓練"},{"name":"懲罰式訓練批判"}]' \
  "[$(heading '主旨行（A/B 測試）'),$(bullet 'A：止吠項圈、大聲喝斥、噴水⋯全都是錯的'),$(bullet 'B：「叫牠安靜！」如果這招有用，你早就不會在看這封信了'),$(heading 'Hook'),$(para '「Google 搜尋如何讓狗不叫，前十名教你：噴水、電擊項圈、大吼安靜。你試了哪幾個？又哪個真的有效？」'),$(heading '核心內容'),$(para '3 個止吠真相（懲罰壓制症狀不解決原因 / 止吠器造成學習性無助 / 大吼=你加入合唱）'),$(heading 'CTA'),$(para '想用正確的方式解決吠叫問題？→ 預約諮詢')]"

sleep 1

echo ""
echo "📝 建立部落格 (1-10)..."
echo ""

# Blog 1
echo "11/20: 吠叫系列 1【部落格】"
create_page \
  "吠叫系列 1【部落格】狗狗一直叫怎麼辦？訓犬師教你聽懂 6 種吠叫語言，用對方法才有效" \
  "Blog" \
  '[{"name":"吠叫語言"},{"name":"認知翻轉"},{"name":"正向訓練"},{"name":"完整指南"}]' \
  "[$(heading '吠叫是狗狗的語言，不是問題行為'),$(para '定義式開頭，建立「先聽懂，再回應」品牌觀點'),$(heading '6 種吠叫語言大解碼（附辨識圖表）'),$(bullet '🔊 警戒叫——急促、連續、對著刺激源'),$(bullet '😰 焦慮叫——高頻、哀嚎、踱步或舔嘴'),$(bullet '🎉 興奮叫——短促、高亢、跳躍或轉圈'),$(bullet '🙋 需求叫——單聲、有節奏、看著你'),$(bullet '😴 無聊叫——單調、重複、無明確目標'),$(bullet '😣 疼痛叫——突然、尖銳、異常姿勢'),$(heading '每種吠叫的正確回應策略'),$(para '6 種類型各給出「做什麼 / 不做什麼」'),$(heading '制止吠叫的 5 個常見錯誤'),$(para '大聲喝斥、止吠項圈、每次都給零食、關籠懲罰、完全忽略'),$(heading '什麼時候該求助訓犬師？'),$(para '5 個判斷指標'),$(heading '常見問題'),$(para 'Q&A x 4'),$(heading 'CTA'),$(para '狗狗吠叫讓你崩潰？預約免費行為評估')]"

sleep 1

# Blog 2
echo "12/20: 吠叫系列 2【部落格】"
create_page \
  "吠叫系列 2【部落格】門鈴一響就炸裂？3 步驟減敏訓練讓狗狗不再瘋狂警報" \
  "Blog" \
  '[{"name":"門鈴吠叫"},{"name":"減敏訓練"},{"name":"聲音反應"},{"name":"環境管理"}]' \
  "[$(heading '門鈴→狗叫→你崩潰：這個循環可以終結'),$(heading '為什麼門鈴會讓狗狗這麼抓狂？'),$(para '行為學解釋（古典制約、領域本能）'),$(heading '3 步驟門鈴減敏訓練法（附每日訓練時間表）'),$(bullet 'Step 1：手機錄門鈴聲，最低音量 + 高價值零食（3-5 天）'),$(bullet 'Step 2：漸進提高音量，不吠叫就獎勵（1-2 週）'),$(bullet 'Step 3：真人模擬按門鈴 +「去位置」指令（2-3 週）'),$(heading '訓練期間的環境管理 5 妙招'),$(heading '常見問題'),$(heading 'CTA'),$(para '門鈴不再是災難——讓狗狗幫你迎接客人')]"

sleep 1

# Blog 3
echo "13/20: 吠叫系列 3【部落格】"
create_page \
  "吠叫系列 3【部落格】狗狗半夜一直叫？公寓飼主必看的 5 大原因 × 解決方案（含台灣法規）" \
  "Blog" \
  '[{"name":"夜間吠叫"},{"name":"公寓法規"},{"name":"鄰居投訴"},{"name":"社維法"}]' \
  "[$(heading '半夜狗叫——你跟鄰居都失眠的惡夢'),$(heading '為什麼你的狗半夜一直叫？5 大原因解析'),$(bullet '原因 1：環境刺激'),$(bullet '原因 2：分離焦慮'),$(bullet '原因 3：生理需求'),$(bullet '原因 4：精力未消耗完'),$(bullet '原因 5：高齡認知障礙（CDS）'),$(heading '5 個立即可行的夜間吠叫解方'),$(heading '飼主必知：台灣法規怎麼說？'),$(para '社維法第 72 條 + 公寓大廈管理條例第 16 條'),$(heading '常見問題'),$(heading 'CTA')]"

sleep 1

# Blog 4
echo "14/20: 吠叫系列 4【部落格】"
create_page \
  "吠叫系列 4【部落格】上班狗叫整天？分離焦慮型吠叫的判斷、原因與 6 週改善計畫" \
  "Blog" \
  '[{"name":"分離焦慮"},{"name":"獨處訓練"},{"name":"環境管理"},{"name":"漸進式訓練"}]' \
  "[$(heading '你出門後的前 10 分鐘，牠做了什麼？'),$(heading '分離焦慮 vs 無聊吠叫：3 個判斷指標（附自評表）'),$(heading '為什麼你的狗離不開你？4 大根本原因'),$(heading '6 週分離焦慮改善計畫'),$(bullet '第 1-2 週：建立安全基地（籠內訓練 + 安撫環境）'),$(bullet '第 3-4 週：漸進式短暫離家演練'),$(bullet '第 5-6 週：真實情境模擬 + 時間延長'),$(heading '3 個今天就能做的環境調整'),$(heading '什麼時候該尋求獸醫協助？'),$(heading '常見問題'),$(heading 'CTA')]"

sleep 1

# Blog 5
echo "15/20: 吠叫系列 5【部落格】"
create_page \
  "吠叫系列 5【部落格】狗狗看到其他狗就暴衝狂叫？反應性吠叫的 3 階段正向訓練全攻略" \
  "Blog" \
  '[{"name":"反應性吠叫"},{"name":"散步訓練"},{"name":"BAT訓練"},{"name":"安全距離"}]' \
  "[$(heading '什麼是反應性（Reactivity）？牠不是壞狗'),$(heading '恐懼型 vs 興奮型反應性：判別與應對差異'),$(heading '為什麼你的狗會對其他狗瘋狂吠叫？4 大原因'),$(heading '3 階段反應性吠叫訓練計畫'),$(bullet 'Phase 1：找到「安全距離」'),$(bullet 'Phase 2：反制約訓練'),$(bullet 'Phase 3：漸進縮短距離 + 教導替代行為'),$(heading '散步實戰技巧——5 個立即可用的應變策略'),$(heading '3 個常見失敗原因'),$(heading '常見問題'),$(heading 'CTA')]"

sleep 1

# Blog 6
echo "16/20: 吠叫系列 6【部落格】"
create_page \
  "吠叫系列 6【部落格】狗狗對陌生人一直叫？不是不友善，是不知道安全——社會化訓練完整指南" \
  "Blog" \
  '[{"name":"陌生人吠叫"},{"name":"社會化"},{"name":"安全距離"},{"name":"拋食法"}]' \
  "[$(heading '「你的狗會咬人嗎？」——最讓飼主心碎的一句話'),$(heading '狗狗對陌生人吠叫的 4 大原因'),$(heading '居家情境訓練——客人來訪時的 3 步管理法'),$(heading '戶外情境訓練——安全距離 × 陌生人拋食法'),$(heading '社會化窗口期過了怎麼辦？'),$(heading '常見問題'),$(heading 'CTA')]"

sleep 1

# Blog 7
echo "17/20: 吠叫系列 7【部落格】"
create_page \
  "吠叫系列 7【部落格】狗狗叫就給牠——你無意間養出了一隻「用叫的」就能控制你的狗" \
  "Blog" \
  '[{"name":"需求型吠叫"},{"name":"行為塑造"},{"name":"正向強化"},{"name":"2秒法則"}]' \
  "[$(heading '恭喜，你的狗已經完成了對你的訓練'),$(heading '什麼是需求型吠叫？辨識 3 特徵'),$(heading '你是怎麼「教會」牠用叫的？'),$(heading '正確回應 3 原則'),$(bullet '原則 1：吠叫中 ≠ 獎勵時機'),$(bullet '原則 2：等待安靜的「2 秒法則」'),$(bullet '原則 3：教導替代行為'),$(heading '全家一致性——破功的那個人通常是你'),$(heading '常見問題'),$(heading 'CTA')]"

sleep 1

# Blog 8
echo "18/20: 吠叫系列 8【部落格】"
create_page \
  "吠叫系列 8【部落格】每天帶狗狗散步 40 分鐘，牠還是叫個不停？你只做對了一半" \
  "Blog" \
  '[{"name":"無聊吠叫"},{"name":"心智消耗"},{"name":"嗅聞遊戲"},{"name":"破解迷思"}]' \
  "[$(heading '「讓牠跑累就好了」——最常見的吠叫誤解'),$(heading '身體疲勞 vs. 大腦疲勞：兩種完全不同的累'),$(heading '哪些狗狗最需要大腦刺激？'),$(heading '3 個今天就能開始的動腦遊戲'),$(bullet '嗅覺搜索遊戲——把零食藏在家裡'),$(bullet '漏食玩具——用吃飯時間做「工作」'),$(bullet '嗅聞散步——不催促，讓牠自己決定節奏'),$(heading '為什麼 15 分鐘嗅覺工作比 1 小時跑步更有效？'),$(heading '常見問題'),$(heading 'CTA')]"

sleep 1

# Blog 9
echo "19/20: 吠叫系列 9【部落格】"
create_page \
  "吠叫系列 9【部落格】老狗突然一直叫？高齡犬吠叫的認知障礙（CDS）評估與照護指南" \
  "Blog" \
  '[{"name":"老犬照護"},{"name":"CDS認知障礙"},{"name":"夜間吠叫"},{"name":"獸醫轉介"}]' \
  "[$(heading '「牠以前不這樣的⋯」——老犬行為改變的警訊'),$(heading '什麼是犬認知障礙症候群（CDS）？'),$(heading 'DISHA 自評法：5 大徵兆快速檢測'),$(bullet 'D — 迷路/迷失方向'),$(bullet 'I — 互動改變'),$(bullet 'S — 睡眠/生理節律異常'),$(bullet 'H — 如廁習慣改變'),$(bullet 'A — 活動力變化'),$(heading 'CDS 型吠叫 vs 其他類型吠叫的鑑別'),$(heading '你能為老犬做的 5 件事'),$(heading '何時該看獸醫？'),$(heading '常見問題'),$(heading 'CTA')]"

sleep 1

# Blog 10
echo "20/20: 吠叫系列 10【部落格】"
create_page \
  "吠叫系列 10【部落格】止吠項圈、大聲喝斥、關籠懲罰⋯ 5 大止吠迷思 × 科學真相" \
  "Blog" \
  '[{"name":"止吠迷思"},{"name":"正向訓練"},{"name":"懲罰批判"},{"name":"科學依據"}]' \
  "[$(heading 'Google 搜尋「如何讓狗不叫」——前十名有 8 個是錯的'),$(heading '迷思 × 真相：5 大常見止吠方法的科學拆解'),$(bullet '❌ 迷思 1：止吠器/電擊項圈 → 學習性無助'),$(bullet '❌ 迷思 2：大聲喝斥「安靜！」→ 狗以為你加入合唱'),$(bullet '❌ 迷思 3：噴水/彈鼻子 → 建立恐懼連結'),$(bullet '❌ 迷思 4：關籠懲罰 → 籠子變監獄'),$(bullet '❌ 迷思 5：完全忽略 → 分離焦慮型越忽略越嚴重'),$(heading '那什麼才有效？正向訓練的 3 大核心原則'),$(heading 'KPA 認證訓犬師的底線——我們為什麼堅持不用懲罰'),$(heading '常見問題'),$(heading 'CTA')]"

echo ""
echo "=== ✅ 全部 20 篇已建立完成 ==="
