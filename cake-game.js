/* ==========================
   Lotso Beach Birthday Adventure
   ========================== */

const room = document.getElementById('room');
const canvas = document.getElementById('gameCanvas');
const cakeHint = document.getElementById('cakeHint');
const dpad = document.getElementById('dpad');
const birthdayConsole = document.getElementById('birthdayConsole');
const celebration = document.getElementById('celebration');
const birthdaySong = document.getElementById('birthdaySong');

let ctx = null;
let dpr = 1;
let cw = 0;
let ch = 0;

let cakeGameActive = false;
let cakeFound = false;
let gameTime = 0;
let wasMusicPlaying = false;

const birthdayVideoId = null; // unused, kept for safety

// Assets
const lotsoImg = new Image();
lotsoImg.src = 'assets/lotso.svg';

const bgImg = new Image();
bgImg.src = 'assets/beach-bg.jpg';

const imagesReady = Promise.all([
  new Promise(r => { lotsoImg.onload = r; lotsoImg.onerror = r; }),
  new Promise(r => { bgImg.onload = r; bgImg.onerror = r; })
]);

// Game objects
const lotso = {
  x: 80,
  y: 0,
  width: 72,
  height: 86,
  speed: 3.2,
  facing: 1, // 1 right, -1 left
  bob: 0,
  jumpY: 0
};

const cake = {
  x: 0,
  y: 0,
  width: 64,
  height: 70,
  glow: 0,
  foundGlow: 0
};

const friends = [
  { x: 0, y: 0, hue: 0,   scale: 0.82, offset: 0, flip: -1, delay: 0 },
  { x: 0, y: 0, hue: 200, scale: 0.78, offset: 0, flip: 1,  delay: 0.2 },
  { x: 0, y: 0, hue: 90,  scale: 0.8,  offset: 0, flip: -1, delay: 0.4 }
];

const confetti = [];
const sparkles = [];
const clouds = [];
const waves = [];
let shake = 0;

let moveDir = { x: 0, y: 0 };
let moveInterval = null;

// Resize canvas to container with device pixel ratio
function resizeCanvas() {
  if (!room || !canvas) return;
  const rect = room.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cw = Math.max(1, Math.floor(rect.width * dpr));
  ch = Math.max(1, Math.floor(rect.height * dpr));
  canvas.width = cw;
  canvas.height = ch;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx = canvas.getContext('2d');
  resetPositions();
}

function resetPositions() {
  if (!cw || !ch) return;
  // Lotso starts top-left area
  lotso.x = 70;
  lotso.y = ch * 0.22;
  lotso.facing = 1;

  // Cake placed on the sand (bottom-right)
  cake.x = cw - 110;
  cake.y = ch - 115;
  cake.glow = 0;
  cake.foundGlow = 0;

  // Friends around the cake
  friends[0].x = cake.x - 90; friends[0].y = cake.y + 10;
  friends[1].x = cake.x + 80;  friends[1].y = cake.y - 5;
  friends[2].x = cake.x;       friends[2].y = cake.y + 75;

  // Decorative clouds
  clouds.length = 0;
  for (let i = 0; i < 4; i++) {
    clouds.push({
      x: Math.random() * cw,
      y: Math.random() * ch * 0.25,
      w: 60 + Math.random() * 80,
      speed: 0.15 + Math.random() * 0.25
    });
  }

  // Wave layers
  waves.length = 0;
  for (let i = 0; i < 3; i++) {
    waves.push({
      y: ch * (0.58 + i * 0.05),
      amp: 3 + i * 2,
      freq: 0.008 + i * 0.003,
      speed: 0.02 + i * 0.01,
      phase: i * 2,
      alpha: 0.25 - i * 0.06
    });
  }
}

// ---------- Game loop ----------
function startGameLoop() {
  if (!cakeGameActive) return;
  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (!cakeGameActive) return;
  gameTime = timestamp / 1000;
  update();
  draw();
  if (cakeGameActive) requestAnimationFrame(gameLoop);
}

