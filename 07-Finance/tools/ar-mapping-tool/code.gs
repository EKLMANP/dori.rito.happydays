// ==========================================
// 🐶 Dori & Rito 全自動化對帳與學籍系統 (V6.0 升級版)
// ==========================================

const CONFIG = {
  // 請填入您的 LINE Channel Access Token
  LINE_TOKEN: 'd7SnYjJm2jlUODybR9S0Fnts5mERaKuJtCxTxWmz+UYmLslbAy48MU9yyxmhhOarC7NEOCeawDFpCACUwz+xCi2DWPVJ5hj1R06nWV5GeWp3HKd/64GNKLbfagcqSXuQChOU3haFSWgBxoas6amqdAdB04t89/1O/w1cDnyilFU=N',
  // 請填入您的 Notion Integration Token
  NOTION_TOKEN: '***REMOVED_NOTION_TOKEN***',
  
  DB_ID_MQL: '24417e11503d8094b667e13ea012dd0d', // 狗狗行為諮詢前問卷
  DB_ID_CRM: '22a17e11503d80eea2b5ccbe69a16c59', // 1-1 Customer database 客戶管理
  
  PROPS: {
    // CRM (Destination) Properties
    CRM_NAME: '客戶姓名',
    CRM_PHONE: '聯絡手機號碼 Mobile number ', 
    CRM_DOG: '狗狗名字 Name of your lovely dog',
    CRM_DATE: '匯款日期',
    CRM_LAST5: '帳號後五碼',
    CRM_STATUS: '付款狀態',
    CRM_STATUS_PAID: '已付款',
    CRM_CONVERSION: '轉換狀態', // 確認 Notion 對應欄位名稱
    CRM_CONVERSION_VALUE: 'In progress(1-6/8)',
    CRM_ADDRESS: '地址', // New
    CRM_EMAIL: '聯絡Email', // New

    // MQL (Source) Properties
    MQL_NAME: '怎麼稱呼你 Your name',
    MQL_PHONE: '聯絡手機號碼 Mobile number ',
    MQL_DOG: '狗狗名字 Name of your lovely dog',
    MQL_EMAIL: '聯絡Email',
    MQL_ADDRESS: '地址' 
  }
};

function doPost(e) {
  try {
    const json = JSON.parse(e.postData.contents);
    const events = json.events;
    if (!events) return ContentService.createTextOutput("ok");
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        handleMessage(event);
      }
    }
  } catch (err) { console.error(err); }
  return ContentService.createTextOutput("ok");
}

function handleMessage(event) {
  const userMessage = event.message.text.trim();
  const replyToken = event.replyToken;

  // 1. 智慧解析
  const parsedData = smartParseV6(userMessage);

  if (parsedData.isComplete) {
    try {
      const result = processWorkflow(parsedData);
      replyLine(replyToken, result);
    } catch (e) {
      replyLine(replyToken, `⚠️ 系統發生錯誤：\n${e.message}`);
    }
  } else if (userMessage.includes("姓名") || userMessage.includes("匯款")) {
    // replyLine(replyToken, `🐶 汪！資料好像不完整喔。\n請提供：姓名、匯款日期、帳號後五碼。`);
  }
}

function processWorkflow(data) {
  const { name, date, last5, dogName: inputDogName, phone: inputPhone } = data;
  
  // 1. 在 MQL 中搜尋 (姓名 OR 狗狗名字)
  const mqlRecord = searchMQLByNameOrDog(name);
  
  // 如果用 Name 沒找到，且有 Input Dog Name，嘗試用 Dog Name 搜尋
  let finalMqlRecord = mqlRecord;
  if (!finalMqlRecord && inputDogName) {
      finalMqlRecord = searchMQLByNameOrDog(inputDogName);
  }

  let welcomeMsg = "";

  if (finalMqlRecord) {
    // 找到資料 -> 建立完整 CRM 資料
    // 優先使用 MQL 裡的資料，如果 MQL 缺少則使用 Input 資料
    const customerName = getProp(finalMqlRecord, CONFIG.PROPS.MQL_NAME) || name;
    const dogName = getProp(finalMqlRecord, CONFIG.PROPS.MQL_DOG) || inputDogName;
    const phone = getProp(finalMqlRecord, CONFIG.PROPS.MQL_PHONE) || inputPhone;
    const email = getProp(finalMqlRecord, CONFIG.PROPS.MQL_EMAIL);
    
    // 嘗試多種可能的地址欄位名稱
    let address = getProp(finalMqlRecord, CONFIG.PROPS.MQL_ADDRESS);
    if (!address) address = getProp(finalMqlRecord, "地址 Address");
    if (!address) address = getProp(finalMqlRecord, "Address");
    if (!address) address = getProp(finalMqlRecord, "居住地");

    createCRM({
      name: customerName,
      dogName: dogName,
      phone: phone,
      email: email,
      address: address,
      date: date,
      last5: last5
    });
    
    welcomeMsg = `Hi ${customerName} (${dogName})，我們收到款項囉！\n已從問卷找到您的資料並建立學籍 🐶\n老師近期會發送上課的行事曆給你，有任何問題歡迎隨時與我們聯繫 😇`;

  } else {
    // 沒找到資料 -> 建立基本 CRM 資料
    createCRM({
      name: name,
      dogName: inputDogName || "尚未填寫",
      phone: inputPhone || "尚未填寫", 
      email: "尚未填寫",
      address: "尚未填寫",
      date: date,
      last5: last5
    });

    welcomeMsg = `Hi ${name}，我們收到款項囉！\n但我們在問卷中找不到「${name}」的資料，已先幫您建立基本檔案。\n請記得補齊資料喔 🐶`;
  }

  return welcomeMsg;
}

