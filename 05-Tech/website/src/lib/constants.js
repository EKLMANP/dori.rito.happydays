// 品牌常數 — locale-agnostic 部分
export const BRAND = {
    name: 'Dori & Rito 專業訓犬服務',
    nameShort: 'Dori & Rito',
    nameEn: 'Dori & Rito Professional Dog Training',
    tagline: '用正向訓練，打造你與毛孩的理想生活',
    taglineEn: 'Positive training that finally clicks — for you and your dog.',
    description:
        '台灣專業 KPA、CATCH 認證正向訓犬師。協助改善吠叫、分離焦慮、暴衝等行為問題，一對一到府與線上服務。',
    descriptionEn:
        'KPA & CATCH-certified positive dog trainers helping owners worldwide solve barking, separation anxiety, leash reactivity and more — online, 1-on-1.',
    email: 'dori.rito.happydays@gmail.com',
    instagram: 'https://www.instagram.com/dori.rito.happydays/',
    lineUrl: 'https://lin.ee/j1DjGlk',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://doriritohappydays.com',
};

export const TALLY = {
    consultUrl: process.env.NEXT_PUBLIC_TALLY_CONSULT_URL || 'https://tally.so/r/KY55Bg',
};

// Blog tag slugs are locale-agnostic; display labels live in messages/blog.json
export const BLOG_TAGS = [
    { value: '' },
    { value: 'puppy-training' },
    { value: 'separation-anxiety' },
    { value: 'reactive-dog' },
    { value: 'basic-obedience' },
    { value: 'behavior-issues' },
];

const FAQS_ZH = [
    {
        question: '線上課程真的可以幫助我的狗狗嗎？',
        answer:
            '對容易緊張或敏感的狗狗來說，在熟悉的家裡學習，本來就是最理想的環境。沒有任何訓練師，能靠幾堂課「修好」一隻狗。真正的改變，發生在每天的生活裡——當你一次次讓牠知道哪些行為會帶來好事，哪些選擇是安全、被理解的。你，才是牠最重要的訓練師。沒有人比你更了解牠的情緒、反應和喜好。這份了解，就是最關鍵的優勢。而線上課，讓你可以照著你們自己的節奏前進——忙的時候慢一點，狀態好的時候多練一點。不需要配合時間、不需要帶去陌生環境，改變，就從你們每天生活的地方開始。',
    },
    {
        question: '成犬可以嗎？沒有社會化經驗的狗也適合嗎？',
        answer:
            '完全可以。行為的改變，沒有年齡限制。重點從來不是「幾歲」，而是「方法對不對」。成犬反而有一個優勢：牠的個性與反應模式已經穩定，我們能更精準地設計適合牠的方式。至於沒有社會化經驗的狗——我們不會硬推牠面對世界。我們會從牠的舒適圈出發，慢慢建立安全感與信心，讓牠「準備好」之後，再往外走。這正是我們最擅長的。',
    },
    {
        question: '我需要額外購買什麼工具嗎？',
        answer:
            '基本上不需要。我們使用的，都是你生活中本來就有的東西。如果真的需要特定輔具，我們會清楚告訴你：為什麼需要、怎麼選擇、怎麼正確使用。不會讓你花冤枉錢，也不會讓你自己摸索。',
    },
    {
        question: '家人可以一起參加嗎？',
        answer:
            '不只可以，我們非常建議。訓練最常卡住的原因之一是——家裡每個人用不同方式對待狗狗。對狗狗來說，這會變成一個很混亂的世界。有人允許的事，另一個人卻禁止；有人鼓勵的行為，另一個人卻處罰。結果就是：學很慢，甚至學不會。一起學，才能建立一致的溝通方式，也才能讓狗狗真正安心、穩定地進步。',
    },
    {
        question: '我家狗狗很容易緊張、激動，這樣也有辦法幫助嗎？',
        answer:
            '這正是我們最常協助的狀況。很多人會以為這是「壞習慣」，但其實多半是情緒調節能力還不夠成熟。我們不會要求牠「忍耐」或「壓抑」。我們會先幫牠做到三件事：降低壓力、建立安全感、增加可預測性。當情緒穩定下來，學習自然就會發生。',
    },
    {
        question: '我的狗狗曾經有攻擊或咬人的行為，可以參加嗎？',
        answer:
            '這種情況，我們會建議優先安排實體一對一諮詢。不是因為沒辦法幫助，而是這類問題需要更高的安全性與更精準的判斷。只有在現場觀察，我們才能：看見細微的行為訊號、評估觸發原因、設計安全且有效的調整策略。線上課程的形式無法提供這樣的深度。如果你有這樣的需求，歡迎直接聯絡我們，我們會幫你找到最合適、也最安全的方式。',
    },
    {
        question: '上完課之後，每天需要花多少時間練習？',
        answer:
            '每天大約 10–15 分鐘就足夠。但更重要的是——我們不是要你「額外撥時間訓練」，而是教你把訓練放進生活裡。像是：散步、餵飯、叫牠過來、出門前的等待，這些每天都在發生的時刻，其實都是最好的練習機會。很多飼主後來發現，真正帶來改變的不是訓練時間變多，而是他們開始用不同的方式看懂狗狗的行為。',
    },
];