function update() {
  // Move Lotso
  if (!cakeFound && (moveDir.x !== 0 || moveDir.y !== 0)) {
    lotso.x += moveDir.x * lotso.speed * dpr;
    lotso.y += moveDir.y * lotso.speed * dpr;
    if (moveDir.x !== 0) lotso.facing = moveDir.x > 0 ? 1 : -1;
    clampLotso();
  }

  // Idle / walking bob
  const bobSpeed = (moveDir.x !== 0 || moveDir.y !== 0) ? 12 : 4;
  lotso.bob = Math.sin(gameTime * bobSpeed) * 4 * dpr;

  // Celebration jump
  if (cakeFound) {
    lotso.jumpY = Math.abs(Math.sin(gameTime * 8)) * -22 * dpr;
  } else {
    lotso.jumpY = 0;
  }

  // Cake glow pulse
  cake.glow = 0.3 + Math.sin(gameTime * 3) * 0.15;
  if (cakeFound) cake.foundGlow = Math.min(cake.foundGlow + 0.04, 1);

  // Confetti
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.x += c.vx;
    c.y += c.vy;
    c.rot += c.vr;
    c.vy += 0.05 * dpr;
    if (c.y > ch + 20) confetti.splice(i, 1);
  }

  // Sparkles
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.life -= 0.015;
    s.y -= 0.4 * dpr;
    if (s.life <= 0) sparkles.splice(i, 1);
  }

  // Clouds
  clouds.forEach(cloud => {
    cloud.x += cloud.speed * dpr;
    if (cloud.x > cw + cloud.w) cloud.x = -cloud.w;
  });

  // Camera shake decay
  if (shake > 0) shake *= 0.92;
  if (shake < 0.3) shake = 0;

  if (!cakeFound) checkCakeFound();
}

function clampLotso() {
  const pad = 20 * dpr;
  lotso.x = Math.max(pad, Math.min(lotso.x, cw - lotso.width - pad));
  lotso.y = Math.max(pad, Math.min(lotso.y, ch - lotso.height - pad));
}

function checkCakeFound() {
  const dx = (lotso.x + lotso.width / 2) - (cake.x + cake.width / 2);
  const dy = (lotso.y + lotso.height / 2) - (cake.y + cake.height / 2);
  const dist = Math.hypot(dx, dy);
  if (dist < 70 * dpr) {
    foundCake();
  }
}

// ---------- Drawing ----------
function draw() {
  if (!ctx) return;
  ctx.save();

  // Camera shake
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  // Background image (beach photo)
  if (bgImg.complete && bgImg.naturalWidth) {
    drawCoverImage(bgImg, 0, 0, cw, ch);
  } else {
    // Fallback gradient
    const grd = ctx.createLinearGradient(0, 0, 0, ch);
    grd.addColorStop(0, '#ffdde1');
    grd.addColorStop(0.55, '#81d4fa');
    grd.addColorStop(1, '#ffecb3');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, cw, ch);
  }

  drawSun();
  drawClouds();
  drawWaves();
  drawCake();
  drawFriends();
  drawLotso();
  drawArrow();
  drawOverlay();
  drawConfetti();
  drawSparkles();

  ctx.restore();
}

