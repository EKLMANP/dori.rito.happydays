const startBtn = document.getElementById('start-btn');
const quizModal = document.getElementById('quiz-modal');
const loadingModal = document.getElementById('loading-modal');
const resultModal = document.getElementById('result-modal');
const questionArea = document.getElementById('question-area');
const progressBar = document.getElementById('progress-bar');
const closeModalBtn = document.getElementById('close-modal');
const restartBtn = document.getElementById('restart-btn');
let audioContext;
let beatInterval;

const quizData = {
  dogName: '',
  breed: '',
  age: '',
  activities: [],
  photoUrl: '',
  outlineUrl: ''
};

const akcBreeds = [
  '米克斯',
  'Affenpinscher', 'Afghan Hound', 'Airedale Terrier', 'Akita', 'Alaskan Malamute', 'American Bulldog',
  'American Eskimo Dog', 'American Foxhound', 'American Hairless Terrier', 'American Staffordshire Terrier',
  'American Water Spaniel', 'Anatolian Shepherd Dog', 'Australian Cattle Dog', 'Australian Kelpie',
  'Australian Shepherd', 'Australian Terrier', 'Azawakh', 'Barbet', 'Basenji', 'Basset Hound', 'Beagle',
  'Bearded Collie', 'Beauceron', 'Bedlington Terrier', 'Belgian Laekenois', 'Belgian Malinois',
  'Belgian Sheepdog', 'Belgian Tervuren', 'Berger Picard', 'Bernese Mountain Dog', 'Bichon Frise',
  'Black and Tan Coonhound', 'Black Russian Terrier', 'Bloodhound', 'Bluetick Coonhound', 'Boerboel',
  'Bolognese', 'Border Collie', 'Border Terrier', 'Borzoi', 'Boston Terrier', 'Bouvier des Flandres',
  'Boxer', 'Boykin Spaniel', 'Briard', 'Brittany', 'Brussels Griffon', 'Bull Terrier', 'Bulldog',
  'Bullmastiff', 'Cairn Terrier', 'Canaan Dog', 'Cane Corso', 'Cardigan Welsh Corgi', 'Cavalier King Charles Spaniel',
  'Chesapeake Bay Retriever', 'Chihuahua', 'Chinese Crested', 'Chinese Shar-Pei', 'Chow Chow', 'Cirneco dell\'Etna',
  'Clumber Spaniel', 'Cocker Spaniel', 'Collie', 'Coton de Tulear', 'Curly-Coated Retriever', 'Dachshund',
  'Dalmatian', 'Dandie Dinmont Terrier', 'Doberman Pinscher', 'Dogo Argentino', 'Dogue de Bordeaux',
  'Dutch Shepherd', 'English Cocker Spaniel', 'English Foxhound', 'English Setter', 'English Springer Spaniel',
  'English Toy Spaniel', 'Entlebucher Mountain Dog', 'Field Spaniel', 'Finnish Lapphund', 'Finnish Spitz',
  'Flat-Coated Retriever', 'French Bulldog', 'German Pinscher', 'German Shepherd Dog', 'German Shorthaired Pointer',
  'German Wirehaired Pointer', 'Giant Schnauzer', 'Glen of Imaal Terrier', 'Golden Retriever', 'Gordon Setter',
  'Great Dane', 'Great Pyrenees', 'Greater Swiss Mountain Dog', 'Greyhound', 'Harrier', 'Havanese', 'Ibizan Hound',
  'Icelandic Sheepdog', 'Irish Red and White Setter', 'Irish Setter', 'Irish Terrier', 'Irish Water Spaniel',
  'Irish Wolfhound', 'Italian Greyhound', 'Japanese Chin', 'Keeshond', 'Kerry Blue Terrier', 'Komondor', 'Kromfohrlander',
  'Kuvasz', 'Labrador Retriever', 'Lagotto Romagnolo', 'Lakeland Terrier', 'Leonberger', 'Lhasa Apso', 'Lowchen',
  'Maltese', 'Manchester Terrier', 'Mastiff', 'Miniature American Shepherd', 'Miniature Bull Terrier',
  'Miniature Pinscher', 'Miniature Schnauzer', 'Neapolitan Mastiff', 'Newfoundland', 'Norfolk Terrier',
  'Norwegian Buhund', 'Norwegian Elkhound', 'Norwegian Lundehund', 'Norwich Terrier', 'Nova Scotia Duck Tolling Retriever',
  'Old English Sheepdog', 'Otterhound', 'Papillon', 'Parson Russell Terrier', 'Pekingese', 'Pembroke Welsh Corgi',
  'Petit Basset Griffon Vendéen', 'Pharaoh Hound', 'Plott Hound', 'Pointer', 'Polish Lowland Sheepdog', 'Pomeranian',
  'Poodle', 'Portuguese Podengo Pequeno', 'Portuguese Water Dog', 'Pug', 'Puli', 'Pumi', 'Rat Terrier',
  'Redbone Coonhound', 'Rhodesian Ridgeback', 'Rottweiler', 'Russell Terrier', 'Saluki', 'Samoyed', 'Schipperke',
  'Scottish Deerhound', 'Scottish Terrier', 'Sealyham Terrier', 'Shetland Sheepdog', 'Shiba Inu', 'Shih Tzu',
  'Siberian Husky', 'Silky Terrier', 'Skye Terrier', 'Sloughi', 'Soft Coated Wheaten Terrier', 'Spanish Water Dog',
  'Spinone Italiano', 'St. Bernard', 'Staffordshire Bull Terrier', 'Standard Schnauzer', 'Sussex Spaniel', 'Swedish Vallhund',
  'Tibetan Mastiff', 'Tibetan Spaniel', 'Tibetan Terrier', 'Toy Fox Terrier', 'Treeing Walker Coonhound',
  'Vizsla', 'Weimaraner', 'Welsh Springer Spaniel', 'Welsh Terrier', 'West Highland White Terrier', 'Whippet', 'Wirehaired Pointing Griffon', 'Wirehaired Vizsla', 'Xoloitzcuintli', 'Yorkshire Terrier'
];