const FAQS_EN = [
    {
        question: 'Can online lessons really help my dog?',
        answer:
            'For sensitive or anxious dogs, your living room is honestly the best classroom there is. No trainer can "fix" a dog in a handful of sessions — real change happens in the small moments of daily life, when you reinforce the right choices over and over. You are your dog\'s most important trainer. Nobody understands their moods, triggers, and quirks better than you do. That intimate knowledge is your biggest advantage, and online coaching is built around it. We work at your pace, in your home, with no commute and no scary new environment for your dog.',
    },
    {
        question: 'What about adult dogs or dogs with no socialisation history?',
        answer:
            'Absolutely welcome. Behaviour change has no age limit — the question is never "how old?" but "is the method right for this dog?" Adult dogs actually have an advantage: their personality and patterns are stable, so we can tailor the plan precisely. For under-socialised dogs, we never force them to confront the world. We start inside their comfort zone, build safety and confidence first, and only widen the circle when they\'re truly ready. This is exactly what we specialise in.',
    },
    {
        question: 'Do I need to buy any special equipment?',
        answer:
            'Almost never. We work with whatever you already have at home. If a specific aid genuinely helps, we\'ll explain exactly why, how to choose it, and how to use it correctly — so you don\'t waste money or guess on your own.',
    },
    {
        question: 'Can other family members join the lessons?',
        answer:
            'Not only can they — we strongly recommend it. One of the biggest reasons training stalls is that different people in the household handle the dog differently. From the dog\'s perspective, the world becomes confusing: one person allows it, another forbids it; one rewards a behaviour, another punishes it. Progress slows or stops. When everyone learns together, the dog finally gets a consistent message — and that\'s when real, lasting change happens.',
    },
    {
        question: 'My dog gets anxious or over-aroused easily — can you still help?',
        answer:
            'This is exactly what we work with most. People often label it as a "bad habit," but it\'s usually an under-developed emotional regulation system. We won\'t ask your dog to "tolerate" or "suppress." We focus on three things first: reduce stress, build safety, increase predictability. Once the nervous system settles, learning takes care of itself.',
    },
    {
        question: 'My dog has bitten or shown aggression. Can we still join?',
        answer:
            'For these cases we recommend an in-person consultation first — not because we can\'t help, but because aggression cases require a higher level of safety and precision. We need to read subtle body-language cues, identify triggers, and design a safe, effective plan in person. Online format can\'t deliver that depth. Reach out directly and we\'ll help you find the safest, most appropriate path forward.',
    },
    {
        question: 'How much daily practice will I need after the lesson?',
        answer:
            'About 10–15 minutes a day is enough. But the bigger shift is this: we don\'t ask you to "carve out training time." We teach you to weave training into life — walks, feeding, recall games, the moments before you leave the house. Those everyday moments are your best practice opportunities. Most owners realise the breakthrough wasn\'t about training more — it was about finally understanding their dog differently.',
    },
];

export const FAQS = FAQS_ZH; // backward compat default

export function getFAQS(locale = 'zh-TW') {
    return locale === 'en' ? FAQS_EN : FAQS_ZH;
}

const PRICING_PLANS_ZH = [
    {
        id: 'single-session',
        name: '單次 60 分鐘課程方案',
        emoji: '🐶',
        price: 2490,
        labelInline: '單次線上課程',
        features: [
            '60 分鐘 Google Meet 一對一深度課程',
            '完整分析你家狗狗的行為問題',
            '現場為你客製專屬訓練方向',
            '課後投影片，方便複習',
            '提供練習與執行建議',
            '課後可透過 LINE 官方帳號持續提問',
        ],
        highlighted: false,
    },
    {
        id: 'breakthrough-4',
        name: '突破成長方案',
        emoji: '🔥',
        subtitle: '4 堂 60 分鐘深度陪跑',
        price: 8999,
        originalPrice: 9960,
        discount: '9 折優惠',
        features: [
            '4 次一對一線上課程深度指導',
            '持續調整訓練策略（非一次性）',
            '每次之間都有進度追蹤',
            '課後可透過 LINE 官方帳號持續提問',
            '課後優先支援',
            '所有課程皆提供投影片',
        ],
        bonus: '加碼贈送 價值 $399 舔食墊',
        bonusEmoji: '🎁',
        quote: '這不只是上課，是陪你一路做到改變。',
        highlighted: true,
    },
];

