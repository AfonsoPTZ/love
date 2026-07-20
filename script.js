// ---- navegação entre telas ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ---- botão "Não" fujão ----
const btnNo = document.getElementById('btn-no');
let noIsRunaway = false;

function moveNoButton() {
  const rect = btnNo.getBoundingClientRect();
  const margin = 16;
  const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
  const maxY = Math.max(margin, window.innerHeight - rect.height - margin);
  const x = margin + Math.random() * (maxX - margin);
  const y = margin + Math.random() * (maxY - margin);

  if (!noIsRunaway) {
    // reserva o espaço do botão no layout pra "Sim" não se mover
    const placeholder = document.createElement('div');
    placeholder.style.width = rect.width + 'px';
    placeholder.style.height = rect.height + 'px';
    placeholder.style.visibility = 'hidden';
    btnNo.parentNode.insertBefore(placeholder, btnNo);

    btnNo.style.width = rect.width + 'px';
    btnNo.classList.add('runaway');
    noIsRunaway = true;
  }
  btnNo.style.left = x + 'px';
  btnNo.style.top = y + 'px';
}

document.addEventListener('pointermove', (e) => {
  if (!document.getElementById('screen-start').classList.contains('active')) return;
  const rect = btnNo.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
  if (dist < 110) moveNoButton();
});

btnNo.addEventListener('touchstart', (e) => {
  e.preventDefault();
  moveNoButton();
}, { passive: false });

btnNo.addEventListener('click', (e) => {
  e.preventDefault();
  moveNoButton();
});

// ---- botão "Sim" -> transição ----
const cuteMessages = [
  'Ainda bem... eu sabia que você ia dizer sim 🥹',
  'Uhuul! Bora planejar nosso próximo encontro 💕',
];

document.getElementById('btn-yes').addEventListener('click', () => {
  showScreen('screen-transition');
  document.getElementById('transition-text').textContent =
    cuteMessages[Math.floor(Math.random() * cuteMessages.length)];

  setTimeout(() => {
    showScreen('screen-quiz');
    if (typeof initQuiz === 'function') initQuiz();
  }, 2200);
});

// ==================================================
// QUIZ
// ==================================================
const TOTAL_STEPS = 4; // data, atividade, horário, easter egg
const quizContent = document.getElementById('quiz-content');
const quizProgressBar = document.getElementById('quiz-progress-bar');

const quizAnswers = {
  date: null,      // ex: "24/07"
  activity: null,
  time: null,
};

let currentStep = 0;
let calendarMonthOffset = 0; // 0 = mês atual, 1 = próximo mês

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const ACTIVITIES = [
  'Rolê na minha casa (eu cozinho pra você) 🍝',
  'Barzinho com sinuca 🎱',
  'Parque náutico juntos, eu de skate e você de bike 🚤🛹🚲',
  'Dar uma volta na rua 15 🚶‍♀️',
];

function updateProgress() {
  quizProgressBar.style.width = ((currentStep) / TOTAL_STEPS * 100) + '%';
}

function initQuiz() {
  currentStep = 0;
  calendarMonthOffset = 0;
  quizAnswers.date = null;
  quizAnswers.activity = null;
  quizAnswers.time = null;
  updateProgress();
  renderDateStep();
}

function goToNextStep() {
  currentStep++;
  updateProgress();
  if (currentStep === 1) renderActivityStep();
  else if (currentStep === 2) renderTimeStep();
  else if (currentStep === 3) renderEasterEggStep();
  else finishQuiz();
}