function drawCoverImage(img, x, y, w, h) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let dw, dh, dx, dy;
  if (imgRatio > targetRatio) {
    dh = h;
    dw = dh * imgRatio;
    dx = x - (dw - w) / 2;
    dy = y;
  } else {
    dw = w;
    dh = dw / imgRatio;
    dx = x;
    dy = y - (dh - h) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawSun() {
  const x = cw * 0.78;
  const y = ch * 0.14;
  const r = 36 * dpr;
  const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 3);
  glow.addColorStop(0, 'rgba(255, 240, 200, 0.9)');
  glow.addColorStop(0.3, 'rgba(255, 220, 150, 0.35)');
  glow.addColorStop(1, 'rgba(255, 220, 150, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 250, 220, 0.95)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  clouds.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w * 0.5, c.w * 0.18, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + c.w * 0.25, c.y + c.w * 0.05, c.w * 0.35, c.w * 0.14, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - c.w * 0.25, c.y + c.w * 0.05, c.w * 0.3, c.w * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawWaves() {
  waves.forEach(w => {
    ctx.fillStyle = `rgba(255, 255, 255, ${w.alpha})`;
    ctx.beginPath();
    for (let x = 0; x <= cw; x += 8 * dpr) {
      const y = w.y + Math.sin(x * w.freq + gameTime * w.speed * 60 + w.phase) * w.amp * dpr;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(cw, ch);
    ctx.lineTo(0, ch);
    ctx.closePath();
    ctx.fill();
  });
}

function drawCake() {
  const x = cake.x;
  const y = cake.y;
  const w = cake.width;
  const h = cake.height;

  // Plate
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 4 * dpr, w * 0.65, 8 * dpr, 0, 0, Math.PI * 2);
  ctx.fill();

  // Base tier
  ctx.fillStyle = '#8d5524';
  roundRect(x, y + h * 0.35, w, h * 0.55, 8 * dpr);
  ctx.fill();

  // Frosting drip base
  ctx.fillStyle = '#ff99aa';
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.42);
  ctx.lineTo(x + w, y + h * 0.42);
  ctx.lineTo(x + w, y + h * 0.55);
  for (let i = 0; i < 5; i++) {
    const px = x + w - (i + 1) * (w / 5);
    ctx.lineTo(px + w / 10, y + h * 0.72);
    ctx.lineTo(px, y + h * 0.55);
  }
  ctx.lineTo(x, y + h * 0.55);
  ctx.closePath();
  ctx.fill();

  // Top tier
  ctx.fillStyle = '#a66a36';
  roundRect(x + w * 0.12, y + h * 0.1, w * 0.76, h * 0.35, 6 * dpr);
  ctx.fill();

  // Top frosting
  ctx.fillStyle = '#ffb3c1';
  roundRect(x + w * 0.08, y + h * 0.08, w * 0.84, h * 0.12, 6 * dpr);
  ctx.fill();

  // Candles
  const candleW = 4 * dpr;
  const candleH = 16 * dpr;
  const cx1 = x + w * 0.35;
  const cx2 = x + w * 0.65;
  const cy = y + h * 0.08 - candleH;
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx1 - candleW / 2, cy, candleW, candleH);
  ctx.fillRect(cx2 - candleW / 2, cy, candleW, candleH);

  // Flames
  drawFlame(cx1, cy, gameTime * 10);
  drawFlame(cx2, cy, gameTime * 12 + 1);

  // Glow when found
  if (cakeFound || cake.foundGlow > 0) {
    const glowR = (w * 1.2) * (0.8 + cake.foundGlow * 0.5);
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, w * 0.3, x + w / 2, y + h / 2, glowR);
    g.addColorStop(0, `rgba(255, 215, 0, ${0.4 + cake.foundGlow * 0.4})`);
    g.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, glowR, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlame(x, yBase, time) {
  const flicker = Math.sin(time) * 1.5 * dpr;
  ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
  ctx.beginPath();
  ctx.moveTo(x, yBase + flicker);
  ctx.quadraticCurveTo(x - 4 * dpr, yBase - 8 * dpr, x, yBase - 14 * dpr + flicker);
  ctx.quadraticCurveTo(x + 4 * dpr, yBase - 8 * dpr, x, yBase + flicker);
  ctx.fill();
}

function drawLotso() {
  if (!lotsoImg.complete || !lotsoImg.naturalWidth) return;
  const w = lotso.width * dpr;
  const h = lotso.height * dpr;
  const x = lotso.x;
  const y = lotso.y + lotso.bob + lotso.jumpY;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 4 * dpr, w * 0.45, 8 * dpr, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(lotso.facing * (w / lotsoImg.naturalWidth), h / lotsoImg.naturalHeight);
  ctx.drawImage(lotsoImg, -lotsoImg.naturalWidth / 2, -lotsoImg.naturalHeight / 2);
  ctx.restore();
}