// ==========================================
// 🛠️ 精準解析引擎 V6
// ==========================================
// ==========================================
// 🛠️ 精準解析引擎 V6 (含模糊比對)
// ==========================================
function smartParseV6(text) {
  // 1. 嘗試標籤解析 (Labeled Parsing)
  const labeled = parseLabeled(text);
  if (labeled.isComplete) return labeled;

  // 2. 嘗試模糊解析 (Fuzzy Parsing)
  return parseFuzzy(text);
}

function parseLabeled(text) {
  const nameMatch = text.match(/客戶姓名[：:]\s*(.+)/) || text.match(/姓名[：:]\s*(.+)/);
  const last5Match = text.match(/帳號後五碼[：:]\s*(\d{5})/);
  
  let dateStr = null;
  const dateRowMatch = text.match(/匯款日期[：:]\s*([\d\/\-]+)/);
  if (dateRowMatch) {
    dateStr = formatDateFix(dateRowMatch[1]);
  }

  return {
    isComplete: (!!nameMatch && !!dateStr && !!last5Match),
    name: nameMatch ? nameMatch[1].trim() : null,
    dogName: null,
    phone: null,
    last5: last5Match ? last5Match[1] : null,
    date: dateStr
  };
}

function parseFuzzy(text) {
  let content = text;
  
  // A. 提取手機 (09xxxxxxxx)
  const phoneMatch = content.match(/09\d{8}/);
  let phone = phoneMatch ? phoneMatch[0] : null;
  
  // B. 提取日期 (支援 2026/2/12, 2026-02-12, 20260212, 2/12 等)
  let dateStr = null;
  let dateMatch = null;

  // 1. 標準分隔符格式 YYYY/MM/DD
  dateMatch = content.match(/(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
  if (dateMatch) {
    dateStr = formatDateFix(dateMatch[0]);
  }

  // 2. 緊湊格式 YYYYMMDD (8碼，以20開頭)
  if (!dateMatch) {
    const compactMatch = content.match(/(20\d{6})/);
    if (compactMatch) {
       dateMatch = compactMatch;
       let raw = compactMatch[0];
       // 轉成 YYYY-MM-DD
       dateStr = `${raw.substring(0,4)}-${raw.substring(4,6)}-${raw.substring(6,8)}`;
    }
  }

  // 3. 短日期格式 MM/DD
  if (!dateMatch) {
     // 排除可能是分數或電話的部分
     dateMatch = content.match(/(\d{1,2}[\/\-]\d{1,2})/); 
     if (dateMatch) {
        dateStr = formatDateFix(dateMatch[0]);
     }
  }

  // C. 提取後五碼 (5位數字)
  // 先把已找到的電話和日期移除，避免誤判
  let tempContent = content;
  if (phone) tempContent = tempContent.replace(phone, "");
  if (dateMatch) tempContent = tempContent.replace(dateMatch[0], "");
  
  const last5Match = tempContent.match(/\d{5}/);
  let last5 = last5Match ? last5Match[0] : null;
  if (last5) tempContent = tempContent.replace(last5, ""); // 移除後五碼

  // D. 提取姓名與狗狗名字 (剩餘字串)
  // 濾掉空行、標點、以及常見標籤關鍵字
  const parts = tempContent.split(/[\n\/,，\s]+/).filter(p => {
    p = p.trim();
    return p.length > 0 && !["姓名", "狗狗", "匯款", "日期", "帳號", "後五碼", "手機", "號碼"].some(Hx => p.includes(Hx));
  });

  let name = parts.length > 0 ? parts[0] : null;
  let dogName = parts.length > 1 ? parts[1] : null;

  // 只要有 (Date + Last5) 加上 (Name 或 Phone 其中之一)，就算有效資訊
  // 這樣即使只有「姓名、日期、後五碼」也能通過
  const hasIdentity = !!name || !!phone;
  const hasPayment = !!dateStr && !!last5;
  
  return {
    isComplete: (hasIdentity && hasPayment),
    name: name,
    dogName: dogName,
    phone: phone,
    last5: last5,
    date: dateStr
  };
}

function formatDateFix(raw) {
  let clean = raw.replace(/\//g, '-');
  let parts = clean.split('-');
  
  if (parts.length === 3) {
    let y = parts[0];
    let m = parts[1].padStart(2, '0');
    let d = parts[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
}

// ==========================================
// 🛠️ Notion 工具
// ==========================================

// 搜尋 MQL: 嘗試匹配 客戶姓名 OR 狗狗名字
function searchMQLByNameOrDog(queryName) {
  const url = `https://api.notion.com/v1/databases/${CONFIG.DB_ID_MQL}/query`;
  
  // Construct OR filter
  // 注意：Notion API filter for Title property uses 'title' key, for RichText uses 'rich_text'.
  // 假設 Name 是 Title，Dog Name 是 RichText
  const payload = {
    filter: {
      or: [
         { property: CONFIG.PROPS.MQL_NAME, title: { equals: queryName } }, 
         { property: CONFIG.PROPS.MQL_DOG, rich_text: { equals: queryName } }
      ]
    }
  };

  const res = callNotion('POST', url, payload);
  return res.results.length > 0 ? res.results[0] : null;
}

function createCRM(data) {
  const url = 'https://api.notion.com/v1/pages';
  const props = {};
  
  // Title: Name
  props[CONFIG.PROPS.CRM_NAME] = { title: [{ text: { content: data.name } }] };
  
  // Rich Text Fields
  props[CONFIG.PROPS.CRM_DOG] = { rich_text: [{ text: { content: data.dogName || "" } }] };
  props[CONFIG.PROPS.CRM_PHONE] = { rich_text: [{ text: { content: data.phone || "" } }] };
  props[CONFIG.PROPS.CRM_LAST5] = { rich_text: [{ text: { content: data.last5 || "" } }] };
  props[CONFIG.PROPS.CRM_ADDRESS] = { rich_text: [{ text: { content: data.address || "" } }] };

  // Date
  props[CONFIG.PROPS.CRM_DATE] = { date: { start: data.date } };
  
  // Email
  if (data.email && data.email.includes('@')) {
    props[CONFIG.PROPS.CRM_EMAIL] = { email: data.email };
  }
  
  // Status (Select/Status property)
  props[CONFIG.PROPS.CRM_STATUS] = { status: { name: CONFIG.PROPS.CRM_STATUS_PAID } };
  props[CONFIG.PROPS.CRM_CONVERSION] = { status: { name: CONFIG.PROPS.CRM_CONVERSION_VALUE } }; // 假設轉換狀態是 Status 屬性

  callNotion('POST', url, { parent: { database_id: CONFIG.DB_ID_CRM }, properties: props });
}

function callNotion(method, url, payload) {
  const options = {
    method: method,
    headers: {
      'Authorization': `Bearer ${CONFIG.NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  if (payload) options.payload = JSON.stringify(payload);
  const response = UrlFetchApp.fetch(url, options);
  const resJson = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() !== 200) {
    // 簡單的錯誤處理，如果 Status/Select 選項不存在可能會報錯
    throw new Error(`Notion API Error: ${resJson.message}`);
  }
  return resJson;
}

function getProp(page, name) {
  if (!page || !page.properties) return "";
  const prop = page.properties[name];
  if (!prop) return ""; // Property with this name doesn't exist

  if (prop.type === 'title') {
    return prop.title.map(t => t.plain_text).join("");
  }
  if (prop.type === 'rich_text') {
    return prop.rich_text.map(t => t.plain_text).join("");
  }
  if (prop.type === 'email') return prop.email || "";
  if (prop.type === 'phone_number') return prop.phone_number || "";
  if (prop.type === 'select') return prop.select?.name || "";
  if (prop.type === 'date') return prop.date?.start || "";
  
  if (prop.type === 'url') return prop.url || "";
  
  // Support for Formula
  if (prop.type === 'formula') {
    if (prop.formula.type === 'string') return prop.formula.string || "";
    if (prop.formula.type === 'number') return String(prop.formula.number);
    if (prop.formula.type === 'date') return prop.formula.date?.start || "";
  }
  
  // Support for Rollup
  if (prop.type === 'rollup') {
    if (prop.rollup.type === 'array') {
        return prop.rollup.array.map(item => {
            if (item.type === 'title') return item.title.map(t=>t.plain_text).join("");
            if (item.type === 'rich_text') return item.rich_text.map(t=>t.plain_text).join("");
            if (item.type === 'select') return item.select?.name || "";
            return "";
        }).join(", ");
    }
  }

  return "";
}

function replyLine(token, text) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CONFIG.LINE_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': token,
      'messages': [{ 'type': 'text', 'text': text }],
    }),
  });
}