const activityOptions = [
  '爬山',
  '賴床',
  '擁抱',
  '玩拔河遊戲',
  '露營',
  '游泳',
  '玩球',
  '悠閒的待在咖啡廳',
  '海邊放空',
  '寵物公園跑跑',
  '訓練',
  '待在家耍廢'
];

const resultsPool = [
  {
    title: '前世是你的小跟班弟弟',
    desc: '牠前世就是黏著你、看到你就眼睛亮亮的弟弟。這輩子依然跟你形影不離，只想每天陪著你吃、陪著你睡，連散步都想牽著你走。',
    palette: ['#fff7f0', '#fdd6a7']
  },
  {
    title: '前世是你的守護武士',
    desc: '牠前世拿著木刀站在你身後默默保護你。這輩子沒有武器了，但換成用身體擋住你、對外面的人汪兩聲，使命感滿滿。',
    palette: ['#fff3e8', '#dff5f2']
  },
  {
    title: '前世是你的旅伴好朋友',
    desc: '你們前世一起跑遍各地，是最合拍的旅伴。這輩子牠看到你拿出牽繩就超興奮，因為牠又能跟你一起探索世界了！',
    palette: ['#dff5f2', '#f6c25c']
  },
  {
    title: '前世是你的貼心照顧者',
    desc: '前世是照顧你的小幫手，會替你端茶倒水、幫你整理心情。這輩子變成狗狗後，只要你難過牠就第一個跑來舔舔你。',
    palette: ['#fce8dc', '#fff7f0']
  },
  {
    title: '前世是你的午睡同床好友',
    desc: '你們最愛的就是一起賴床！這輩子牠最期待的仍然是窩在你身邊、把頭靠在你腿上的那一刻。',
    palette: ['#fdd6a7', '#fffaf6']
  },
  {
    title: '前世是你的忠實學生',
    desc: '牠以前最喜歡的就是被你教、被你稱讚。這輩子也是最努力聽你的指令，只為看到你開心的笑容。',
    palette: ['#fff7f0', '#dff5f2']
  },
  {
    title: '前世是你的快樂搞笑夥伴',
    desc: '牠前世就是你身邊最會搞笑、最會逗你笑的人。這輩子照樣每天用笨笨的姿勢、歪頭或怪表情讓你開心。',
    palette: ['#f6c25c', '#fce8dc']
  },
  {
    title: '前世是你的暖心守門人',
    desc: '前世牠站在你家門口守護安全。這輩子變成家裡最可靠的小警衛，誰靠近你牠就會警鈴大作，超盡責。',
    palette: ['#fff3e8', '#f6c25c']
  },
  {
    title: '前世是你的靈魂伴侶',
    desc: '不管是前世還是今生，你們都注定要在一起。牠看到你第一眼就認出你、跑來黏你，因為牠知道「找到你了」。',
    palette: ['#fce8dc', '#ff9b88']
  },
  {
    title: '前世是你的貼身小助理',
    desc: '前世幫你拿筆記、整理東西；這輩子幫你撿球、撿玩具。雖然常常越幫越忙，但牠就是最想跟你一起完成每件事。',
    palette: ['#dff5f2', '#fff7f0']
  }
];

