/* ==========================
   Falling Hearts Mini Game
   ========================== */

const gameArea = document.getElementById('gameArea');
const scoreEl = document.getElementById('score');
const gameMsg = document.getElementById('gameMsg');
const gameNextBtn = document.getElementById('gameNextBtn');
const trickBtn = document.getElementById('trickBtn');
const lotsoGame = document.getElementById('lotsoGame');
const gameHint = document.getElementById('gameHint');

let fallingItems = [];
let gameLoopId = null;
let spawnInterval = null;
let lastFrameTime = 0;
let gameActive = false;
let score = 0;
const targetScore = 20;

// Trick button runs away from cursor / finger
if (trickBtn) {
  trickBtn.addEventListener('mouseenter', dodgeTrickButton);
  trickBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    dodgeTrickButton(e);
  }, { passive: false });
}

const heartEmojis = ['💖', '💕', '❤️', '💗', '💘'];
const sweetMessages = [
  'Cantiknya Sayang! 😍',
  'Abi sayang Sayang! 💕',
  'Hati ni untuk awak! ❤️',
  'Strawberry manis macam awak! 🍓',
  'Lotso pun sayang awak! 🧸',
  'Bunga pun kalah manis! 🌸',
  'Awak buat Abi senyum ☺️',
  'Cepatnya! Hebat! 🌟'
];

const trickMessages = [
  'Hah! Awak tekan jugak! 😂',
  'Lotso marah sikit… tapi sayang awak! 🧸💘',
  'Abi dah jangka awak tekan! 😈',
  'Hati bertaburan! 💕💕💕',
  'Jangan buat muka comel! 😘'
];

function startGame() {
  if (gameActive || !gameArea) return;
  gameActive = true;
  score = 0;
  scoreEl.textContent = score;
  gameMsg.textContent = 'Tarik Lotso untuk mula! 💕';
  gameNextBtn.classList.add('hidden');
  trickBtn.classList.remove('hidden');
  trickBtn.style.left = '50%';
  trickBtn.style.top = '50%';
  if (gameHint) gameHint.classList.remove('hidden');

  fallingItems.forEach(i => i.el.remove());
  fallingItems = [];
  resetLotsoPosition();

  lastFrameTime = performance.now();
  gameLoopId = requestAnimationFrame(gameLoop);
  spawnInterval = setInterval(spawnFallingItem, 650);
}

function stopGame() {
  gameActive = false;
  cancelAnimationFrame(gameLoopId);
  clearInterval(spawnInterval);
  fallingItems.forEach(i => i.el.remove());
  fallingItems = [];
}

function resetLotsoPosition() {
  if (!lotsoGame || !gameArea) return;
  const areaRect = gameArea.getBoundingClientRect();
  lotsoGame.style.left = (areaRect.width / 2) + 'px';
}

function spawnFallingItem() {
  if (!gameActive || score >= targetScore) return;

  const isBomb = Math.random() < 0.15;
  const el = document.createElement('div');
  el.className = 'falling-item' + (isBomb ? ' bomb' : '');
  el.textContent = isBomb ? '💣' : heartEmojis[Math.floor(Math.random() * heartEmojis.length)];

  const size = isBomb ? 44 : 36;
  const areaWidth = gameArea.clientWidth;
  const x = Math.random() * Math.max(1, areaWidth - size);
  const y = -size;
  const speed = 75 + Math.random() * 85; // px per second

  el.style.transform = `translate(${x}px, ${y}px)`;
  gameArea.appendChild(el);

  fallingItems.push({ el, type: isBomb ? 'bomb' : 'heart', x, y, speed, size });
}

function gameLoop(time) {
  if (!gameActive) return;
  const dt = Math.min((time - lastFrameTime) / 1000, 0.05);
  lastFrameTime = time;

  const areaRect = gameArea.getBoundingClientRect();
  const areaWidth = areaRect.width;
  const areaHeight = areaRect.height;

  const lotsoRect = lotsoGame.getBoundingClientRect();
  const lotsoX = lotsoRect.left - areaRect.left;
  const lotsoY = lotsoRect.top - areaRect.top;
  const lotsoW = lotsoRect.width;
  const lotsoH = lotsoRect.height;

  for (let i = fallingItems.length - 1; i >= 0; i--) {
    const it = fallingItems[i];
    it.y += it.speed * dt;
    it.el.style.transform = `translate(${it.x}px, ${it.y}px)`;

    const itemCenterX = it.x + it.size / 2;
    const itemBottom = it.y + it.size;
    const itemTop = it.y;

    const caught = (
      itemBottom >= lotsoY + lotsoH * 0.25 &&
      itemTop <= lotsoY + lotsoH &&
      itemCenterX >= lotsoX &&
      itemCenterX <= lotsoX + lotsoW
    );

    if (caught) {
      handleCatch(it, itemCenterX, it.y);
      continue;
    }

    if (it.y > areaHeight) {
      it.el.remove();
      fallingItems.splice(i, 1);
    }
  }

  gameLoopId = requestAnimationFrame(gameLoop);
}

