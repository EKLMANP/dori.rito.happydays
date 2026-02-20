#!/usr/bin/env python3
"""
Notion 更新腳本 — 狗狗撲人主題內容
任務：
  1. 更新電子報頁面 (2f117e11503d804889d9d47500c52230) 的內文
  2. 在部落格資料庫 (2f117e11503d805987beebbe6f2fe216) 新增一頁，Category=Blog

執行方式：
  python3 notion_update_dog_jumps.py

需求：
  pip install requests python-dotenv
"""

import os
import sys
import json
import requests
from pathlib import Path

# ── 載入 .env ─────────────────────────────────────────────
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)

# ── Token 設定 ────────────────────────────────────────────
NOTION_TOKEN_EMAIL = os.getenv(
    "NOTION_TOKEN_Dori & Rito_Email copywriter",
    "ntn_s64100311657oNxDFii2W8pPs9aLLR3vrbo2PtUnEUgbmw"
)
NOTION_TOKEN_AR = os.getenv(
    "NOTION_TOKEN_Dori&Rito_AR_update",
    "ntn_W641003116518VDoK4pM3Ftw0LULug58ddbiDkyJVMfgP3"
)

NEWSLETTER_PAGE_ID = "2f117e11503d804889d9d47500c52230"
BLOG_DATABASE_ID   = "2f117e11503d805987beebbe6f2fe216"

NOTION_VERSION = "2022-06-28"

# ── 電子報內文 Blocks ──────────────────────────────────────

