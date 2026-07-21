// ---- trava o scroll da página inteira, mesmo tentando arrastar no celular ----
document.addEventListener('touchmove', (e) => {
  if (e.target.closest && e.target.closest('#music-progress')) return; // não trava o arrastar da barra de música
  e.preventDefault();
}, { passive: false });

// ---- player de música ----
const PLAYLIST = [
  { title: 'Céu Azul — Charlie Brown Jr', src: 'music/Charlie Brown Jr - Céu Azul.mp3' },
  { title: 'Velha Infância — Tribalistas', src: 'music/tribalistas-velha-infancia_mV2jb8Ys.mp3' },
  { title: 'Sutilmente', src: 'music/01. Sutilmente .mp3' },
  { title: 'Partilhar — Rubel', src: 'music/Rubel_-_Partilhar_(mp3.pm) (2).mp3' },
  { title: 'Ela Só Quer Paz — Projota', src: 'music/projota-ela-so-quer-paz_2yJtSJVM.mp3' },
];

let currentTrack = 0;
const audio = document.getElementById('audio-player');
const musicTrackName = document.getElementById('music-track-name');
const musicPlayPauseBtn = document.getElementById('music-playpause');
const musicProgressBar = document.getElementById('music-progress-bar');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');

function loadTrack(index, autoplay) {
  currentTrack = (index + PLAYLIST.length) % PLAYLIST.length;
  audio.src = encodeURI(PLAYLIST[currentTrack].src);
  musicTrackName.textContent = PLAYLIST[currentTrack].title;
  if (autoplay) audio.play().catch(() => {});
}

musicPlayPauseBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
});

document.getElementById('music-next').addEventListener('click', () => loadTrack(currentTrack + 1, true));
document.getElementById('music-prev').addEventListener('click', () => loadTrack(currentTrack - 1, true));

audio.addEventListener('play', () => {
  iconPlay.style.display = 'none';
  iconPause.style.display = '';
});
audio.addEventListener('pause', () => {
  iconPlay.style.display = '';
  iconPause.style.display = 'none';
});
audio.addEventListener('ended', () => loadTrack(currentTrack + 1, true));
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    musicProgressBar.style.width = (audio.currentTime / audio.duration * 100) + '%';
  }
});

// clicar/arrastar na barra pra pular pra qualquer ponto da música
const musicProgress = document.getElementById('music-progress');

function seekToEvent(e) {
  if (!audio.duration) return;
  const rect = musicProgress.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  audio.currentTime = ratio * audio.duration;
  musicProgressBar.style.width = (ratio * 100) + '%';
}

let isSeeking = false;
musicProgress.addEventListener('pointerdown', (e) => {
  isSeeking = true;
  seekToEvent(e);
});
document.addEventListener('pointermove', (e) => {
  if (isSeeking) seekToEvent(e);
});
document.addEventListener('pointerup', () => { isSeeking = false; });

loadTrack(0, false);

// navegadores só deixam tocar áudio com som depois de uma interação do usuário
let musicStarted = false;
function startMusicOnce() {
  if (musicStarted) return;
  musicStarted = true;
  audio.play().catch(() => {});
  document.removeEventListener('click', startMusicOnce);
  document.removeEventListener('touchstart', startMusicOnce);
}
document.addEventListener('click', startMusicOnce);
document.addEventListener('touchstart', startMusicOnce);

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
  'Ainda bem... eu sabia que você ia dizer sim ¯\\_(ツ)_/¯ '];

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
const quizBackBtn = document.getElementById('quiz-back-btn');

const quizAnswers = {
  date: null,      // ex: "24/07"
  activity: null,
  time: null,
};

let currentStep = 0;
let calendarMonthOffset = 0; // 0 = mês atual, 1 = próximo mês
let navHistory = []; // pilha de telas anteriores, pra voltar de verdade

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const ACTIVITIES = [
  'Rolê na minha casa (eu cozinho pra você) 🍝',
  'Barzinho com sinuca 🎱',
  'Parque náutico juntos, eu de skate e você de bike 🛹🚲',
  'Dar uma volta na rua 15 🚶‍♀️',
];

