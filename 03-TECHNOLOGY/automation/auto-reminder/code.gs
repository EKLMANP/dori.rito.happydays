// ==========================================
// 📅 Dori & Rito 明日課程提醒機器人 (Messaging API 版)
// ==========================================

// 1. 設定區
// 請使用跟對帳機器人同一組 Token
const LINE_CHANNEL_ACCESS_TOKEN = 'd7SnYjJm2jlUODybR9S0Fnts5mERaKuJtCxTxWmz+UYmLslbAy48MU9yyxmhhOarC7NEOCeawDFpCACUwz+xCi2DWPVJ5hj1R06nWV5GeWp3HKd/64GNKLbfagcqSXuQChOU3haFSWgBxoas6amqdAdB04t89/1O/w1cDnyilFU=N'; 

// 請填入剛剛查到的 ID (群組 ID 以 C 開頭，個人 ID 以 U 開頭)
const TARGET_ID = 'Ca3a59fba06df122a56239d6007df2ecd'; 

// 日曆 ID
const CALENDAR_ID = 'primary'; 

/**
 * ⏰ 設定每日晚上 9 點自動觸發提醒
 * 請在編輯器上方工具列選取此函式並執行一次，即可完成設定。
 */
function setupDailyTrigger() {
  // 1. 先刪除所有與 sendTomorrowSchedule 相關的舊觸發器，避免重複
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'sendTomorrowSchedule') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // 2. 建立新的觸發器：每天晚上 9 點 (20:00 - 21:00 區間)
  ScriptApp.newTrigger('sendTomorrowSchedule')
    .timeBased()
    .everyDays(1)
    .atHour(21)
    .create(); // 建立觸發器

  console.log('✅ 已成功設定每日晚上 9 點的自動提醒！');
}

function sendTomorrowSchedule() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1); 
  
  // 設定明天的起始與結束時間 (用於 API 查詢)
  const startOfDay = new Date(tomorrow);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(tomorrow);
  endOfDay.setHours(23, 59, 59, 999);

  const dateStr = Utilities.formatDate(tomorrow, Session.getScriptTimeZone(), 'yyyy/MM/dd EEEE');
  
  // 準備訊息內容
  let message = `【${dateStr}】課程預告 🐶\n`;
  message += `------------------------------\n`;

  try {
    // ⚠️ 使用 Advanced Calendar Service (Calendar API)
    // 必須先在編輯器左側「服務 (Services)」新增 "Google Calendar API"
    const response = Calendar.Events.list(CALENDAR_ID, {
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.items;

    if (!events || events.length === 0) {
      message += `🎉 明天沒有安排課程，老師們休息一下吧！`;
    } else {
      events.forEach(event => {
        let timeStr = '';
        
        // 判斷是否為全天活動
        if (event.start.dateTime) {
          // 有具體時間
          const eventTime = new Date(event.start.dateTime);
          timeStr = Utilities.formatDate(eventTime, Session.getScriptTimeZone(), 'HH:mm');
        } else if (event.start.date) {
          // 全天活動
          timeStr = '全天';
        }

        let title = event.summary || '無標題';
        let location = event.location;
        let hangoutLink = event.hangoutLink; // Google Meet 連結
        
        message += `🕒 ${timeStr} - ${title}\n`;
        
        // 🔍 檢查 Google Meet 連結
        // 只要有 hangoutLink 就顯示，或者特定標題才顯示 (依需求調整，目前設為若有連結就顯示)
        if (hangoutLink && (title.includes('Dori & Rito 線上諮詢預約') || title.includes('線上諮詢'))) {
          message += `📹 線上諮詢連結: ${hangoutLink}\n`;
        }
        else if (location) {
           message += `📍 ${location}\n`;
        }

        message += `\n`; 
      });
      
      message += `------------------------------\n`;
      message += `別忘了發送上課提醒給家長喔！💪`;
    }
    
    // 發送推播訊息 (Push Message)
    pushLineMessage(message);

  } catch (e) {
    console.error('❌ 發生錯誤 (可能是未開啟 Calendar API 服務): ' + e.toString());
    // 發送錯誤通知給自己 (選用)
  }
}

function pushLineMessage(text) {
  const url = 'https://api.line.me/v2/bot/message/push';
  
  const payload = {
    'to': TARGET_ID,
    'messages': [{
      'type': 'text',
      'text': text
    }]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    console.log("推播結果: " + response.getResponseCode());
  } catch (e) {
    console.error("推播失敗: " + e.toString());
  }
}