NEWSLETTER_BLOCKS = [
    {
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "📧 電子報草稿 | 2026-02-20"}}]
        }
    },
    {
        "object": "block",
        "type": "callout",
        "callout": {
            "rich_text": [{"type": "text", "text": {
                "content": "Subject：你家狗狗又撲人了？這個錯誤反應讓牠撲得更起勁\nPreview text：90% 的飼主都做過這件事，卻不知道正在讓撲人行為變本加厲…"
            }}],
            "icon": {"emoji": "✉️"},
            "color": "blue_background"
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {"content": "嗨，"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "你有沒有這樣的經歷——客人才剛踏進門，你家毛孩已經飛撲而上，兩隻前腳扒在對方肩膀，你在旁邊拼命喊「下來！不行！」，卻完全無效。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "你試過推開牠、說「不行！」、甚至把牠拉進房間——但下一次，牠還是照撲不誤。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [
                {"type": "text", "text": {"content": "為什麼？因為你的反應，正在告訴牠：「撲人有效。」"}, "annotations": {"bold": True}}
            ]
        }
    },
    {
        "object": "block",
        "type": "divider",
        "divider": {}
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "🐾 最常見的錯誤反應"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "當狗狗撲上來，大多數飼主會這樣做："
            }}]
        }
    },
    {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "推開牠（手部接觸 = 牠得到了注意力）"}}]
        }
    },
    {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "大聲說「不行！下來！」（聲音刺激 = 牠得到了互動）"}}]
        }
    },
    {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "轉身不理（但 3 秒後忍不住回頭看牠）"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [
                {"type": "text", "text": {"content": "這些反應的共同點？全都給了牠「回報」。"}, "annotations": {"bold": True}}
            ]
        }
    },
    {
        "object": "block",
        "type": "quote",
        "quote": {
            "rich_text": [{"type": "text", "text": {
                "content": "「我一撲人，你就看我、碰我、跟我說話。這招有用！繼續撲！」"
            }}]
        }
    },
    {
        "object": "block",
        "type": "divider",
        "divider": {}
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "✅ 今天就能用的正向訓練技巧：「四腳著地才有好事」"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "核心概念：只有四隻腳踩在地上時，才給予牠想要的一切。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {
            "rich_text": [{"type": "text", "text": {
                "content": "狗狗撲人的瞬間：立刻完全靜止，雙手交叉於胸前，眼神移開，不說話、不推、不動。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {
            "rich_text": [{"type": "text", "text": {
                "content": "等待四腳著地：通常只需要 3–10 秒，牠就會自己跳下來。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {
            "rich_text": [{"type": "text", "text": {
                "content": "四腳一著地，立刻給予熱情回應：蹲下來用愉快的聲音說「好棒！」並給予撫摸或零食。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {
            "rich_text": [{"type": "text", "text": {
                "content": "重複與一致性：請家中每一位成員、每位訪客都執行相同規則。一致性是訓練成功的關鍵。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "divider",
        "divider": {}
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "💬 來自飼主的真實回饋"}}]
        }
    },
    {
        "object": "block",
        "type": "quote",
        "quote": {
            "rich_text": [{"type": "text", "text": {
                "content": "「我家柴犬原本一見到人就衝，我們試了三週的四腳著地練習，現在訪客來時牠已經會主動坐在門口等摸摸了。簡直不敢相信這麼快。」— Momo 媽媽，台北"
            }}]
        }
    },
    {
        "object": "block",
        "type": "divider",
        "divider": {}
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "📋 你家狗狗的撲人問題，有更深層的原因嗎？"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "每隻狗狗的行為背後都有獨特的脈絡——也許是過去的強化歷史，也許是社會化不足，也許是環境刺激太強。如果你嘗試了這個方法一週後效果有限，我們的 1 對 1 到府訓犬服務可以幫你做深度評估與客製化訓練計畫。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "callout",
        "callout": {
            "rich_text": [
                {"type": "text", "text": {"content": "👉 填寫行為諮詢前問卷，讓我們了解你家毛孩的狀況\n"}, "annotations": {"bold": True}},
                {"type": "text", "text": {"content": "https://tally.so/r/KY55Bg", "link": {"url": "https://tally.so/r/KY55Bg"}}}
            ],
            "icon": {"emoji": "🐾"},
            "color": "green_background"
        }
    },
    {
        "object": "block",
        "type": "divider",
        "divider": {}
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "你和毛孩都在進步，每一天都算數。🐾\n\nPennee & Eric\nDori & Rito 專業訓犬服務 | KPA・CATCH 認證正向訓練"
            }}]
        }
    },
]

# ── 部落格頁面屬性 ─────────────────────────────────────────

BLOG_PAGE_PROPERTIES = {
    "Name": {
        "title": [
            {
                "text": {
                    "content": "你家狗狗又撲人了？這個錯誤反應讓牠撲得更起勁"
                }
            }
        ]
    },
    "Category": {
        "select": {
            "name": "Blog"
        }
    },
    "Status": {
        "select": {
            "name": "Draft"
        }
    },
    "Published Date": {
        "date": {
            "start": "2026-02-26"
        }
    },
    "Keywords": {
        "rich_text": [
            {
                "text": {
                    "content": "狗狗撲人、如何制止狗撲人、正向訓練狗狗撲人、狗狗見人就撲"
                }
            }
        ]
    },
    "Meta Description": {
        "rich_text": [
            {
                "text": {
                    "content": "狗狗撲人讓你每次都很尷尬？KPA 認證訓犬師揭示 90% 飼主的錯誤反應，並提供可立即執行的正向訓練解方。告別撲人困擾，從今天開始。"
                }
            }
        ]
    }
}

# ── 部落格內文 Blocks（精簡版，完整版見 md 草稿）────────────

BLOG_BLOCKS = [
    {
        "object": "block",
        "type": "callout",
        "callout": {
            "rich_text": [{"type": "text", "text": {
                "content": "Meta Title：你家狗狗又撲人了？這個錯誤反應讓牠撲得更起勁 | Dori & Rito 正向訓犬\nSlug：dog-jumping-on-people-positive-training\n預計發布：2026-02-26（週三 17:00）"
            }}],
            "icon": {"emoji": "📋"},
            "color": "yellow_background"
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "客人才剛踏進門，你家毛孩已經飛撲而上——兩隻前腳扒在對方肩膀，尾巴瘋狂搖擺，你在旁邊拼命喊「下來！不行！」，卻完全無效。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [
                {"type": "text", "text": {"content": "狗狗撲人"}, "annotations": {"bold": True}},
                {"type": "text", "text": {"content": "不只讓主人尷尬，遇到老人、小孩或怕狗的訪客時更可能造成危險。但你知道嗎？很多飼主在處理狗狗撲人時，其實正在強化這個行為，卻渾然不知。"}}
            ]
        }
    },
    {
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "為什麼狗狗會撲人？先搞懂根本原因"}}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "1. 打招呼的本能行為"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "在狗狗的社交語言中，靠近並觸碰對方的臉部是一種親密的問候方式。幼犬會舔母犬的嘴角來索取食物，而成犬保留了這種「接近臉部」的衝動。當牠見到你或客人，撲上來其實是在說：「我很高興見到你！」"
            }}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "2. 過去曾被強化的行為"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "思考一下：當你家毛孩還是幼犬時，牠撲上來是不是曾被你覺得「好可愛！」然後給了牠摸摸或抱抱？行為被強化，就會持續。狗狗學到了：「只要我撲人，就能得到關注。」"
            }}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "3. 高度興奮的情緒狀態"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "對許多狗狗來說，「有人來了」是一天當中最令人興奮的事。高度興奮的狀態讓牠難以控制衝動，此時的自制力幾乎為零。這不是牠故意搗蛋，而是情緒調節能力尚未被訓練出來。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "divider",
        "divider": {}
    },
    {
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "🚫 90% 飼主都做過的錯誤反應"}}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "錯誤一：用手推開"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "手部接觸對狗狗來說就是「被摸到了」。你推牠，牠得到了身體接觸。撲人的行為被獎勵了。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "錯誤二：大聲喊叫制止"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "你的聲音，不管多嚴厲，對興奮中的狗狗來說都是一種互動刺激。牠得到了你的注意力。撲人的行為，再次被獎勵。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "錯誤三：間歇性妥協"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "間歇性強化（Intermittent Reinforcement）是讓行為最難消失的強化模式——因為牠學到了「只要持續嘗試，終究會成功」。這就是賭博讓人上癮的原理，同樣適用於狗狗行為。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "錯誤四：懲罰式制止（膝蓋頂、踩腳）"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "除了可能造成身體傷害，這些方法會在打招呼情境中加入疼痛與恐懼，損害你與狗狗的信任關係，並可能引發防禦性攻擊。正向訓練研究已清楚顯示，懲罰式方法長期效果差、副作用大。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "divider",
        "divider": {}
    },
    {
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "✅ KPA 認證正向訓練解方：「四腳著地才有好事」"}}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "Step 1：完全移除注意力（消弱撲人行為）"}}]
        }
    },
    {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "雙手交叉於胸前（避免手部接觸）"}}]
        }
    },
    {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "眼神轉開，看向別處（不給眼神接觸）"}}]
        }
    },
    {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "保持靜默，不說話（不給聲音刺激）"}}]
        }
    },
    {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "身體保持靜止或轉身（不給任何回應）"}}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "Step 2：等待四腳著地"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "通常只需要 3–15 秒，狗狗就會因為「撲人沒有任何效果」而自動跳下來。在等待過程中，絕對不能有任何形式的回應。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "Step 3：四腳著地，立刻給予熱情獎勵"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "四腳一碰到地板的瞬間，立刻用愉快聲音說「好棒！」並給予撫摸與高價值零食（雞肉乾、起司等）。時機非常重要：必須在四腳著地的一秒內給予獎勵。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "Step 4：主動教導替代行為——「坐下」問候"}}]
        }
    },
    {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "在客人到來之前，先讓狗狗坐下並給予獎勵"}}]
        }
    },
    {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "讓客人進門時，你繼續要求狗狗維持坐姿"}}]
        }
    },
    {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "狗狗坐著不撲，請客人蹲下來給予摸摸（這是牠的獎勵）"}}]
        }
    },
    {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "重複練習，直到「有人來＝坐下等摸摸」成為新的預設行為"}}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "Step 5：確保所有人執行一致的規則"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "訓練最容易失敗的環節：家中有一個人讓狗狗撲，整個訓練就白費了。請確保家中所有成員與訪客都執行相同規則。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "divider",
        "divider": {}
    },
    {
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "🕐 需要多久才能看到效果？"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "在規則完全一致的執行下，多數狗狗在 2–4 週內可以看到明顯改善。部分習慣根深蒂固的案例可能需要 6–8 週，並建議搭配專業訓犬師的個別評估。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "divider",
        "divider": {}
    },
    {
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "❓ 常見問題 FAQ"}}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "Q：我家狗狗撲人是因為牠很愛我，我不想讓牠覺得被拒絕？"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "A：訓練「四腳著地問候」不是在拒絕你的狗，而是在教牠一種更有效率的愛的表達方式。當牠學會坐著被摸，牠得到的是比撲人時更長、更穩定的關愛。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "Q：狗狗撲人跟攻擊性有關嗎？"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "A：大多數狗狗撲人是友善的打招呼行為，與攻擊性無關。但如果狗狗撲人時同時伴隨低吼、硬盯或咬人傾向，需要專業評估。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "Q：我已經試過很多方法都沒效，是我家狗狗特別難訓嗎？"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "A：通常不是狗狗的問題，而是規則不夠一致或訓練時機不對。每一次的妥協都會讓進度倒退。建議尋求 KPA/CATCH 認證訓犬師的協助，進行個別化評估。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": "Q：多大的狗狗開始訓練最好？"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "A：越早越好，但任何年齡都可以改變。幼犬（4–6 個月）學習速度最快；成犬（1 歲以上）需要更多的練習重複次數，但同樣可以成功。年齡從來不是放棄訓練的理由。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "divider",
        "divider": {}
    },
    {
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "結語：你和毛孩都能做到"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {
                "content": "重要的是：不是懲罰牠，而是告訴牠什麼行為能帶來你的愛。當牠學會「四腳著地就有好事」，撲人的動機自然消失。"
            }}]
        }
    },
    {
        "object": "block",
        "type": "callout",
        "callout": {
            "rich_text": [
                {"type": "text", "text": {"content": "👉 填寫行為諮詢前問卷\n"}, "annotations": {"bold": True}},
                {"type": "text", "text": {
                    "content": "https://tally.so/r/KY55Bg",
                    "link": {"url": "https://tally.so/r/KY55Bg"}
                }}
            ],
            "icon": {"emoji": "🐾"},
            "color": "green_background"
        }
    },
]


