export const DEFAULT_CATEGORIES = [
    { id: 'rest', name: '休息', color: '#4A6FA5' },
    { id: 'feed', name: '餵食', color: '#F75000' },
    { id: 'play', name: '放風練習', color: '#7BA77F' },
    { id: 'free', name: '自由時段', color: '#9CA3AF' },
];

export const DEFAULT_ROWS = [
    { id: 'r1', time: '6-7時', categoryId: 'free', title: '自然醒 → 自己去尿尿', description: '運輸籠門開著，廁所門開著，尿尿不用管他' },
    { id: 'r2', time: '9:00', categoryId: 'feed', title: '上廁所 + 第一餐 + 放風 10 分鐘', description: 'YES/叫名字/看我練習，每個 5 顆飼料' },
    { id: 'r3', time: '→13時', categoryId: 'rest', title: '回運輸籠休息（給 Kong，從正餐份量分出）', description: '關門蓋布。Kong 吃完自然睡著' },
    { id: 'r4', time: '13:00', categoryId: 'feed', title: '上廁所 + 第二餐 + 放風 10 分鐘', description: '嗅聞墊餵食（從正餐份量分出）或 訓練練習' },
    { id: 'r5', time: '→下午', categoryId: 'rest', title: '回運輸籠休息', description: '' },
    { id: 'r6', time: '下午', categoryId: 'play', title: '放風 10 分鐘（有空的時候）', description: '自由玩、嗅聞遊戲、社會化練習' },
    { id: 'r7', time: '→17時', categoryId: 'rest', title: '回運輸籠休息', description: '' },
    { id: 'r8', time: '17:00', categoryId: 'feed', title: '上廁所 + 第三餐 + 放風 10 分鐘', description: '訓練練習 或 自由玩' },
    { id: 'r9', time: '→晚上', categoryId: 'rest', title: '回運輸籠休息', description: '' },
    { id: 'r10', time: '晚上', categoryId: 'play', title: '放風 10-15 分鐘（有空的時候）', description: '自由玩、互動遊戲' },
    { id: 'r11', time: '→23時', categoryId: 'rest', title: '回運輸籠休息', description: '' },
    { id: 'r12', time: '23:00', categoryId: 'feed', title: '上廁所 + 第四餐 → 睡覺', description: '用 Kong 或嗅聞墊餵（從正餐份量分出）。吃完進運輸籠，關門蓋布' },
    { id: 'r13', time: '→隔天', categoryId: 'rest', title: '睡覺（運輸籠關門蓋布）', description: '一路睡到隔天自然醒，循環重新開始' },
];

export const DEFAULT_FOOTER = {
    doorRule: '睡覺時段 → 運輸籠門關上、蓋布\n醒著等待時段（例如清晨自然醒）→ 運輸籠門打開、廁所門打開，讓樂樂自己去上廁所',
    feedingInterval: '每 4 小時一餐（9/13/17/23），過夜空檔約 10 小時',
    principle: '吃 → 玩 → 鬧 → 睡，建立規律循環',
    releaseSignal: '放回運輸籠前先給 Kong 或嗅聞墊（從正餐份量分出），讓轉換不突然',
    ignoreNote: '完全不理。等他安靜才進行下一步',
};

export const DEFAULT_META = {
    dogName: '樂樂',
    breed: '長毛臘腸',
    ageMonths: '3個月',
    sleepGoal: '每日睡眠目標 18-20 小時',
};