const ACTIVITY_MESSAGES = [
  'Só não vou conseguir cozinhar tão bem quanto você kkk',
  'Quem perder na mesa paga a conta 😏🎱',
  'Pode apostar que eu sou muito mais rápido no skate do que você de bike kakakaka',
  'Vamos ter que levar uns beck pra fumar por lá kakakaka',
];

function shakeScreen() {
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 400);
}

// aplica fade-in suave toda vez que o conteúdo de um container é trocado
function renderInto(el, html) {
  el.classList.remove('fade-in-up');
  el.innerHTML = html;
  void el.offsetWidth; // força reflow pra animação reiniciar
  el.classList.add('fade-in-up');
}

function updateProgress() {
  quizProgressBar.style.width = ((currentStep) / TOTAL_STEPS * 100) + '%';
}

function updateBackButtonVisibility() {
  quizBackBtn.classList.toggle('hidden', navHistory.length === 0);
}

function goToScreen(renderCurrentAgainFn, renderNextFn) {
  navHistory.push(renderCurrentAgainFn);
  updateBackButtonVisibility();
  renderNextFn();
}

function goBack() {
  const prevRender = navHistory.pop();
  updateBackButtonVisibility();
  if (prevRender) prevRender();
}

quizBackBtn.addEventListener('click', goBack);

function initQuiz() {
  currentStep = 0;
  calendarMonthOffset = 0;
  navHistory = [];
  quizAnswers.date = null;
  quizAnswers.activity = null;
  quizAnswers.time = null;
  updateProgress();
  updateBackButtonVisibility();
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
    const isPast = cellDate <= new Date(today.getFullYear(), today.getMonth(), today.getDate());
    cells += `<button class="cal-day${isPast ? ' cal-disabled' : ''}" ${isPast ? 'disabled' : ''} data-day="${d}">${d}</button>`;
  }

  renderInto(quizContent, `
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
  `);

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
      navHistory.push(() => renderDateStep());
      updateBackButtonVisibility();
      goToNextStep();
    });
  });
}

// ---- passo 2: atividade ----
function renderActivityStep() {
  renderInto(quizContent, `
    <h2 class="quiz-question">O que você quer fazer? 💫</h2>
    <div class="options-list">
      ${ACTIVITIES.map((a, i) => `<button class="quiz-option" data-i="${i}">${a}</button>`).join('')}
      <button class="quiz-option" id="activity-other-btn">Outro (escrever) ✍️</button>
    </div>
  `);
  quizContent.querySelectorAll('.quiz-option[data-i]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = btn.dataset.i;
      quizAnswers.activity = ACTIVITIES[i];
      navHistory.push(() => renderActivityStep());
      updateBackButtonVisibility();
      showActivityMessage(ACTIVITY_MESSAGES[i]);
    });
  });

  document.getElementById('activity-other-btn').addEventListener('click', () => {
    navHistory.push(() => renderActivityStep());
    updateBackButtonVisibility();
    renderActivityOtherStep();
  });
}

function renderActivityOtherStep() {
  renderInto(quizContent, `
    <h2 class="quiz-question">Manda ver, o que você quer fazer? ✍️</h2>
    <textarea id="activity-other-input" class="text-input" placeholder="Escreve aqui..." rows="4"></textarea>
    <p id="activity-other-error" class="field-error"></p>
    <button id="activity-other-confirm" class="btn btn-yes" style="margin-top: 16px;">Confirmar</button>
  `);
  const input = document.getElementById('activity-other-input');
  const errorEl = document.getElementById('activity-other-error');
  input.focus();
  document.getElementById('activity-other-confirm').addEventListener('click', () => {
    const value = input.value.trim();
    if (!value) {
      shakeScreen();
      errorEl.textContent = 'Bora, fala o que quer fazer';
      return;
    }
    quizAnswers.activity = value;
    navHistory.push(() => renderActivityOtherStep());
    updateBackButtonVisibility();
    showActivityMessage('Não sei o que é, mas certeza que eu do futuro vou adorar 😏');
  });
}

function showActivityMessage(message) {
  renderInto(quizContent, `
    <div class="message-card">
      <p class="activity-message">${message}</p>
      <button id="activity-message-continue" class="btn btn-yes" style="margin-top: 20px;">Continuar</button>
    </div>
  `);
  document.getElementById('activity-message-continue').addEventListener('click', () => {
    navHistory.push(() => showActivityMessage(message));
    updateBackButtonVisibility();
    goToNextStep();
  });
}

