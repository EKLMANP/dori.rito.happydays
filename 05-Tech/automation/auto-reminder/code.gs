// ==========================================
// 📅 Dori & Rito 明日課程提醒機器人 (Messaging API 版)
// ==========================================

// 1. 設定區
const LINE_CHANNEL_ACCESS_TOKEN = 'd7SnYjJm2jlUODybR9S0Fnts5mERaKuJtCxTxWmz+UYmLslbAy48MU9yyxmhhOarC7NEOCeawDFpCACUwz+xCi2DWPVJ5hj1R06nWV5GeWp3HKd/64GNKLbfagcqSXuQChOU3haFSWgBxoas6amqdAdB04t89/1O/w1cDnyilFU=N';

// 群組 ID (C 開頭) 或個人 ID (U 開頭)
const TARGET_ID = 'Ca3a59fba06df122a56239d6007df2ecd';

// Dori&Rito 主行事曆
const CALENDAR_ID = 'primary';

// 犬研室行事曆 Web App URL (eric@doggy-lab.com)
const DOGGY_LAB_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyNGJGQ_GjkrB4kI5FHBG3eKRHlUIGdl6cX6K4LSz0cffAAqmHDOM_NBTZ70iStlXn4/exec';

// ==========================================

/**
 * ⏰ 設定每日晚上 9 點自動觸發提醒
 * 在編輯器選取此函式執行一次即可完成設定。
 */
function setupDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'sendTomorrowSchedule') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  ScriptApp.newTrigger('sendTomorrowSchedule')
    .timeBased()
    .everyDays(1)
    .atHour(21)
    .create();
  console.log('✅ 已成功設定每日晚上 9 點的自動提醒！');
}

/**
 * 從 Dori&Rito 主行事曆取得指定日期的活動
 */
function fetchDoriRitoEvents(startOfDay, endOfDay) {
  try {
    const response = Calendar.Events.list(CALENDAR_ID, {
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    return (response.items || []).map(event => {
      let startTime = new Date(startOfDay);
      let timeStr = '全天';

      if (event.start.dateTime) {
        startTime = new Date(event.start.dateTime);
        timeStr = Utilities.formatDate(startTime, Session.getScriptTimeZone(), 'HH:mm');
      }

      const rawTitle = event.summary || '無標題';
      const title = rawTitle.startsWith('【') ? rawTitle : `【Dori&Rito】${rawTitle}`;

      return {
        startTime,
        timeStr,
        title,
        location: event.location || null,
        hangoutLink: event.hangoutLink || null
      };
    });
  } catch (e) {
    console.warn('⚠️ 無法讀取 Dori&Rito 行事曆: ' + e.toString());
    return [];
  }
}

/**
 * 從犬研室 Web App 取得指定天數後的活動
 * @param {number} daysAhead - 幾天後（1 = 明天，3 = 三天後）
 * @param {Date} baseDate - 基準日期（通常是今天）
 */
function fetchDoggyLabEvents(daysAhead, baseDate) {
  try {
    const url = `${DOGGY_LAB_WEBAPP_URL}?daysAhead=${daysAhead}`;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

    if (res.getResponseCode() !== 200) {
      console.warn('⚠️ 犬研室 Web App 回應異常: ' + res.getResponseCode());
      return [];
    }

    const parsed = JSON.parse(res.getContentText());
    if (!Array.isArray(parsed)) {
      console.warn('⚠️ 犬研室 Web App 回傳錯誤: ' + JSON.stringify(parsed));
      return [];
    }
    const items = parsed;
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + daysAhead);

    return items.map(ev => {
      const startTime = new Date(targetDate);
      if (ev.timeStr && ev.timeStr !== '全天') {
        const [h, m] = ev.timeStr.split(':');
        startTime.setHours(parseInt(h), parseInt(m), 0, 0);
      } else {
        startTime.setHours(0, 0, 0, 0);
      }

      const rawTitle = ev.title || '無標題';
      const title = rawTitle.startsWith('【') ? rawTitle : `【犬研室】${rawTitle}`;

      return {
        startTime,
        timeStr: ev.timeStr || '全天',
        title,
        location: ev.location || null,
        hangoutLink: ev.hangoutLink || null
      };
    });
  } catch (e) {
    console.warn('⚠️ 無法讀取犬研室 Web App: ' + e.toString());
    return [];
  }
}

/**
 * 從活動標題提取學生名字（取【標籤】後、底線前的第一段）
 * 例如：「【犬研室】Bonnie_1對1課程_W2/6」→「Bonnie」
 */
function extractStudentName(title) {
  const stripped = title.replace(/^【[^】]*】/, '').trim();
  return stripped.split('_')[0] || stripped;
}

// ==========================================

function sendTomorrowSchedule() {
  const today = new Date();

  // 明天的時間範圍
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const startOfTomorrow = new Date(tomorrow); startOfTomorrow.setHours(0, 0, 0, 0);
  const endOfTomorrow   = new Date(tomorrow); endOfTomorrow.setHours(23, 59, 59, 999);

  // 三天後的時間範圍
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);
  const startOf3Days = new Date(threeDaysLater); startOf3Days.setHours(0, 0, 0, 0);
  const endOf3Days   = new Date(threeDaysLater); endOf3Days.setHours(23, 59, 59, 999);

  const dateStr = Utilities.formatDate(tomorrow, Session.getScriptTimeZone(), 'yyyy/MM/dd EEEE');

  // ── 讀取明日活動（兩個來源）
  const drEvents = fetchDoriRitoEvents(startOfTomorrow, endOfTomorrow);
  const dlEvents = fetchDoggyLabEvents(1, today);
  const allEvents = [...drEvents, ...dlEvents].sort((a, b) => a.startTime - b.startTime);

  // ── 讀取三天後活動（備課提醒用）
  const dr3 = fetchDoriRitoEvents(startOf3Days, endOf3Days);
  const dl3 = fetchDoggyLabEvents(3, today);
  const events3Days = [...dr3, ...dl3].sort((a, b) => a.startTime - b.startTime);

  // ── 組合訊息
  let message = `【${dateStr}】課程預告 🐶\n`;
  message += `------------------------------\n`;

  if (allEvents.length === 0) {
    message += `🎉 明天沒有安排課程，老師們休息一下吧！\n`;
  } else {
    allEvents.forEach(ev => {
      message += `🕒 ${ev.timeStr} - ${ev.title}\n`;
      if (ev.hangoutLink && ev.title.includes('線上諮詢')) {
        message += `📹 線上諮詢連結: ${ev.hangoutLink}\n`;
      } else if (ev.location) {
        message += `📍 ${ev.location}\n`;
      }
      message += `\n`;
    });

    message += `------------------------------\n`;
    message += `別忘了發送上課提醒給家長喔！💪\n`;
  }

  // ── 三天後備課提醒
  if (events3Days.length > 0) {
    const studentNames = events3Days.map(ev => extractStudentName(ev.title)).join('、');
    const threeDaysDateStr = Utilities.formatDate(threeDaysLater, Session.getScriptTimeZone(), 'M/d');
    message += `📋 ${threeDaysDateStr} 這些學生要上課：${studentNames}，請記得今天發送當天上課的架構和準備事項給學生哦！`;
  }

  pushLineMessage(message);
}

// ==========================================

function pushLineMessage(text) {
  const url = 'https://api.line.me/v2/bot/message/push';

  const payload = {
    'to': TARGET_ID,
    'messages': [{ 'type': 'text', 'text': text }]
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
    console.log('推播結果: ' + response.getResponseCode());
  } catch (e) {
    console.error('推播失敗: ' + e.toString());
  }
}
