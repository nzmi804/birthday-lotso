/* ==========================
   Lotso House Birthday Adventure
   ========================== */

const room = document.getElementById('room');
const canvas = document.getElementById('gameCanvas');
const cakeHint = document.getElementById('cakeHint');
const dpad = document.getElementById('dpad');
const birthdayConsole = document.getElementById('birthdayConsole');
const birthdaySong = document.getElementById('birthdaySong');
const dialogueBox = document.getElementById('dialogueBox');
const dialogueName = document.getElementById('dialogueName');
const dialogueText = document.getElementById('dialogueText');

let ctx = null;
let dpr = 1;
let cw = 0;
let ch = 0;

let cakeGameActive = false;
let cakeFound = false;
let gameTime = 0;
let wasMusicPlaying = false;

// Assets
const lotsoImg = new Image();
lotsoImg.src = 'assets/lotso.svg';

const imagesReady = Promise.all([
  new Promise(r => { lotsoImg.onload = r; lotsoImg.onerror = r; })
]);

// World dimensions
const FLOOR_COUNT = 3;
let FLOOR_H = 0;
let GAP = 0;
let WORLD_W = 0;
let WORLD_H = 0;
let STAIR_W = 0;
let ROOM_W = 0;

// Game objects
const lotso = {
  x: 0, y: 0,
  width: 64, height: 76,
  speed: 1.6,
  facing: 1,
  bob: 0,
  jumpY: 0
};

const camera = { x: 0, y: 0 };

let moveDir = { x: 0, y: 0 };

const walls = [];
const furniture = [];
const npcs = [];
let stairs = null;
let diningTable = null;
let cakeRevealed = false;

let confetti = [];
let sparkles = [];
let shake = 0;

// Resize canvas
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
  buildWorld();
}

function floorTop(floorIndex) {
  // floorIndex 0 = tingkat 1 (bottom), 2 = tingkat 3 (top)
  return GAP + (FLOOR_COUNT - 1 - floorIndex) * (FLOOR_H + GAP);
}