const PRICING_PLANS_EN = [
    {
        id: 'single-session',
        name: 'Single 60-Minute Deep-Dive Session',
        emoji: '🐶',
        price: 2490,
        labelInline: '1 online session',
        features: [
            '60-minute 1-on-1 deep-dive session on Google Meet',
            'Full assessment of your dog\'s specific behaviour issue',
            'A custom training direction designed live, for your dog',
            'Slide deck after the session for easy review',
            'Concrete practice steps and homework you can actually use',
            'Follow-up questions via our LINE official account',
        ],
        highlighted: false,
    },
    {
        id: 'breakthrough-4',
        name: 'Breakthrough Plan',
        emoji: '🔥',
        subtitle: '4 sessions × 60 min — coaching that sticks',
        price: 8999,
        originalPrice: 9960,
        discount: '10% OFF',
        features: [
            '4 sessions of 1-on-1 online coaching',
            'Strategy refined session by session — not a one-shot fix',
            'Progress check-ins between sessions',
            'Ongoing Q&A on LINE between sessions',
            'Priority post-program support',
            'Slide deck after every session',
        ],
        bonus: 'Bonus: lick mat (worth $399) shipped to you',
        bonusEmoji: '🎁',
        quote: 'This isn\'t just lessons — it\'s coaching that walks with you to the change.',
        highlighted: true,
    },
];

export const PRICING_PLANS = PRICING_PLANS_ZH;

export function getPricingPlans(locale = 'zh-TW') {
    return locale === 'en' ? PRICING_PLANS_EN : PRICING_PLANS_ZH;
}

const TESTIMONIALS_ZH = [
    {
        name: '波比媽媽',
        title: '波比一對一家教分享',
        tag: '分離焦慮 / 吠叫問題',
        image: 'https://iili.io/qfrpctS.jpg',
        rating: 5,
        text: '波比之前有嚴重的<span class="text-orange-600 font-bold">分離焦慮</span>，只要兩分鐘看不到我，就會在客廳焦慮大便甚至吃掉。只要我們一離開，他就會在家裡<span class="text-orange-600 font-bold">不斷吠叫</span>，可以連續叫好幾個小時，還會緊張到一直流口水。那段時間真的身心俱疲，也很無助。真的很謝謝老師，幫我們一步一步拆解問題，從建立安全感、調整出門儀式，到拉長獨處時間。<span class="text-orange-600 font-bold">現在波比可以自己在家待上幾個小時；出門也變得非常穩定放鬆</span>。我終於真正認識、理解自己的狗狗了，也重新找回跟他相處的安心感。',
    },
    {
        name: '阿寶妞媽媽',
        title: '阿寶妞一對一家教分享',
        tag: '散步吠叫 / 電梯警戒',
        image: 'https://iili.io/qf4gNyu.jpg',
        rating: 5,
        text: '阿寶妞本身比較膽小，出門散步時<span class="text-orange-600 font-bold">看到狗狗或路人，或客人來家裡會一直吠叫</span>，搭電梯時只要有人進出也會吠叫。真的很開心遇見 Eric 老師，<span class="text-orange-600 font-bold">老師的教學方式非常有趣又有系統</span>，不是頭痛醫頭、腳痛醫腳，而是從吃、睡、玩、學四個面向全面調整。課程結束後的<span class="text-orange-600 font-bold">改變真的讓人很驚喜</span>，現在阿寶妞可以<span class="text-orange-600 font-bold">安心地散步，搭電梯時居然不再對進出的人吠叫，訪客來家裡也能穩定相處</span>、不再亂叫。更神奇的是，<span class="text-orange-600 font-bold">原本沒有特別請老師協助處理的行為問題，也在過程中默默被改善了</span>。真的很感謝這堂課，不只解決了問題，也讓我們更了解自己的狗狗。',
    },
    {
        name: 'Lulu媽媽',
        title: 'Lulu 行為調整心得',
        tag: '外出吠叫 / 心理建設',
        image: 'https://iili.io/qf6TBcb.jpg',
        rating: 5,
        text: 'Lulu 的吠叫問題已經困擾我們很久了，只要一出門看到人或看到狗就會大叫。<span class="text-orange-600 font-bold">試過很多方法都沒有用</span>，一度動過放棄的念頭。曾經以為養狗是一件很開心的事，卻因為不知道該怎麼訓練 Lulu，常常覺得自己是個失敗的飼主。還好遇到 Pennee 老師，<span class="text-orange-600 font-bold">老師很耐心地講解狗狗行為背後的原因，解開了我多年來的疑惑</span>，也教我用理解的角度去看待狗狗與訓練。慢慢地，<span class="text-orange-600 font-bold">Lulu 的穩定度真的進步了很多</span>。上課過程中，老師不只關心狗狗的情緒，也很在意身為毛孩媽媽的我的感受，她的耐心與鼓勵成了我最大的支持與力量，讓我重新找回陪伴狗狗的信心。',
    },
];