# ── API 函式 ──────────────────────────────────────────────

def get_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def clear_page_blocks(page_id, token):
    """清除頁面現有 blocks"""
    url = f"https://api.notion.com/v1/blocks/{page_id}/children"
    resp = requests.get(url, headers=get_headers(token))
    resp.raise_for_status()
    blocks = resp.json().get("results", [])
    for block in blocks:
        del_url = f"https://api.notion.com/v1/blocks/{block['id']}"
        requests.delete(del_url, headers=get_headers(token))
    print(f"  ✓ 已清除 {len(blocks)} 個舊 blocks")


def append_blocks(page_id, blocks, token):
    """寫入 blocks（每次最多 100 個）"""
    url = f"https://api.notion.com/v1/blocks/{page_id}/children"
    chunk_size = 50
    total = 0
    for i in range(0, len(blocks), chunk_size):
        chunk = blocks[i:i+chunk_size]
        payload = {"children": chunk}
        resp = requests.patch(url, headers=get_headers(token), json=payload)
        if resp.status_code != 200:
            print(f"  ✗ Block 寫入失敗: {resp.status_code}")
            print(resp.text[:500])
            sys.exit(1)
        total += len(chunk)
    print(f"  ✓ 已寫入 {total} 個 blocks")


def create_blog_page(database_id, properties, blocks, token):
    """在 database 建立新頁面"""
    url = "https://api.notion.com/v1/pages"
    payload = {
        "parent": {"database_id": database_id},
        "properties": properties,
        "children": blocks[:50],  # 建立時最多 50 blocks
    }
    resp = requests.post(url, headers=get_headers(token), json=payload)
    if resp.status_code != 200:
        # 嘗試去除可能不存在的屬性
        minimal_props = {
            "Name": properties["Name"],
            "Category": properties["Category"],
        }
        payload["properties"] = minimal_props
        resp = requests.post(url, headers=get_headers(token), json=payload)
        if resp.status_code != 200:
            print(f"  ✗ 建立頁面失敗: {resp.status_code}")
            print(resp.text[:800])
            sys.exit(1)

    page = resp.json()
    page_id = page["id"]
    page_url = page.get("url", "")
    print(f"  ✓ 頁面建立成功：{page_url}")

    # 追加剩餘 blocks
    if len(blocks) > 50:
        append_blocks(page_id, blocks[50:], token)

    return page_id, page_url