function buildWorld() {
  FLOOR_H = 540 * dpr;
  GAP = 36 * dpr;
  WORLD_W = cw;
  WORLD_H = FLOOR_COUNT * FLOOR_H + (FLOOR_COUNT + 1) * GAP;
  STAIR_W = 130 * dpr;
  ROOM_W = WORLD_W - STAIR_W;

  walls.length = 0;
  furniture.length = 0;
  npcs.length = 0;

  // Outer walls and floor separators
  for (let f = 0; f < FLOOR_COUNT; f++) {
    const top = floorTop(f);
    const bottom = top + FLOOR_H;
    // left wall
    walls.push({ x: 0, y: top, w: 12 * dpr, h: FLOOR_H });
    // right wall between room and stairs (only top & bottom segments, leaving door)
    const doorTop = top + 70 * dpr;
    const doorBottom = bottom - 70 * dpr;
    walls.push({ x: ROOM_W, y: top, w: 10 * dpr, h: doorTop - top }); // top segment
    walls.push({ x: ROOM_W, y: doorBottom, w: 10 * dpr, h: bottom - doorBottom }); // bottom segment
    // floor separator below (except bottom floor) — only across rooms, leave stairwell open
    if (f > 0) {
      walls.push({ x: 0, y: bottom, w: ROOM_W + 10 * dpr, h: GAP });
    }
  }

  // Stairwell walls (left side of stairs)
  walls.push({ x: ROOM_W, y: 0, w: 10 * dpr, h: WORLD_H });

  // Stairs bounds
  stairs = { x: ROOM_W + 15 * dpr, y: GAP, w: STAIR_W - 20 * dpr, h: WORLD_H - 2 * GAP };

  // Furniture & NPCs
  // ---- Tingkat 3 (top) — bedroom ----
  const f3 = floorTop(2);
  furniture.push({ type: 'bed', x: 40 * dpr, y: f3 + 80 * dpr, w: 160 * dpr, h: 200 * dpr, color: '#ffb3c1' });
  furniture.push({ type: 'wardrobe', x: ROOM_W - 140 * dpr, y: f3 + 60 * dpr, w: 100 * dpr, h: 170 * dpr, color: '#a1887f' });
  furniture.push({ type: 'rug', x: 60 * dpr, y: f3 + 320 * dpr, w: 180 * dpr, h: 120 * dpr, color: '#ffccd5' });
  npcs.push({
    name: 'Awak',
    x: ROOM_W * 0.55, y: f3 + 200 * dpr,
    color: '#ff4d6d',
    hair: '#5e2a35',
    dialogue: 'Lotso, kek birthday sayang ada atas meja makan di tingkat bawah. Tolong ambilkan ye! 💕'
  });

  // ---- Tingkat 2 — study / lounge ----
  const f2 = floorTop(1);
  furniture.push({ type: 'bookshelf', x: 30 * dpr, y: f2 + 60 * dpr, w: 90 * dpr, h: 220 * dpr, color: '#8d6e63' });
  furniture.push({ type: 'sofa', x: ROOM_W - 180 * dpr, y: f2 + 100 * dpr, w: 150 * dpr, h: 80 * dpr, color: '#ff8fab' });
  furniture.push({ type: 'tv', x: ROOM_W - 150 * dpr, y: f2 + 260 * dpr, w: 110 * dpr, h: 70 * dpr, color: '#5e2a35' });
  npcs.push({
    name: 'Mama Bear',
    x: ROOM_W * 0.3, y: f2 + 200 * dpr,
    color: '#fb6f92', hair: '#5e2a35',
    dialogue: 'Hati-hati turun tangga, Lotso. Jangan terbabas! 🧸'
  });
  npcs.push({
    name: 'Adik Bear',
    x: ROOM_W * 0.65, y: f2 + 360 * dpr,
    color: '#81d4fa', hair: '#5e2a35',
    dialogue: 'Aku dah bau kek dari bawah! Cepat Lotso! 🎂'
  });

  // ---- Tingkat 1 (bottom) — living / dining ----
  const f1 = floorTop(0);
  furniture.push({ type: 'sofa', x: 40 * dpr, y: f1 + 80 * dpr, w: 170 * dpr, h: 90 * dpr, color: '#ff99aa' });
  furniture.push({ type: 'plant', x: 230 * dpr, y: f1 + 80 * dpr, w: 60 * dpr, h: 90 * dpr, color: '#66bb6a' });
  furniture.push({ type: 'tv', x: 60 * dpr, y: f1 + 260 * dpr, w: 120 * dpr, h: 80 * dpr, color: '#5e2a35' });

  diningTable = { x: ROOM_W - 170 * dpr, y: f1 + 260 * dpr, w: 150 * dpr, h: 90 * dpr };
  furniture.push({ type: 'table', ...diningTable, color: '#d7ccc8' });

  npcs.push({
    name: 'Papa Bear',
    x: ROOM_W * 0.25, y: f1 + 380 * dpr,
    color: '#4fc3f7', hair: '#5e2a35',
    dialogue: 'Meja makan tu kat sebelah kanan, Lotso. Cepat pergi! 🍽️'
  });
  npcs.push({
    name: 'Nenek Bear',
    x: ROOM_W * 0.72, y: f1 + 180 * dpr,
    color: '#ce93d8', hair: '#7a3d4d',
    dialogue: 'Surprise! Kek tu dah siap menunggu atas meja makan. 🎉'
  });

  // Lotso starts on tingkat 3 (top floor)
  lotso.x = ROOM_W * 0.45;
  lotso.y = f3 + 360 * dpr;
  lotso.facing = 1;
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
  if (!cakeFound) {
    // Try move
    let dx = moveDir.x * lotso.speed * dpr;
    let dy = moveDir.y * lotso.speed * dpr;

    if (dx !== 0 || dy !== 0) {
      if (dx !== 0) lotso.facing = dx > 0 ? 1 : -1;

      // Move X and resolve collisions
      lotso.x += dx;
      resolveCollision('x');
      // Move Y and resolve collisions
      lotso.y += dy;
      resolveCollision('y');

      // Keep inside world
      lotso.x = Math.max(12 * dpr, Math.min(lotso.x, WORLD_W - lotso.width - 12 * dpr));
      lotso.y = Math.max(12 * dpr, Math.min(lotso.y, WORLD_H - lotso.height - 12 * dpr));
    }
  }

  // Bobbing
  const moving = moveDir.x !== 0 || moveDir.y !== 0;
  lotso.bob = Math.sin(gameTime * (moving ? 10 : 3)) * 3 * dpr;

  // Celebration jump
  if (cakeFound) {
    lotso.jumpY = Math.abs(Math.sin(gameTime * 8)) * -18 * dpr;
  } else {
    lotso.jumpY = 0;
  }

  // Camera follow with smoothing
  const targetCamX = 0; // world is as wide as screen, no horizontal scroll
  const targetCamY = lotso.y + lotso.height / 2 - ch / 2;
  camera.x += (targetCamX - camera.x) * 0.12;
  camera.y += (targetCamY - camera.y) * 0.12;
  camera.y = Math.max(0, Math.min(camera.y, WORLD_H - ch));

  // NPC dialogue
  updateDialogue();

  // Confetti & sparkles
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.x += c.vx;
    c.y += c.vy;
    c.rot += c.vr;
    c.vy += 0.05 * dpr;
    if (c.y > camera.y + ch + 30) confetti.splice(i, 1);
  }
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.life -= 0.015;
    s.y -= 0.4 * dpr;
    if (s.life <= 0) sparkles.splice(i, 1);
  }

  // Camera shake decay
  if (shake > 0) shake *= 0.92;
  if (shake < 0.3) shake = 0;

  if (!cakeFound && !cakeRevealed) checkCakeFound();
}

