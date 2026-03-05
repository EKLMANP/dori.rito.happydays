// 品牌常數 — 所有頁面共用的固定資料
export const BRAND = {
    name: 'Dori & Rito 專業訓犬服務',
    nameShort: 'Dori & Rito',
    tagline: '用正向訓練，打造你與毛孩的理想生活',
    description:
        '台灣專業 KPA、CATCH 認證正向訓犬師。協助改善吠叫、分離焦慮、暴衝等行為問題，一對一到府與線上服務。',
    email: 'dori.rito.happydays@gmail.com',
    instagram: 'https://www.instagram.com/dori.rito.happydays/',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com',
};

export const TALLY = {
    consultUrl: process.env.NEXT_PUBLIC_TALLY_CONSULT_URL || 'https://tally.so/r/KY55Bg',
    partnerUrl: process.env.NEXT_PUBLIC_TALLY_PARTNER_URL || 'https://tally.so/r/442Jpd',
};

export const NAV_LINKS = [
    { label: '關於我們', href: '/#about-section' },
    { label: '正向訓犬服務', href: '/services' },
    { label: '狗狗行為文章', href: '/blog' },
    { label: '合作洽詢', href: '/contact' },
];

export const BLOG_TAGS = [
    { label: '全部', value: '' },
    { label: '幼犬訓練', value: 'puppy-training' },
    { label: '分離焦慮', value: 'separation-anxiety' },
    { label: '反應性犬', value: 'reactive-dog' },
    { label: '基礎服從', value: 'basic-obedience' },
    { label: '行為問題', value: 'behavior-issues' },
];

export const NEWSLETTER_COPY = {
    headline: '每週獲得免費調整毛孩行為的具體方法',
    subhead: '訂閱電子報，一起打造你與毛孩的理想生活 🐶',
    placeholder: '輸入你的 Email',
    button: '免費訂閱',
    successMessage: '確認信已寄出！請到信箱點擊確認連結完成訂閱 📬（沒看到的話，請檢查「促銷內容」或垃圾郵件資料夾）',
    errorMessage: '訂閱失敗，請稍後再試或直接寄信給我們。',
};

export const FAQS = [
    {
        question: '你們的訓犬方法是什麼？',
        answer:
            '我們採用 KPA（Karen Pryor Academy）及 CATCH 認證的純正向強化訓練法（Positive Reinforcement），不使用任何懲罰、電擊或有害工具。透過讓狗狗在正向環境中學習，建立真正穩定的行為改變。',
    },
    {
        question: '訓犬課程適合幾歲的狗狗？',
        answer:
            '所有年齡的狗狗都可以學習！幼犬（8 週齡以上）特別適合建立良好基礎，成犬也完全可以改變既有行為。越早開始效果越好，但任何年齡都不嫌晚。',
    },
    {
        question: '一對一到府服務的服務範圍？',
        answer:
            '目前主要服務北北基地區（台北市、新北市、基隆市）。如果在其他縣市，歡迎詢問線上一對一服務，效果一樣喔！',
    },
    {
        question: '課程費用大約是多少？',
        answer:
            '我們提供 6 週和 8 週的客製化課程方案。費用依照狗狗問題的複雜程度和服務方式而有所不同。建議先填寫免費諮詢問卷，讓我們了解你的狀況後，再提供最適合的方案。',
    },
    {
        question: '看到效果需要多久？',
        answer:
            '每隻狗和每個問題都不同，但多數客戶在第 2-3 堂課後就能看到明顯改善。我們的課程結合每週作業和課後支援，確保學習效果能持續鞏固。',
    },
];

export const TESTIMONIALS = [
    {
        name: 'Emma 和 柴犬 豆豆',
        text: '上課前豆豆每次出門都暴衝到我追不上，3 週後他能在我旁邊走路了！訓犬師非常有耐心，不僅教狗也教我們如何理解狗狗的需求。',
        rating: 5,
        avatar: null,
    },
    {
        name: 'David 和 黃金 Mochi',
        text: 'Mochi 有嚴重的分離焦慮，一個人在家就狂吠。線上諮詢後有了具體的練習步驟，兩個月後他終於能獨處了，鄰居也誇讚！',
        rating: 5,
        avatar: null,
    },
    {
        name: 'Cathy 和 米克斯 糯米',
        text: '報名前對正向訓練半信半疑，以為沒有懲罰狗不會學。結果糯米學得比我預期快很多，而且我們的關係也變得更好了。強烈推薦！',
        rating: 5,
        avatar: null,
    },
];
