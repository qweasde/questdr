/* =========================================================
   НАСТРОЙКИ КВЕСТА — редактируй тексты здесь
   keys: части слов, по которым засчитывается ответ
   ========================================================= */
const RIDDLES = [
  {
    place: "Камин",
    icon: "p-fireplace",
    text: "Огонь живёт в моём жилище,\nДрова — любимейшая пища.\nЗимой я греюсь и трещу —\nПодарок первый сторожу.",
    hint: "Там бывает огонь, но это не плита. Рядом приятно греться зимними вечерами.",
    keys: ["камин", "очаг"],
  },
  {
    place: "Балкон",
    icon: "p-balcony",
    text: "Шагнёшь из комнаты за дверь —\nНо ты не в подъезде, поверь!\nЗдесь небо близко, ветерок\nИ виден весь наш городок.",
    hint: "Это часть квартиры, которая «висит» снаружи дома. Там свежий воздух.",
    keys: ["балкон", "лоджи"],
  },
  {
    place: "Прихожая",
    icon: "p-hallway",
    text: "Здесь каждый день встречают нас\nИ провожают каждый раз.\nБотинки, куртки, зонт, ключи —\nГде их хранят? Скорей ищи!",
    hint: "Первое место, куда попадаешь, когда заходишь в квартиру.",
    keys: ["прихож", "коридор", "холл", "вход"],
  },
  {
    place: "Духовка",
    icon: "p-oven",
    text: "Во мне печётся пирожок,\nРумянится к обеду бок.\nСегодня жар я не держу —\nСюрприз внутри тебе вручу!",
    hint: "Живёт на кухне, у неё есть стеклянная дверца. Включать не нужно!",
    keys: ["духов", "печк", "печь"],
  },
  {
    place: "Стиральная машина",
    icon: "p-washer",
    text: "Окошко круглое, как в корабле,\nНо плаваю лишь в пене и воде.\nКружу носки, рубашки и бельё —\nЗдесь ждёт тебя сокровище твоё!",
    hint: "Там крутится барабан, а носки иногда бесследно исчезают.",
    keys: ["стирал", "стиралк", "стиральн", "машинк"],
  },
];

const WRONG_MESSAGES = [
  "Не то место. Перечитай загадку ещё разок.",
  "Мимо! Попробуй подумать иначе.",
  "Почти… но нет. Может, взять подсказку?",
  "Не угадала. Не сдавайся!",
];

const STORAGE_KEY = "gift-quest-v1";

/* ========================================================= */

const $ = (sel) => document.querySelector(sel);

const screens = {
  intro: $("#screen-intro"),
  riddle: $("#screen-riddle"),
  found: $("#screen-found"),
  final: $("#screen-final"),
};

const el = {
  start: $("#btn-start"),
  startLabel: $("#btn-start-label"),
  resetIntro: $("#btn-reset-intro"),
  resetFinal: $("#btn-reset-final"),
  stepLabel: $("#step-label"),
  progress: $("#progress"),
  riddleTitle: $("#riddle-title"),
  riddleText: $("#riddle-text"),
  form: $("#answer-form"),
  input: $("#answer"),
  feedback: $("#feedback"),
  hintBox: $("#hint-box"),
  hintText: $("#hint-text"),
  hintBtn: $("#btn-hint"),
  giveupBtn: $("#btn-giveup"),
  foundEyebrow: $("#found-eyebrow"),
  foundTitle: $("#found-title"),
  placeIcon: $("#place-icon"),
  placeName: $("#place-name"),
  next: $("#btn-next"),
  nextLabel: $("#btn-next-label"),
  foundList: $("#found-list"),
  confettiBtn: $("#btn-confetti"),
};

/* ---------- Состояние ---------- */
// step: индекс текущей загадки; solved: отгадана ли текущая (ждём «нашла»)
let state = load() || { step: 0, solved: false, started: false };
let wrongCount = 0;

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* приватный режим */ }
}
function reset() {
  state = { step: 0, solved: false, started: false };
  save();
  render();
}

/* ---------- Проверка ответа ---------- */
function normalize(s) {
  return s.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function isCorrect(answer, riddle) {
  const a = normalize(answer);
  return a.length > 0 && riddle.keys.some((k) => a.includes(k));
}

/* ---------- Отрисовка ---------- */
function show(name) {
  Object.entries(screens).forEach(([key, node]) => node.classList.toggle("is-active", key === name));
  window.scrollTo(0, 0);
  const heading = screens[name].querySelector("h1, h2");
  if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
}

function placeSvg(id) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#${id}"/></svg>`;
}

function renderProgress() {
  el.progress.innerHTML = RIDDLES.map((_, i) => {
    const cls = i < state.step || (i === state.step && state.solved) ? "is-done" : i === state.step ? "is-current" : "";
    return `<li class="${cls}"></li>`;
  }).join("");
}

function renderRiddle() {
  const r = RIDDLES[state.step];
  wrongCount = 0;
  el.stepLabel.textContent = `Загадка ${state.step + 1} из ${RIDDLES.length}`;
  el.riddleTitle.textContent = `Загадка №${state.step + 1}`;
  el.riddleText.textContent = r.text;
  el.input.value = "";
  el.input.classList.remove("is-error");
  el.feedback.textContent = "";
  el.hintBox.hidden = true;
  el.hintText.textContent = r.hint;
  el.hintBtn.hidden = false;
  el.giveupBtn.hidden = true;
  renderProgress();
}