function resolveCollision(axis) {
  const lotsoRect = { x: lotso.x, y: lotso.y, w: lotso.width * dpr, h: lotso.height * dpr };
  for (const w of walls) {
    if (rectIntersect(lotsoRect, w)) {
      if (axis === 'x') {
        if (lotso.x < w.x) lotso.x = w.x - lotsoRect.w;
        else lotso.x = w.x + w.w;
      } else {
        if (lotso.y < w.y) lotso.y = w.y - lotsoRect.h;
        else lotso.y = w.y + w.h;
      }
    }
  }
  for (const f of furniture) {
    if (rectIntersect(lotsoRect, { x: f.x, y: f.y, w: f.w, h: f.h })) {
      if (axis === 'x') {
        if (lotso.x < f.x) lotso.x = f.x - lotsoRect.w;
        else lotso.x = f.x + f.w;
      } else {
        if (lotso.y < f.y) lotso.y = f.y - lotsoRect.h;
        else lotso.y = f.y + f.h;
      }
    }
  }
}

function rectIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function currentFloor() {
  for (let f = 0; f < FLOOR_COUNT; f++) {
    const top = floorTop(f);
    if (lotso.y >= top && lotso.y < top + FLOOR_H) return f;
  }
  return 0;
}

function updateDialogue() {
  let activeNpc = null;
  for (const npc of npcs) {
    const dx = (lotso.x + lotso.width * dpr / 2) - npc.x;
    const dy = (lotso.y + lotso.height * dpr / 2) - npc.y;
    if (Math.hypot(dx, dy) < 85 * dpr) {
      activeNpc = npc;
      break;
    }
  }

  if (activeNpc) {
    dialogueName.textContent = activeNpc.name;
    dialogueText.textContent = activeNpc.dialogue;
    dialogueBox.classList.add('active');
    dialogueBox.setAttribute('aria-hidden', 'false');
  } else {
    dialogueBox.classList.remove('active');
    dialogueBox.setAttribute('aria-hidden', 'true');
  }
}

function checkCakeFound() {
  if (!diningTable) return;
  const cx = lotso.x + lotso.width * dpr / 2;
  const cy = lotso.y + lotso.height * dpr / 2;
  const tx = diningTable.x + diningTable.w / 2;
  const ty = diningTable.y + diningTable.h / 2;
  if (Math.hypot(cx - tx, cy - ty) < 90 * dpr) {
    cakeRevealed = true;
    foundCake();
  }
}

// ---------- Drawing ----------
function draw() {
  if (!ctx) return;
  ctx.save();

  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  // Clear
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 0, cw, ch);

  // Apply camera
  ctx.translate(-camera.x, -camera.y);

  drawHouse();
  drawStairs();
  drawFurniture();
  drawNPCs();
  drawDiningCake();
  drawLotso();
  drawFloorLabels();
  drawConfetti();
  drawSparkles();

  ctx.restore();
}

function drawHouse() {
  for (let f = 0; f < FLOOR_COUNT; f++) {
    const top = floorTop(f);

    // Floor background
    const grd = ctx.createLinearGradient(0, top, 0, top + FLOOR_H);
    if (f === 2) { // bedroom
      grd.addColorStop(0, '#fff0f3');
      grd.addColorStop(1, '#ffe6ec');
    } else if (f === 1) { // lounge
      grd.addColorStop(0, '#fff5f7');
      grd.addColorStop(1, '#ffdee6');
    } else { // dining/living
      grd.addColorStop(0, '#fff8fa');
      grd.addColorStop(1, '#ffdce4');
    }
    ctx.fillStyle = grd;
    ctx.fillRect(0, top, WORLD_W, FLOOR_H);

    // Floor wood pattern
    ctx.strokeStyle = 'rgba(141, 110, 99, 0.08)';
    ctx.lineWidth = 2 * dpr;
    for (let i = 0; i < FLOOR_H; i += 40 * dpr) {
      ctx.beginPath();
      ctx.moveTo(0, top + i);
      ctx.lineTo(ROOM_W, top + i);
      ctx.stroke();
    }
  }

  // Walls
  ctx.fillStyle = '#6d4c41';
  for (const w of walls) {
    ctx.fillRect(w.x, w.y, w.w, w.h);
  }

  // Wall shadows
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (const w of walls) {
    ctx.fillRect(w.x + w.w, w.y, 6 * dpr, w.h);
    ctx.fillRect(w.x, w.y + w.h, w.w, 6 * dpr);
  }
}

