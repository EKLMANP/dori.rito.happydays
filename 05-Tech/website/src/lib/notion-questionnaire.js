/**
 * Notion Questionnaire Push — 狗狗行為諮詢前問卷
 *
 * Pushes completed questionnaire data to the Notion database
 * "狗狗行為諮詢前問卷" (ID from NOTION_QUESTIONNAIRE_DB_ID).
 *
 * Separate from notion-crm.js which handles the CRM customer database.
 */

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// --- Value Mappings for special Notion property types ---

const GENDER_MAP = {
    male: '男生 Male',
    female: '女生Female',
};

const NEUTERED_MAP = {
    yes: '是 Yes',
    no: '否 No',
};

const HEALTH_MAP = {
    arthritis: '關節炎 Arthritis',
    'ear-infection': '耳炎 Ear Infection',
    'vision-loss': '視力退化/白內障',
    'hearing-loss': '聽力退化',
    pancreatitis: '胰臟炎/胃腸疾病',
    'skin-allergy': '過敏性皮膚炎',
    none: '皆無 No',
};

// --- Field label → Notion property name mapping ---
// Uses partial match against field labels (same pattern as extractCustomerInfo)

const FIELD_MAPPING = [
    { match: '怎麼稱呼你', prop: '怎麼稱呼你 Your name', type: 'title' },
    { match: 'IG 名稱', prop: 'IG名稱', type: 'rich_text' },
    { match: '狗狗名字', prop: '狗狗名字 Name of your lovely dog', type: 'rich_text' },
    { match: '品種 & 年齡', prop: '狗狗的品種 & 年齡 Dog breed & age', type: 'rich_text' },
    { match: '性別', prop: '狗狗性別 Gender of the dog', type: 'multi_select', map: GENDER_MAP },
    { match: '是否已結紮', prop: '是否已結紮 Spayed/Neutered?', type: 'multi_select', map: NEUTERED_MAP },
    { match: '來家裡報到的時間', prop: '狗狗來家裡報到的時間 & 來源 Date & source of adoption', type: 'rich_text' },
    { match: '主要照顧者', prop: '平時由誰主要照顧狗狗？Who is the dog\'s primary caregiver?', type: 'rich_text' },
    { match: '一天散步幾次', prop: '一天通常散步幾次？大約時間多久？How many walks per day and for how long?', type: 'rich_text' },
    { match: '散步地點', prop: '平常散步的地點有哪些？Where do you usually walk your dog?', type: 'rich_text' },
    { match: '家裡活動空間', prop: '平常家裡的活動空間大概有多大? Approximately how large is the living space at home?', type: 'rich_text' },
    { match: '最希望解決的問題', prop: '請列出目前最希望解決的問題（可以不只一個）Please list the issues you most want to resolve', type: 'rich_text' },
    { match: '嘗試過的方法', prop: '(承上題)曾經嘗試過哪些方法來解決這些問題？What methods have you tried to address these issues?', type: 'rich_text' },
    { match: '是否找過訓犬師', prop: '是否有找過訓犬師或上過訓練課？Have you ever worked with a dog trainer or taken training classes?', type: 'rich_text' },
    { match: '咬人 / 咬狗紀錄', prop: '狗狗是否有咬人或咬狗的紀錄?Has your dog ever bitten a person or another dog?', type: 'rich_text' },
    { match: '壓力最大的情境', prop: '哪些情境讓你感到壓力最大 & 原因？What situations cause you the most stress and why?', type: 'rich_text' },
    { match: '情境中的表現', prop: '(承上題)狗狗在這些情境中通常會有什麼表現？In these situations, how does your dog typically react?', type: 'rich_text' },
    { match: '期望改變 / 進步', prop: '你最希望狗狗能有什麼改變或進步？What changes or improvements do you most hope to see in your dog?', type: 'rich_text' },
    { match: '訓練上最大困難', prop: '你覺得自己在陪伴或訓練上面臨最大的困難是什麼？What do you find most challenging about caring for or training your dog?', type: 'rich_text' },
    { match: '身體狀況', prop: '狗狗目前有哪些身體狀況嗎? How is your dog\'s current physical health?', type: 'multi_select', map: HEALTH_MAP },
    { match: '其他想分享的', prop: '還有沒有其他想跟我分享的事呢？Is there anything else you\'d like to share with me?', type: 'rich_text' },
    { match: '聯絡 Email', prop: '聯絡Email', type: 'email' },
    { match: '聯絡手機', prop: '聯絡手機號碼 Mobile number ', type: 'rich_text' },
    { match: '地址', prop: '地址 Address', type: 'rich_text' },
];

/**
 * Build Notion properties object from form schema + responses.
 *
 * @param {Array} formSections - The form sections with their fields
 * @param {Object} formResponses - { [fieldId]: value } map of user answers
 * @returns {Object} Notion properties object
 */
export function buildNotionProperties(formSections, formResponses) {
    const properties = {};

    for (const section of formSections) {
        for (const field of section.fields || []) {
            const value = formResponses[String(field.id)];
            if (value === undefined || value === null || value === '') continue;

            // Find matching Notion property mapping (use _notion_label when locale=en, fallback to label)
            const notionLabel = field._notion_label || field.label;
            const mapping = FIELD_MAPPING.find((m) => notionLabel.includes(m.match));
            if (!mapping) continue;

            switch (mapping.type) {
                case 'title':
                    properties[mapping.prop] = {
                        title: [{ text: { content: String(value) } }],
                    };
                    break;

                case 'rich_text':
                    properties[mapping.prop] = {
                        rich_text: [{
                            text: {
                                content: String(Array.isArray(value) ? value.join(', ') : value),
                            },
                        }],
                    };
                    break;

                case 'email':
                    properties[mapping.prop] = {
                        email: String(value),
                    };
                    break;

                case 'multi_select': {
                    const valueMap = mapping.map || {};
                    let selectedValues;

                    if (Array.isArray(value)) {
                        // Checkbox field — array of selected values
                        selectedValues = value
                            .map((v) => valueMap[v])
                            .filter(Boolean);
                    } else {
                        // Radio field — single value
                        const mapped = valueMap[value];
                        selectedValues = mapped ? [mapped] : [];
                    }

                    if (selectedValues.length > 0) {
                        properties[mapping.prop] = {
                            multi_select: selectedValues.map((name) => ({ name })),
                        };
                    }
                    break;
                }
            }
        }
    }

    return properties;
}

/**
 * Push questionnaire data to Notion database.
 *
 * @param {Array} formSections - The form sections with field definitions
 * @param {Object} formResponses - { [fieldId]: value } user answers
 * @returns {Promise<{ pageId: string, url: string }>}
 */
export async function pushQuestionnaireToNotion(formSections, formResponses) {
    const apiKey = process.env.NOTION_API_KEY;
    const dbId = process.env.NOTION_QUESTIONNAIRE_DB_ID;

    if (!apiKey || !dbId) {
        throw new Error('Notion questionnaire credentials not configured');
    }

    const properties = buildNotionProperties(formSections, formResponses);

    // Ensure we have a title property (required by Notion)
    const titleProp = '怎麼稱呼你 Your name';
    if (!properties[titleProp]) {
        properties[titleProp] = {
            title: [{ text: { content: '（未填寫）' } }],
        };
    }

    const res = await fetch(`${NOTION_API}/pages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': NOTION_VERSION,
        },
        body: JSON.stringify({
            parent: { database_id: dbId },
            properties,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Notion Questionnaire API failed: ${err}`);
    }

    const page = await res.json();
    return { pageId: page.id, url: page.url };
}