function drawFriends() {
  if (!cakeFound && cake.foundGlow <= 0) return;
  const appear = cakeFound ? 1 : cake.foundGlow * 2;

  friends.forEach((f, i) => {
    const fx = f.x;
    const fy = f.y + Math.sin(gameTime * 6 + i) * 8 * dpr * (cakeFound ? 1 : 0);
    const s = f.scale * dpr * appear;
    const w = lotso.width * s;
    const h = lotso.height * s;

    // Shadow
    ctx.fillStyle = `rgba(0,0,0,${0.15 * appear})`;
    ctx.beginPath();
    ctx.ellipse(fx + w / 2, fy + h - 2 * dpr, w * 0.45, 6 * dpr, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = appear;
    ctx.filter = `hue-rotate(${f.hue}deg)`;
    ctx.translate(fx + w / 2, fy + h / 2);
    ctx.scale(f.flip * (w / lotsoImg.naturalWidth), h / lotsoImg.naturalHeight);
    ctx.drawImage(lotsoImg, -lotsoImg.naturalWidth / 2, -lotsoImg.naturalHeight / 2);
    ctx.restore();
  });
}

function drawArrow() {
  if (cakeFound) return;
  const lx = lotso.x + lotso.width * dpr / 2;
  const ly = lotso.y - 24 * dpr;
  const cx = cake.x + cake.width / 2;
  const cy = cake.y + cake.height / 2;
  const angle = Math.atan2(cy - ly, cx - lx);
  const len = 28 * dpr;
  const ax = lx + Math.cos(angle) * len;
  const ay = ly + Math.sin(angle) * len;

  ctx.strokeStyle = 'rgba(255, 77, 109, 0.9)';
  ctx.fillStyle = 'rgba(255, 77, 109, 0.9)';
  ctx.lineWidth = 4 * dpr;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(ax, ay);
  ctx.stroke();

  // Arrow head
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - 8 * dpr * Math.cos(angle - Math.PI / 6), ay - 8 * dpr * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(ax - 8 * dpr * Math.cos(angle + Math.PI / 6), ay - 8 * dpr * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawOverlay() {
  if (cakeFound && cake.foundGlow >= 1) return;
  const darkness = cakeFound ? 0.15 : 0.78;
  const alpha = cakeFound ? 0.15 : darkness;

  const lx = lotso.x + lotso.width * dpr / 2;
  const ly = lotso.y + lotso.height * dpr / 2;
  const r = (cakeFound ? 220 : 90) * dpr;

  const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 3);
  g.addColorStop(0, `rgba(30, 15, 25, 0)`);
  g.addColorStop(0.35, `rgba(30, 15, 25, ${alpha * 0.4})`);
  g.addColorStop(1, `rgba(30, 15, 25, ${alpha})`);

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cw, ch);
}

function drawConfetti() {
  confetti.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    ctx.globalAlpha = c.alpha;
    ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
    ctx.restore();
  });
}