const TESTIMONIALS_EN = [
    {
        name: 'Bobby\'s mum',
        title: 'Bobby — 1-on-1 coaching story',
        tag: 'Separation anxiety / barking',
        image: 'https://iili.io/qfrpctS.jpg',
        rating: 5,
        text: 'Bobby had severe <span class="text-orange-600 font-bold">separation anxiety</span> — two minutes out of sight and he\'d soil the living room and even eat it. The moment we left, he\'d <span class="text-orange-600 font-bold">bark non-stop for hours</span>, drooling from stress. We were exhausted and out of ideas. Eric and Pennee broke the problem down step by step — building safety, restructuring our leaving ritual, slowly extending alone time. <span class="text-orange-600 font-bold">Bobby can now stay home alone for hours, and outside he\'s relaxed and steady.</span> I finally feel like I understand my own dog.',
    },
    {
        name: 'A-Bao\'s mum',
        title: 'A-Bao — 1-on-1 coaching story',
        tag: 'Walk reactivity / elevator alarm',
        image: 'https://iili.io/qf4gNyu.jpg',
        rating: 5,
        text: 'A-Bao is naturally timid. On walks she\'d <span class="text-orange-600 font-bold">bark at every dog and stranger, and at every guest who came home</span>. In the elevator, anyone stepping in or out would set her off. Eric\'s teaching is <span class="text-orange-600 font-bold">creative and systematic</span> — not whack-a-mole, but a full reset across food, sleep, play, and learning. <span class="text-orange-600 font-bold">The change after the program was honestly stunning.</span> A-Bao now <span class="text-orange-600 font-bold">walks calmly, ignores people in the elevator, and settles peacefully when guests visit</span>. Even behaviours we hadn\'t specifically asked about quietly improved on the way.',
    },
    {
        name: 'Lulu\'s mum',
        title: 'Lulu — behaviour change journey',
        tag: 'Reactivity / owner mindset',
        image: 'https://iili.io/qf6TBcb.jpg',
        rating: 5,
        text: 'Lulu\'s barking had haunted us for years — every walk, every dog, every stranger triggered an outburst. <span class="text-orange-600 font-bold">Nothing we tried worked</span>, and I quietly thought about giving up. I felt like a failed dog parent. Then we met Pennee. <span class="text-orange-600 font-bold">She patiently explained the why behind every behaviour</span>, and taught me to look at Lulu through a lens of understanding instead of frustration. Bit by bit, <span class="text-orange-600 font-bold">Lulu became dramatically steadier</span>. Pennee didn\'t just care about the dog — she cared about me as a dog parent. Her patience gave me back my confidence.',
    },
];

export const TESTIMONIALS = TESTIMONIALS_ZH;

export function getTestimonials(locale = 'zh-TW') {
    return locale === 'en' ? TESTIMONIALS_EN : TESTIMONIALS_ZH;
}

// 保留 NAV_LINKS for backward compat — new code should import from @/lib/nav
export const NAV_LINKS = [
    { label: '關於我們', href: '/#about-section' },
    { label: '一對一課程', href: '/#session-section' },
    { label: '狗狗行為文章', href: '/blog' },
    { label: '合作洽詢', href: '/contact' },
];

export const NEWSLETTER_COPY = {
    headline: '每週獲得免費調整毛孩行為的具體方法',
    subhead: '訂閱電子報，一起打造你與毛孩的理想生活 🐶',
    placeholder: '輸入你的 Email',
    button: '免費訂閱',
    successMessage: '確認信已寄出！請到信箱點擊確認連結完成訂閱 📬（沒看到的話，請檢查「促銷內容」或垃圾郵件資料夾）',
    errorMessage: '訂閱失敗，請稍後再試或直接寄信給我們。',
};