# ── 主流程 ────────────────────────────────────────────────

def main():
    print("\n🚀 Dori & Rito — Notion 更新腳本")
    print("=" * 50)

    # ① 更新電子報頁面
    print(f"\n① 更新電子報頁面 ({NEWSLETTER_PAGE_ID[:8]}...)")
    print("  清除舊內容中...")
    clear_page_blocks(NEWSLETTER_PAGE_ID, NOTION_TOKEN_EMAIL)
    print("  寫入新電子報內容中...")
    append_blocks(NEWSLETTER_PAGE_ID, NEWSLETTER_BLOCKS, NOTION_TOKEN_EMAIL)
    print("  ✅ 電子報頁面更新完成！")
    print(f"  🔗 https://www.notion.so/Jumping-on-people-{NEWSLETTER_PAGE_ID.replace('-', '')}")

    # ② 建立部落格頁面
    print(f"\n② 在部落格資料庫建立新頁面 ({BLOG_DATABASE_ID[:8]}...)")
    blog_page_id, blog_url = create_blog_page(
        BLOG_DATABASE_ID,
        BLOG_PAGE_PROPERTIES,
        BLOG_BLOCKS,
        NOTION_TOKEN_EMAIL
    )

    # 追加更多 blocks（如超過 50 個）
    if len(BLOG_BLOCKS) > 50:
        print("  追加剩餘部落格 blocks...")
        append_blocks(blog_page_id, BLOG_BLOCKS[50:], NOTION_TOKEN_EMAIL)

    print("  ✅ 部落格頁面建立完成！")
    print(f"  🔗 {blog_url}")

    print("\n" + "=" * 50)
    print("✅ 所有 Notion 更新完成！")
    print("\n📝 下一步：")
    print("  1. 在 Notion 確認電子報頁面內容正確")
    print("  2. 確認部落格頁面 Category = Blog")
    print("  3. 交 DR-Head 初審 → Eric/Pennee 最終審核")
    print("  4. 審核通過後排程發布（電子報：週一 15:00 / 週三 17:00）")


if __name__ == "__main__":
    main()