function drawStairs() {
  if (!stairs) return;
  // Stairwell background
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(stairs.x, stairs.y, stairs.w, stairs.h);

  // Steps
  const stepH = 28 * dpr;
  const stepCount = Math.ceil(stairs.h / stepH);
  for (let i = 0; i < stepCount; i++) {
    const y = stairs.y + i * stepH;
    ctx.fillStyle = i % 2 === 0 ? '#8d6e63' : '#795548';
    ctx.fillRect(stairs.x, y, stairs.w, stepH);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(stairs.x, y + stepH);
    ctx.lineTo(stairs.x + stairs.w, y + stepH);
    ctx.stroke();
  }

  // Handrail
  ctx.strokeStyle = '#d7ccc8';
  ctx.lineWidth = 6 * dpr;
  ctx.beginPath();
  ctx.moveTo(stairs.x + 10 * dpr, stairs.y);
  ctx.lineTo(stairs.x + 10 * dpr, stairs.y + stairs.h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(stairs.x + stairs.w - 10 * dpr, stairs.y);
  ctx.lineTo(stairs.x + stairs.w - 10 * dpr, stairs.y + stairs.h);
  ctx.stroke();
}

function drawFurniture() {
  for (const f of furniture) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(f.x + 6 * dpr, f.y + 6 * dpr, f.w, f.h);

    // Body
    ctx.fillStyle = f.color;
    roundRect(f.x, f.y, f.w, f.h, 8 * dpr);
    ctx.fill();

    // Detail based on type
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    if (f.type === 'bed') {
      ctx.fillRect(f.x + 10 * dpr, f.y + 10 * dpr, f.w - 20 * dpr, f.h * 0.35);
      ctx.fillStyle = '#fff';
      ctx.fillRect(f.x + 15 * dpr, f.y + 18 * dpr, f.w * 0.3, f.h * 0.18);
      ctx.fillRect(f.x + f.w - f.w * 0.3 - 15 * dpr, f.y + 18 * dpr, f.w * 0.3, f.h * 0.18);
    } else if (f.type === 'sofa') {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(f.x + 10 * dpr, f.y + f.h - 20 * dpr, f.w - 20 * dpr, 14 * dpr);
    } else if (f.type === 'bookshelf') {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      for (let i = 1; i <= 4; i++) {
        ctx.fillRect(f.x + 8 * dpr, f.y + i * (f.h / 5), f.w - 16 * dpr, 4 * dpr);
      }
    } else if (f.type === 'tv') {
      ctx.fillStyle = '#263238';
      ctx.fillRect(f.x + 10 * dpr, f.y + 10 * dpr, f.w - 20 * dpr, f.h - 20 * dpr);
    } else if (f.type === 'plant') {
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h * 0.35, f.w * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#795548';
      ctx.fillRect(f.x + f.w * 0.35, f.y + f.h * 0.55, f.w * 0.3, f.h * 0.45);
    } else if (f.type === 'table') {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(f.x + 10 * dpr, f.y + 10 * dpr, f.w - 20 * dpr, f.h - 20 * dpr);
    }
  }
}

function drawDiningCake() {
  if (!cakeRevealed || !diningTable) return;
  const cx = diningTable.x + diningTable.w / 2;
  const cy = diningTable.y - 30 * dpr;
  const w = 60 * dpr;
  const h = 55 * dpr;

  // Glow
  const g = ctx.createRadialGradient(cx, cy, w * 0.3, cx, cy, w * 1.6);
  g.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
  g.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Plate
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.45, w * 0.7, 8 * dpr, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cake tiers
  ctx.fillStyle = '#8d5524';
  roundRect(cx - w * 0.5, cy, w, h * 0.55, 6 * dpr);
  ctx.fill();
  ctx.fillStyle = '#ff99aa';
  roundRect(cx - w * 0.45, cy - h * 0.05, w * 0.9, h * 0.2, 5 * dpr);
  ctx.fill();
  ctx.fillStyle = '#a66a36';
  roundRect(cx - w * 0.35, cy - h * 0.45, w * 0.7, h * 0.45, 5 * dpr);
  ctx.fill();

  // Candles
  const candleW = 4 * dpr;
  const candleH = 14 * dpr;
  [-w * 0.15, w * 0.15].forEach(off => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx + off - candleW / 2, cy - h * 0.45 - candleH, candleW, candleH);
    // flame
    const flicker = Math.sin(gameTime * 12 + off) * 1.5 * dpr;
    ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
    ctx.beginPath();
    ctx.moveTo(cx + off, cy - h * 0.45 - candleH + flicker);
    ctx.quadraticCurveTo(cx + off - 4 * dpr, cy - h * 0.45 - candleH - 8 * dpr, cx + off, cy - h * 0.45 - candleH - 14 * dpr + flicker);
    ctx.quadraticCurveTo(cx + off + 4 * dpr, cy - h * 0.45 - candleH - 8 * dpr, cx + off, cy - h * 0.45 - candleH + flicker);
    ctx.fill();
  });
}