// ---- passo 3: horário ----
function renderTimeStep() {
  renderInto(quizContent, `
    <h2 class="quiz-question">Qual horário do nosso rolê? 🕒</h2>
    <input type="time" id="time-other-input" class="text-input time-native-input">
    <p id="time-other-error" class="field-error"></p>
    <button id="time-other-confirm" class="btn btn-yes" style="margin-top: 16px;">Confirmar</button>
  `);
  const input = document.getElementById('time-other-input');
  const errorEl = document.getElementById('time-other-error');
  input.focus();
  document.getElementById('time-other-confirm').addEventListener('click', () => {
    if (!input.value) {
      shakeScreen();
      errorEl.textContent = 'Esqueceu de colocar o horário, fia';
      return;
    }
    quizAnswers.time = input.value;
    navHistory.push(() => renderTimeStep());
    updateBackButtonVisibility();
    goToNextStep();
  });
}

// ---- passo 4: easter egg "o quão maravilhosa você é" ----
const BEAUTY_OPTIONS = ['Maravilhosa', 'Encantadora', 'Inesquecível', 'Um acontecimento raro ✨'];
const ERROR_MESSAGES = [
  'Maravilhosa? Isso nem chega perto 😂',
  'Encantadora... tá chegando mais perto.',
  'Inesquecível já combina bem mais.',
  'Um acontecimento raro? Agora sim, quase lá.',
];
let beautyTriedCount = 0;

function renderEasterEggStep() {
  beautyTriedCount = 0;
  renderInto(quizContent, `
    <h2 class="quiz-question">💖 O quão maravilhosa você é?</h2>
    <div class="options-list">
      ${BEAUTY_OPTIONS.map((o, i) => `<button class="quiz-option beauty-option" data-i="${i}">${o}</button>`).join('')}
    </div>
    <p id="beauty-error" class="beauty-error"></p>
  `);

  const errorEl = document.getElementById('beauty-error');

  quizContent.querySelectorAll('.beauty-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('tried')) return;
      btn.classList.add('tried');

      document.body.classList.add('shake');
      setTimeout(() => document.body.classList.remove('shake'), 400);

      errorEl.textContent = ERROR_MESSAGES[btn.dataset.i];
      beautyTriedCount++;

      if (beautyTriedCount >= BEAUTY_OPTIONS.length) {
        navHistory.push(() => renderEasterEggStep());
        updateBackButtonVisibility();
        setTimeout(showBeautyFinalMessage, 2300);
      }
    });
  });
}

function showBeautyFinalMessage() {
  renderInto(quizContent, `
    <div class="message-card">
      <h2 class="quiz-question">Viu só? </h2>
      <p class="beauty-final-message">
        Você é maravilhosa, encantadora, inesquecível e um acontecimento raro — tudo ao mesmo tempo. Nenhuma resposta simples como essas dá conta de explicar.
        Eu ainda não achei uma palavra que chegue perto do quanto você me encanta, então escolhi algumas músicas que talvez expliquem melhor.
      </p>
      <button id="btn-continue-result" class="btn btn-yes" style="margin-top: 20px;">Continuar</button>
    </div>
  `);
  document.getElementById('btn-continue-result').addEventListener('click', () => {
    goToNextStep();
  });
}

// ---- resultado final ----
function finishQuiz() {
  showScreen('screen-result');
  renderInto(document.getElementById('result-content'), `
    <h1 class="result-title">Nosso próximo encontro 💕</h1>
    <div class="result-card">
      <p><strong>Dia:</strong> ${quizAnswers.date}</p>
      <p><strong>Programa:</strong> ${quizAnswers.activity}</p>
      <p><strong>Horário:</strong> ${quizAnswers.time}</p>
    </div>
    <p class="result-closing">Muito obrigado pela atenção, meu anjo 😘</p>

    <div class="invite-image-wrap">
      <img src="images.jpg" alt="Convite" class="invite-image">
    </div>

    <p class="result-ps">🌙 Lembrando que uns beijinhos antes de dormir ajudam a aliviar o estresse. 😏</p>
  `);

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