function handleCatch(item, x, y) {
  item.el.classList.add('caught');
  const idx = fallingItems.indexOf(item);
  if (idx > -1) fallingItems.splice(idx, 1);
  setTimeout(() => item.el.remove(), 160);

  if (item.type === 'bomb') {
    score = Math.max(0, score - 1);
    gameMsg.textContent = 'Awas bom! Markah kurang 1 💣';
    showBubble(x, y, 'Oops! -1 💣', true);
    lotsoReact('shake');
    vibrate([60, 30, 60]);
    gameArea.classList.add('boom-flash');
    setTimeout(() => gameArea.classList.remove('boom-flash'), 350);
  } else {
    score++;
    const msg = sweetMessages[Math.floor(Math.random() * sweetMessages.length)];
    gameMsg.textContent = msg;
    showBubble(x, y, msg, false);
    vibrate(20);
    if (score % 5 === 0) lotsoReact('wiggle');
  }

  scoreEl.textContent = score;

  if (score >= targetScore) {
    gameComplete();
  }
}

function showBubble(x, y, text, isBad) {
  const areaRect = gameArea.getBoundingClientRect();
  const bubble = document.createElement('div');
  bubble.className = 'bubble' + (isBad ? ' bubble-bad' : '');
  bubble.textContent = text;
  gameArea.appendChild(bubble);

  const bubbleRect = bubble.getBoundingClientRect();
  let left = x - bubbleRect.width / 2;
  let top = y - bubbleRect.height - 8;
  left = Math.max(8, Math.min(left, areaRect.width - bubbleRect.width - 8));
  top = Math.max(8, top);
  bubble.style.left = left + 'px';
  bubble.style.top = top + 'px';

  setTimeout(() => bubble.remove(), 1200);
}

/* ---------- Drag Lotso ---------- */
let lotsoDragging = false;
let dragOffsetX = 0;

function initLotsoDrag() {
  if (!lotsoGame) return;

  lotsoGame.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    lotsoDragging = true;
    lotsoGame.classList.add('grabbing');
    if (gameHint) gameHint.classList.add('hidden');

    const lotsoRect = lotsoGame.getBoundingClientRect();
    const centerX = lotsoRect.left + lotsoRect.width / 2;
    dragOffsetX = e.clientX - centerX;

    try {
      lotsoGame.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  lotsoGame.addEventListener('pointermove', (e) => {
    if (!lotsoDragging) return;
    e.preventDefault();

    const areaRect = gameArea.getBoundingClientRect();
    const lotsoRect = lotsoGame.getBoundingClientRect();
    const lotsoW = lotsoRect.width;

    let centerX = e.clientX - areaRect.left - dragOffsetX;
    centerX = Math.max(lotsoW / 2, Math.min(centerX, areaRect.width - lotsoW / 2));
    lotsoGame.style.left = centerX + 'px';
  });

  lotsoGame.addEventListener('pointerup', endDrag);
  lotsoGame.addEventListener('pointercancel', endDrag);
}

function endDrag(e) {
  if (!lotsoDragging) return;
  lotsoDragging = false;
  lotsoGame.classList.remove('grabbing');
  try {
    lotsoGame.releasePointerCapture(e.pointerId);
  } catch (_) {}
}

function gameComplete() {
  stopGame();
  gameMsg.textContent = 'Yay! Lotso happy! 🧸💖';
  trickBtn.classList.add('hidden');
  gameNextBtn.classList.remove('hidden');
  lotsoReact('jump');
  burstHearts(40);
  vibrate([60, 40, 60]);
}

function dodgeTrickButton(e) {
  // Keep the mischief button fully inside the game-actions container
  const container = trickBtn.parentElement;
  const contRect = container.getBoundingClientRect();
  const btnRect = trickBtn.getBoundingClientRect();
  const halfW = btnRect.width / 2;
  const halfH = btnRect.height / 2;
  const padding = 4;

  const minLeft = halfW + padding;
  const maxLeft = contRect.width - halfW - padding;
  const minTop = halfH + padding;
  const maxTop = contRect.height - halfH - padding;

  const left = minLeft + Math.random() * Math.max(0, maxLeft - minLeft);
  const top = minTop + Math.random() * Math.max(0, maxTop - minTop);

  trickBtn.style.left = left + 'px';
  trickBtn.style.top = top + 'px';

  const teases = [
    'Cepatnya! Tapi tak dapat! 😜',
    'Lotso tolong lari! 🧸💨',
    'Tangkap hati dulu! 💕',
    'Hampir! Cuba lagi! 😈'
  ];
  gameMsg.textContent = teases[Math.floor(Math.random() * teases.length)];
  lotsoReact('wiggle');
}

function trickButton() {
  const msg = trickMessages[Math.floor(Math.random() * trickMessages.length)];
  gameMsg.textContent = msg;
  burstHearts(25);
  lotsoReact('hug');
  vibrate(40);
}

/* ---------- Auto-start if this is the game page ---------- */
window.addEventListener('DOMContentLoaded', () => {
  initLotsoDrag();
  if (gameArea) startGame();
});