function renderFound() {
  const r = RIDDLES[state.step];
  const isLast = state.step === RIDDLES.length - 1;
  el.foundTitle.innerHTML = `Подарок №${state.step + 1} ждёт тебя&nbsp;—`;
  el.placeIcon.innerHTML = placeSvg(r.icon);
  el.placeName.textContent = r.place;
  el.nextLabel.textContent = isLast ? "Нашла! Завершить квест" : "Нашла! Следующая загадка";
}

function renderFinal() {
  el.foundList.innerHTML = RIDDLES.map((r, i) =>
    `<li style="animation-delay:${i * 60}ms"><span class="num">${i + 1}</span>${r.place}${placeSvg(r.icon)}</li>`
  ).join("");
}

function render() {
  if (!state.started) {
    const inProgress = state.step > 0 || state.solved;
    el.startLabel.textContent = inProgress ? "Продолжить квест" : "Начать квест";
    el.resetIntro.hidden = !inProgress;
    show("intro");
  } else if (state.step >= RIDDLES.length) {
    renderFinal();
    show("final");
    launchConfetti();
  } else if (state.solved) {
    renderFound();
    show("found");
  } else {
    renderRiddle();
    show("riddle");
  }
}

/* ---------- Обработчики ---------- */
el.start.addEventListener("click", () => { state.started = true; save(); render(); });

el.resetIntro.addEventListener("click", () => {
  if (confirm("Сбросить прогресс и начать квест с начала?")) reset();
});
el.resetFinal.addEventListener("click", () => {
  if (confirm("Пройти квест заново?")) reset();
});

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const r = RIDDLES[state.step];
  const value = el.input.value;

  if (!normalize(value)) {
    el.feedback.textContent = "Напиши, где, по-твоему, спрятан подарок.";
    el.input.focus();
    return;
  }

  if (isCorrect(value, r)) {
    vibrate([30, 40, 60]);
    el.input.blur();
    solve();
  } else {
    wrongCount++;
    vibrate(120);
    el.feedback.textContent = WRONG_MESSAGES[(wrongCount - 1) % WRONG_MESSAGES.length];
    el.input.classList.remove("is-error");
    void el.input.offsetWidth; // перезапуск анимации
    el.input.classList.add("is-error");
    if (wrongCount >= 2) { el.hintBox.hidden = false; el.hintBtn.hidden = true; }
    if (wrongCount >= 4) el.giveupBtn.hidden = false;
  }
});

el.input.addEventListener("input", () => {
  el.input.classList.remove("is-error");
  el.feedback.textContent = "";
});

el.hintBtn.addEventListener("click", () => {
  el.hintBox.hidden = false;
  el.hintBtn.hidden = true;
  el.giveupBtn.hidden = false;
});

el.giveupBtn.addEventListener("click", () => {
  if (confirm("Точно показать ответ?")) {
    el.foundEyebrow.textContent = "Ничего страшного!";
    solve(true);
  }
});

function solve(gaveUp = false) {
  if (!gaveUp) el.foundEyebrow.textContent = "Верно!";
  state.solved = true;
  save();
  renderFound();
  show("found");
  if (!gaveUp) miniBurst();
}

el.next.addEventListener("click", () => {
  vibrate(20);
  state.step++;
  state.solved = false;
  save();
  render();
});

el.confettiBtn.addEventListener("click", launchConfetti);

function vibrate(p) { if (navigator.vibrate) try { navigator.vibrate(p); } catch { /* ignore */ } }

/* ---------- Конфетти ---------- */
const canvas = $("#confetti");
const ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const COLORS = ["#EC4899", "#DB2777", "#F9A8D4", "#FBCFE8", "#BE185D", "#FDE68A"];
let particles = [];
let rafId = null;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resizeCanvas);
resizeCanvas();

function spawn(count, originY, spread) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: innerWidth / 2 + (Math.random() - .5) * spread,
      y: originY,
      vx: (Math.random() - .5) * 9,
      vy: -Math.random() * 11 - 5,
      size: Math.random() * 7 + 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - .5) * .3,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      heart: Math.random() < .35,
      life: 0,
    });
  }
  if (!rafId) rafId = requestAnimationFrame(tick);
}

function drawHeart(s) {
  ctx.beginPath();
  ctx.moveTo(0, s * .3);
  ctx.bezierCurveTo(-s, -s * .4, -s * .4, -s, 0, -s * .4);
  ctx.bezierCurveTo(s * .4, -s, s, -s * .4, 0, s * .3);
  ctx.fill();
}

function tick() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  particles = particles.filter((p) => p.y < innerHeight + 40 && p.life < 400);
  for (const p of particles) {
    p.life++;
    p.vy += .25;
    p.vx *= .99;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.heart) drawHeart(p.size);
    else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  }
  rafId = particles.length ? requestAnimationFrame(tick) : null;
}

function launchConfetti() {
  if (reduceMotion) return;
  spawn(140, innerHeight * .55, innerWidth * .6);
  setTimeout(() => spawn(80, innerHeight * .4, innerWidth), 350);
}
function miniBurst() {
  if (reduceMotion) return;
  spawn(50, innerHeight * .45, 80);
}

render();