function drawNPCs() {
  for (const npc of npcs) {
    drawPerson(npc.x, npc.y, npc.color, npc.hair);
  }
}

function drawPerson(x, y, bodyColor, hairColor) {
  const scale = dpr;
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(x, y + 32 * scale, 18 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(x, y + 10 * scale, 18 * scale, 22 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#ffe0bd';
  ctx.beginPath();
  ctx.arc(x, y - 16 * scale, 14 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.arc(x, y - 20 * scale, 15 * scale, Math.PI, 0);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#3e2723';
  ctx.beginPath();
  ctx.arc(x - 5 * scale, y - 16 * scale, 2 * scale, 0, Math.PI * 2);
  ctx.arc(x + 5 * scale, y - 16 * scale, 2 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.arc(x, y - 13 * scale, 5 * scale, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawLotso() {
  if (!lotsoImg.complete || !lotsoImg.naturalWidth) return;
  const w = lotso.width * dpr;
  const h = lotso.height * dpr;
  const x = lotso.x;
  const y = lotso.y + lotso.bob + lotso.jumpY;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 3 * dpr, w * 0.42, 7 * dpr, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(lotso.facing * (w / lotsoImg.naturalWidth), h / lotsoImg.naturalHeight);
  ctx.drawImage(lotsoImg, -lotsoImg.naturalWidth / 2, -lotsoImg.naturalHeight / 2);
  ctx.restore();
}

function drawFloorLabels() {
  ctx.font = `bold ${18 * dpr}px Quicksand, sans-serif`;
  ctx.fillStyle = 'rgba(93, 64, 55, 0.25)';
  for (let f = 0; f < FLOOR_COUNT; f++) {
    const top = floorTop(f);
    const label = f === 2 ? 'Tingkat 3' : f === 1 ? 'Tingkat 2' : 'Tingkat 1';
    ctx.fillText(label, 18 * dpr, top + 30 * dpr);
  }
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
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
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
function spawnConfetti(amount = 120) {
  const colors = ['#ff4d6d', '#ff8fab', '#ffb3c1', '#fff', '#ffccd5', '#c77dff', '#ffd700'];
  for (let i = 0; i < amount; i++) {
    confetti.push({
      x: lotso.x + (Math.random() - 0.5) * cw,
      y: lotso.y - Math.random() * ch * 0.4,
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
      x: lotso.x + (Math.random() - 0.5) * cw,
      y: lotso.y + (Math.random() - 0.5) * ch * 0.4,
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
  if (dialogueBox) dialogueBox.classList.remove('active');
  if (cakeHint) cakeHint.textContent = 'Yay! Jumpa kek! Selamat Hari Lahir Sayang! 💕';

  vibrate([80, 60, 80, 60, 80]);
  shake = 14 * dpr;
  spawnConfetti(140);
  spawnSparkles(50);

  wasMusicPlaying = typeof musicStarted !== 'undefined' && musicStarted && !music.paused;
  if (wasMusicPlaying) music.pause();
  playHappyBirthdaySong();
}

function playHappyBirthdaySong() {
  if (!birthdaySong) return;
  birthdaySong.currentTime = 0;
  birthdaySong.volume = 0.85;
  birthdaySong.play().catch(() => resumeBackgroundMusic());
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
  cakeRevealed = false;
  moveDir = { x: 0, y: 0 };
  confetti = [];
  sparkles = [];

  if (dpad) dpad.classList.remove('hidden');
  if (birthdayConsole) {
    birthdayConsole.classList.remove('active');
    birthdayConsole.setAttribute('aria-hidden', 'true');
  }
  if (dialogueBox) dialogueBox.classList.remove('active');
  if (cakeHint) cakeHint.textContent = 'Sila jalan-jalan ikut je anak panah tu ye.';

  buildWorld();
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