const questions = [
  renderNameQuestion,
  renderBreedQuestion,
  renderAgeQuestion,
  renderActivityQuestion,
  renderPhotoQuestion
];

let currentStep = 0;

startBtn?.addEventListener('click', () => {
  openModal(quizModal);
  currentStep = 0;
  renderQuestion();
  startSoftMusic();
});

closeModalBtn?.addEventListener('click', () => {
  closeAllModals();
  resetQuiz();
});

restartBtn?.addEventListener('click', () => {
  closeAllModals();
  resetQuiz();
  openModal(quizModal);
  renderQuestion();
});

function renderQuestion() {
  updateProgress();
  const questionFn = questions[currentStep];
  if (questionFn) {
    questionArea.innerHTML = '';
    questionArea.appendChild(questionFn());
  }
}

function renderNameQuestion() {
  const wrap = document.createElement('div');
  wrap.className = 'question';
  wrap.innerHTML = `
    <label for="dog-name">你的狗狗名字是？</label>
    <input id="dog-name" class="text-input" type="text" placeholder="例如：Ritò 或 圓圓" required />
    <p class="hint">取好聽的名字，回到前世也能立刻認出來。</p>
    <div class="actions"><button class="primary" id="to-breed">確認</button></div>
  `;

  wrap.querySelector('#to-breed').addEventListener('click', () => {
    const nameInput = wrap.querySelector('#dog-name');
    const value = nameInput.value.trim();
    if (!value) return shake(nameInput);
    quizData.dogName = value;
    nextStep();
  });
  return wrap;
}

function renderBreedQuestion() {
  const wrap = document.createElement('div');
  wrap.className = 'question';
  wrap.innerHTML = `
    <label for="dog-breed">牠的品種是？</label>
    <select id="dog-breed" required>
      ${akcBreeds.map((breed) => `<option value="${breed}">${breed}</option>`).join('')}
    </select>
    <p class="hint">AKC 收錄的品種都在這裡，還貼心加上「米克斯」！</p>
    <div class="actions"><button class="primary" id="to-age">確認</button></div>
  `;
  wrap.querySelector('#to-age').addEventListener('click', () => {
    const breed = wrap.querySelector('#dog-breed').value;
    quizData.breed = breed;
    nextStep();
  });
  return wrap;
}

function renderAgeQuestion() {
  const wrap = document.createElement('div');
  wrap.className = 'question';
  wrap.innerHTML = `
    <label for="dog-age">牠現在幾歲？</label>
    <input id="dog-age" class="text-input" type="number" min="0" step="0.5" placeholder="例如：3" required />
    <p class="hint">年齡資訊會幫助我們算出牠的前世年紀喔。</p>
    <div class="actions"><button class="primary" id="to-activities">確認</button></div>
  `;
  wrap.querySelector('#to-activities').addEventListener('click', () => {
    const ageInput = wrap.querySelector('#dog-age');
    const value = ageInput.value.trim();
    if (!value || Number(value) < 0) return shake(ageInput);
    quizData.age = value;
    nextStep();
  });
  return wrap;
}

function renderActivityQuestion() {
  const wrap = document.createElement('div');
  wrap.className = 'question';
  wrap.innerHTML = `
    <label>牠最愛跟你做什麼？（可複選）</label>
    <div class="checkbox-grid">
      ${activityOptions
        .map(
          (act, idx) => `
          <label class="checkbox-card" for="act-${idx}">
            <input type="checkbox" id="act-${idx}" value="${act}">
            <span>${act}</span>
          </label>`
        )
        .join('')}
    </div>
    <p class="hint">讓我們抓到你們相處的靈魂節奏。</p>
    <div class="actions"><button class="primary" id="to-photo">確認</button></div>
  `;
  wrap.querySelector('#to-photo').addEventListener('click', () => {
    const checked = Array.from(wrap.querySelectorAll('input[type=checkbox]:checked')).map((c) => c.value);
    if (!checked.length) return shake(wrap.querySelector('.checkbox-grid'));
    quizData.activities = checked;
    nextStep();
  });
  return wrap;
}