function drawSparkles() {
  sparkles.forEach(s => {
    ctx.save();
    ctx.globalAlpha = s.life;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 10 * dpr;
    ctx.font = `${s.size}px serif`;
    ctx.fillText(s.symbol, s.x, s.y);
    ctx.restore();
  });
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// ---------- Effects ----------
function spawnConfetti(amount = 100) {
  const colors = ['#ff4d6d', '#ff8fab', '#ffb3c1', '#fff', '#ffccd5', '#c77dff', '#ffd700', '#87CEEB'];
  for (let i = 0; i < amount; i++) {
    confetti.push({
      x: Math.random() * cw,
      y: -Math.random() * ch * 0.5,
      vx: (Math.random() - 0.5) * 4 * dpr,
      vy: (2 + Math.random() * 4) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      size: (5 + Math.random() * 8) * dpr,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.8 + Math.random() * 0.2
    });
  }
}

function spawnSparkles(amount = 40) {
  const symbols = ['✨', '💖', '🎀', '⭐', '🍓', '💫'];
  for (let i = 0; i < amount; i++) {
    sparkles.push({
      x: cake.x + (Math.random() - 0.5) * cake.width * 3,
      y: cake.y + (Math.random() - 0.5) * cake.height * 2,
      size: (12 + Math.random() * 18) * dpr,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      life: 0.8 + Math.random() * 0.5
    });
  }
}

function foundCake() {
  if (cakeFound) return;
  cakeFound = true;

  if (dpad) dpad.classList.add('hidden');
  if (birthdayConsole) {
    birthdayConsole.classList.add('active');
    birthdayConsole.setAttribute('aria-hidden', 'false');
  }
  if (cakeHint) cakeHint.textContent = 'Yay! Dah sampai! Selamat Hari Lahir Sayang! 💕';

  vibrate([80, 60, 80, 60, 80]);
  shake = 14 * dpr;
  spawnConfetti(140);
  spawnSparkles(50);

  // Pause background music and play birthday song
  wasMusicPlaying = typeof musicStarted !== 'undefined' && musicStarted && !music.paused;
  if (wasMusicPlaying) music.pause();
  playHappyBirthdaySong();
}

function playHappyBirthdaySong() {
  if (!birthdaySong) return;
  birthdaySong.currentTime = 0;
  birthdaySong.volume = 0.85;
  birthdaySong.play().catch(() => {
    resumeBackgroundMusic();
  });
}

function resumeBackgroundMusic() {
  if (wasMusicPlaying && typeof musicStarted !== 'undefined' && musicStarted) {
    music.play().catch(() => {});
  }
}

function restartCakeGame() {
  if (birthdaySong) {
    birthdaySong.pause();
    birthdaySong.currentTime = 0;
  }
  resumeBackgroundMusic();

  cakeFound = false;
  moveDir = { x: 0, y: 0 };
  confetti.length = 0;
  sparkles.length = 0;

  if (dpad) dpad.classList.remove('hidden');
  if (birthdayConsole) {
    birthdayConsole.classList.remove('active');
    birthdayConsole.setAttribute('aria-hidden', 'true');
  }
  if (cakeHint) cakeHint.textContent = 'Sila jalan-jalan ikut je anak panah tu ye.';

  resizeCanvas();
}

// ---------- Controls ----------
function initCakeControls() {
  if (!dpad) return;
  const buttons = dpad.querySelectorAll('.dpad-btn');
  const dirs = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0]
  };

  buttons.forEach(btn => {
    const startMove = (e) => {
      e.preventDefault();
      if (cakeFound) return;
      const dir = dirs[btn.dataset.dir];
      moveDir.x = dir[0];
      moveDir.y = dir[1];
    };
    const stopMove = (e) => {
      e.preventDefault();
      moveDir.x = 0;
      moveDir.y = 0;
    };

    btn.addEventListener('pointerdown', startMove);
    btn.addEventListener('pointerup', stopMove);
    btn.addEventListener('pointerleave', stopMove);
    btn.addEventListener('pointercancel', stopMove);
    btn.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    btn.addEventListener('touchend', stopMove);
  });
}

// Keyboard
window.addEventListener('keydown', (e) => {
  if (!cakeGameActive || cakeFound) return;
  const map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  if (map[e.key]) {
    e.preventDefault();
    moveDir.x = map[e.key][0];
    moveDir.y = map[e.key][1];
  }
});

window.addEventListener('keyup', () => {
  moveDir.x = 0;
  moveDir.y = 0;
});

// Resize listener
window.addEventListener('resize', () => {
  if (!cakeGameActive) return;
  resizeCanvas();
});

// Start
window.addEventListener('DOMContentLoaded', () => {
  initCakeControls();
  if (birthdaySong) birthdaySong.addEventListener('ended', resumeBackgroundMusic);
  if (canvas) {
    resizeCanvas();
    imagesReady.then(() => {
      cakeGameActive = true;
      startGameLoop();
    });
  }
});