// ---- passo 1: data (calendário custom) ----
function renderDateStep() {
  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let cells = '';
  for (let i = 0; i < firstWeekday; i++) {
    cells += `<div class="cal-day cal-empty"></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    cells += `<button class="cal-day${isPast ? ' cal-disabled' : ''}" ${isPast ? 'disabled' : ''} data-day="${d}">${d}</button>`;
  }

  quizContent.innerHTML = `
    <h2 class="quiz-question">Que dia você tá livre? 📅</h2>
    <div class="cal-header">
      <button id="cal-prev" class="cal-nav" ${calendarMonthOffset === 0 ? 'disabled' : ''}>‹</button>
      <span class="cal-month-label">${MONTHS[month]} de ${year}</span>
      <button id="cal-next" class="cal-nav">›</button>
    </div>
    <div class="cal-grid cal-weekdays">
      ${WEEKDAYS.map(w => `<div class="cal-weekday">${w}</div>`).join('')}
    </div>
    <div class="cal-grid">${cells}</div>
  `;

  document.getElementById('cal-prev').addEventListener('click', () => {
    calendarMonthOffset--;
    renderDateStep();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calendarMonthOffset++;
    renderDateStep();
  });

  quizContent.querySelectorAll('.cal-day:not(.cal-empty):not(.cal-disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const day = btn.dataset.day;
      quizAnswers.date = `${day} de ${MONTHS[month]}`;
      goToNextStep();
    });
  });
}

// ---- passo 2: atividade ----
function renderActivityStep() {
  quizContent.innerHTML = `
    <h2 class="quiz-question">O que você quer fazer? 💫</h2>
    <div class="options-list">
      ${ACTIVITIES.map((a, i) => `<button class="quiz-option" data-i="${i}">${a}</button>`).join('')}
      <button class="quiz-option" id="activity-other-btn">Outro (escrever) ✍️</button>
    </div>
  `;
  quizContent.querySelectorAll('.quiz-option[data-i]').forEach(btn => {
    btn.addEventListener('click', () => {
      quizAnswers.activity = ACTIVITIES[btn.dataset.i];
      goToNextStep();
    });
  });

  document.getElementById('activity-other-btn').addEventListener('click', () => {
    quizContent.innerHTML = `
      <h2 class="quiz-question">Manda ver, o que você quer fazer? ✍️</h2>
      <textarea id="activity-other-input" class="text-input" placeholder="Escreve aqui..." rows="4"></textarea>
      <button id="activity-other-confirm" class="btn btn-yes" style="margin-top: 16px;">Confirmar</button>
    `;
    const input = document.getElementById('activity-other-input');
    input.focus();
    document.getElementById('activity-other-confirm').addEventListener('click', () => {
      const value = input.value.trim();
      if (!value) return;
      quizAnswers.activity = value;
      goToNextStep();
    });
  });
}

// ---- passo 3: horário (relógio custom) ----
function renderTimeStep() {
  const times = [];
  for (let h = 10; h <= 23; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);
    if (h !== 23) times.push(`${String(h).padStart(2, '0')}:30`);
  }

  quizContent.innerHTML = `
    <h2 class="quiz-question">Qual horário do nosso rolê? 🕒</h2>
    <div class="time-grid">
      ${times.map(t => `<button class="quiz-option time-option">${t}</button>`).join('')}
    </div>
  `;
  quizContent.querySelectorAll('.time-option').forEach(btn => {
    btn.addEventListener('click', () => {
      quizAnswers.time = btn.textContent;
      goToNextStep();
    });
  });
}

// ---- passo 4: easter egg "o quão linda você é" ----
const BEAUTY_OPTIONS = ['Linda', 'Muito linda', 'Muitíssimo linda', 'Impossivelmente linda'];
const ERROR_MESSAGES = [
  'Linda? Você acha que é só isso?',
  'Muito linda? Tá chutando baixo de novo.',
  'Você tá se valorizando pouco, você é muito mais que isso.',
  'Conserta já não.',
];
let beautyTriedCount = 0;

function renderEasterEggStep() {
  beautyTriedCount = 0;
  quizContent.innerHTML = `
    <h2 class="quiz-question">E o quão linda você é? 😍</h2>
    <div class="options-list">
      ${BEAUTY_OPTIONS.map((o, i) => `<button class="quiz-option beauty-option" data-i="${i}">${o}</button>`).join('')}
    </div>
    <p id="beauty-error" class="beauty-error"></p>
  `;

  const errorEl = document.getElementById('beauty-error');

  quizContent.querySelectorAll('.beauty-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('tried')) return;
      btn.classList.add('tried');

      document.getElementById('screen-quiz').classList.add('shake');
      setTimeout(() => document.getElementById('screen-quiz').classList.remove('shake'), 400);

      errorEl.textContent = ERROR_MESSAGES[beautyTriedCount % ERROR_MESSAGES.length];
      beautyTriedCount++;

      if (beautyTriedCount >= BEAUTY_OPTIONS.length) {
        setTimeout(showBeautyFinalMessage, 500);
      }
    });
  });
}

function showBeautyFinalMessage() {
  quizContent.innerHTML = `
    <h2 class="quiz-question">Viu só? </h2>
    <p class="beauty-final-message">
      Você é tão linda que nenhuma resposta simples como essas dá conta de explicar.
      Eu ainda não achei uma palavra que chegue perto do quanto você me encanta.
    </p>
    <button id="btn-continue-result" class="btn btn-yes" style="margin-top: 24px;">Continuar</button>
  `;
  document.getElementById('btn-continue-result').addEventListener('click', () => {
    goToNextStep();
  });
}

// ---- resultado final ----
function finishQuiz() {
  showScreen('screen-result');
  document.getElementById('result-content').innerHTML = `
    <h1 class="result-title">Nosso próximo encontro 💕</h1>
    <div class="result-card">
      <p><strong>Dia:</strong> ${quizAnswers.date}</p>
      <p><strong>Programa:</strong> ${quizAnswers.activity}</p>
      <p><strong>Horário:</strong> ${quizAnswers.time}</p>
    </div>
    <p class="result-closing">Muito bom, meu anjo 😘</p>
    <div class="floating-hearts">💗💋💗</div>
    <button id="btn-exit" class="btn btn-no" style="margin-top: 24px;">Sair</button>
  `;

  document.getElementById('btn-exit').addEventListener('click', () => {
    window.close();
  });

  sendResultsEmail(quizAnswers);
}

// ==================================================
// ENVIO DE EMAIL (EmailJS)
// ==================================================
// PRECISA CONFIGURAR ANTES DE FUNCIONAR:
// 1. EMAILJS_PUBLIC_KEY -> chave pública da sua conta EmailJS
// 2. EMAILJS_SERVICE_ID -> ID do serviço (Gmail/Outlook conectado)
// 3. EMAILJS_TEMPLATE_ID -> ID do template criado no painel EmailJS
// O template deve ter as variáveis: {{date}}, {{activity}}, {{time}}
const EMAILJS_PUBLIC_KEY = 'Rg3rrNH4td224rOEh';
const EMAILJS_SERVICE_ID = 'service_1tp99ye';
const EMAILJS_TEMPLATE_ID = 'template_z0st0gu';

function sendResultsEmail(answers) {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    console.warn('EmailJS não configurado ainda — respostas não foram enviadas por email.');
    return;
  }

  emailjs.init(EMAILJS_PUBLIC_KEY);
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    date: answers.date,
    activity: answers.activity,
    time: answers.time,
  }).catch(err => console.error('Erro ao enviar email:', err));
}