function renderPhotoQuestion() {
  const wrap = document.createElement('div');
  wrap.className = 'question';
  wrap.innerHTML = `
    <label for="dog-photo">上傳一張狗狗照片</label>
    <input id="dog-photo" class="text-input" type="file" accept="image/*" required />
    <p class="hint">我們會把照片轉成手繪輪廓，融入前世結果圖！</p>
    <div class="actions"><button class="primary" id="finish">送出</button></div>
  `;
  wrap.querySelector('#finish').addEventListener('click', async () => {
    const fileInput = wrap.querySelector('#dog-photo');
    const [file] = fileInput.files;
    if (!file) return shake(fileInput);

    const reader = new FileReader();
    reader.onload = async (e) => {
      quizData.photoUrl = e.target.result;
      showLoading();
      try {
        quizData.outlineUrl = await generateOutline(quizData.photoUrl);
      } catch (err) {
        console.error(err);
        quizData.outlineUrl = quizData.photoUrl;
      }
      await waitForMoment();
      renderResult();
    };
    reader.readAsDataURL(file);
  });
  return wrap;
}

function updateProgress() {
  const percent = ((currentStep) / questions.length) * 100;
  progressBar.style.width = `${percent}%`;
}

function nextStep() {
  currentStep += 1;
  if (currentStep < questions.length) {
    renderQuestion();
  }
}

function openModal(modal) {
  modal?.setAttribute('aria-hidden', 'false');
}

function closeAllModals() {
  [quizModal, loadingModal, resultModal].forEach((modal) => modal.setAttribute('aria-hidden', 'true'));
}

function resetQuiz() {
  Object.assign(quizData, { dogName: '', breed: '', age: '', activities: [], photoUrl: '', outlineUrl: '' });
  currentStep = 0;
  questionArea.innerHTML = '';
  progressBar.style.width = '0%';
}

function waitForMoment() {
  return new Promise((resolve) => setTimeout(resolve, 5000 + Math.random() * 2000));
}

function showLoading() {
  closeAllModals();
  openModal(loadingModal);
}

function renderResult() {
  closeAllModals();
  const randomResult = resultsPool[Math.floor(Math.random() * resultsPool.length)];
  const subtitle = `${quizData.dogName || '狗狗'} (${quizData.breed || '可愛毛孩'}・${quizData.age || '?'} 歲)`;

  document.getElementById('result-subtitle').textContent = subtitle;
  document.getElementById('result-label').textContent = randomResult.title;
  document.getElementById('result-desc').textContent = randomResult.desc;
  document.getElementById('dog-outline').src = quizData.outlineUrl;
  document.getElementById('result-illustration').innerHTML = buildIllustration(randomResult, quizData.activities);

  openModal(resultModal);
}

function shake(el) {
  el.style.animation = 'shake 0.2s';
  setTimeout(() => (el.style.animation = ''), 300);
}

const styleShake = document.createElement('style');
styleShake.textContent = `
@keyframes shake {
  25% { transform: translateX(-3px); }
  50% { transform: translateX(3px); }
  75% { transform: translateX(-2px); }
}
`;
document.head.appendChild(styleShake);

function buildIllustration(result, activities = []) {
  const [bg, accent] = result.palette;
  const activityText = activities.slice(0, 2).join(' · ') || '一起的日常';
  return `
  <svg class="story-art" viewBox="0 0 420 320" role="img" aria-label="${result.title}">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg}" />
        <stop offset="100%" stop-color="${accent}" stop-opacity="0.7" />
      </linearGradient>
    </defs>
    <rect width="420" height="320" rx="18" fill="url(#sky)" stroke="#f5c19c" stroke-width="4" />
    <g stroke="#1f1a2b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M40 270c30-60 90-90 170-70 44 10 80 34 110 82" fill="rgba(255,255,255,0.6)" />
      <path d="M120 210c-16-34 22-60 48-28" fill="#fff" />
      <path d="M190 210c18-32 62-18 64 14 1 26-18 40-42 34" fill="#fdd6a7" />
      <path d="M152 196q16-10 30 6" />
      <path d="M214 196q16-8 26 12" />
      <path d="M112 204c-12 8-30 20-46 8" />
      <path d="M260 218c8 16 24 32 46 28" />
    </g>
    <circle cx="185" cy="254" r="8" fill="#1f1a2b" />
    <circle cx="235" cy="254" r="8" fill="#1f1a2b" />
    <path d="M130 175c-26-18-46-12-56 12" stroke="#1f1a2b" stroke-width="3" />
    <path d="M270 170c20-20 44-8 52 18" stroke="#1f1a2b" stroke-width="3" />
    <g>
      <path d="M180 140c-16-14-12-36 4-44 18-8 42 10 42 28" fill="#fff" stroke="#1f1a2b" stroke-width="3" />
      <path d="M210 134c4-10 20-14 26 0s-2 28-18 28" fill="#fce8dc" stroke="#1f1a2b" stroke-width="3" />
      <path d="M154 136c-16-18-30-6-32 8-2 16 8 24 22 18" fill="#fff7f0" stroke="#1f1a2b" stroke-width="3" />
    </g>
    <text x="28" y="302" font-family="'Patrick Hand', 'Noto Sans TC', cursive" font-size="18" fill="#1f1a2b">${activityText}</text>
  </svg>`;
}

const dogOutline = document.getElementById('dog-outline');
const resultSubtitleEl = document.getElementById('result-subtitle');
const resultLabelEl = document.getElementById('result-label');
const resultDescEl = document.getElementById('result-desc');

function startSoftMusic() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioContext.resume();
  const gain = audioContext.createGain();
  gain.gain.value = 0.5;
  gain.connect(audioContext.destination);

  const playTone = (time, freq, duration = 0.3) => {
    const osc = audioContext.createOscillator();
    const toneGain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    toneGain.gain.setValueAtTime(0.0001, time);
    toneGain.gain.exponentialRampToValueAtTime(0.25, time + 0.05);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(toneGain).connect(gain);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  };

  const playLoop = () => {
    const now = audioContext.currentTime;
    playTone(now, 440);
    playTone(now + 0.45, 523.25);
    playTone(now + 0.9, 392);
    playTone(now + 1.2, 659.25, 0.4);
  };

  playLoop();
  beatInterval = setInterval(playLoop, 2200);
}

function stopMusic() {
  if (beatInterval) clearInterval(beatInterval);
  if (audioContext) {
    audioContext.close();
    audioContext = undefined;
  }
}

Array.from(document.querySelectorAll('.share-actions button')).forEach((btn) => {
  btn.addEventListener('click', () => handleShare(btn.dataset.share));
});

function handleShare(type) {
  const title = `【${resultLabelEl.textContent}】${resultSubtitleEl.textContent}`;
  const text = `${resultDescEl.textContent}\n#狗狗前世是你的什麼人 #DofiRito`;
  const url = window.location.href;

  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
    return;
  }

  if (type === 'fb') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`);
  } else if (type === 'ig') {
    navigator.clipboard?.writeText(`${title}\n${text}\n${url}`);
    alert('已複製分享文字，打開 IG 限動貼上即可！');
  } else {
    navigator.clipboard?.writeText(`${title}\n${text}\n${url}`);
    alert('已複製連結，貼到任何社群都可以分享');
  }
}

async function generateOutline(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 480;
      const scale = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
      const w = Math.max(120, img.width * scale);
      const h = Math.max(120, img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fffaf6';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const outline = ctx.createImageData(w, h);

      const threshold = 28;
      const alpha = 255;
      const idx = (x, y) => (y * w + x) * 4;

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = idx(x, y);
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const right = 0.299 * data[idx(x + 1, y)] + 0.587 * data[idx(x + 1, y) + 1] + 0.114 * data[idx(x + 1, y) + 2];
          const down = 0.299 * data[idx(x, y + 1)] + 0.587 * data[idx(x, y + 1) + 1] + 0.114 * data[idx(x, y + 1) + 2];
          const gradient = Math.abs(gray - right) + Math.abs(gray - down);
          const o = idx(x, y);
          if (gradient > threshold) {
            outline.data[o] = 255;
            outline.data[o + 1] = 255;
            outline.data[o + 2] = 255;
            outline.data[o + 3] = alpha;
          }
        }
      }

      ctx.putImageData(outline, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(255, 154, 136, 0.05)';
      ctx.fillRect(0, 0, w, h);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

window.addEventListener('beforeunload', stopMusic);
