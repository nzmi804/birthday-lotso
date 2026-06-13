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

const lotsoImg = new Image();
lotsoImg.src = 'assets/lotso.svg';

const imagesReady = Promise.all([
  new Promise(r => { lotsoImg.onload = r; lotsoImg.onerror = r; })
]);

// World dimensions
const FLOOR_COUNT = 3;
let ROOM_W = 0;
let CORRIDOR_W = 0;
let WORLD_W = 0;
let FLOOR_H = 0;
let GAP = 0;
let WORLD_H = 0;
let WALL_THICK = 0;

// Game objects
const lotso = { x: 0, y: 0, width: 56, height: 68, speed: 1.6, facing: 1, bob: 0, jumpY: 0 };
const camera = { x: 0, y: 0 };
let moveDir = { x: 0, y: 0 };

const walls = [];
const doors = [];
const furniture = [];
const npcs = [];
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
  return GAP + (FLOOR_COUNT - 1 - floorIndex) * (FLOOR_H + GAP);
}

function buildWorld() {
  ROOM_W = 255 * dpr;
  CORRIDOR_W = 105 * dpr;
  WORLD_W = ROOM_W * 2 + CORRIDOR_W;
  FLOOR_H = 460 * dpr;
  GAP = 28 * dpr;
  WALL_THICK = 12 * dpr;
  WORLD_H = FLOOR_COUNT * FLOOR_H + (FLOOR_COUNT + 1) * GAP;

  walls.length = 0;
  doors.length = 0;
  furniture.length = 0;
  npcs.length = 0;

  for (let f = 0; f < FLOOR_COUNT; f++) {
    const top = floorTop(f);
    const bottom = top + FLOOR_H;
    const isDiningFloor = (f === 0);

    // Left & right outer walls
    walls.push({ x: 0, y: top, w: WALL_THICK, h: FLOOR_H });
    walls.push({ x: WORLD_W - WALL_THICK, y: top, w: WALL_THICK, h: FLOOR_H });

    // Floor ceiling / separator (with corridor gap)
    if (f < FLOOR_COUNT - 1) {
      // separator below this floor (gap for stairs)
      const sepY = bottom;
      walls.push({ x: 0, y: sepY, w: ROOM_W - 10 * dpr, h: GAP }); // left room floor
      walls.push({ x: WORLD_W - ROOM_W + 10 * dpr, y: sepY, w: ROOM_W - 10 * dpr, h: GAP }); // right room floor
      // corridor gap stays open
    }

    // Top & bottom walls of each floor (only outer edges)
    if (f === FLOOR_COUNT - 1) {
      walls.push({ x: 0, y: top - GAP, w: WORLD_W, h: GAP });
    }
    if (f === 0) {
      walls.push({ x: 0, y: bottom, w: WORLD_W, h: GAP });
    }

    if (!isDiningFloor) {
      // Wall between left room and corridor
      addWallWithDoor(ROOM_W, top, WALL_THICK, FLOOR_H, 'left-corridor');
      // Wall between corridor and right room
      addWallWithDoor(ROOM_W + CORRIDOR_W - WALL_THICK, top, WALL_THICK, FLOOR_H, 'corridor-right');
    }
  }

  // Stairs bounds (full height corridor)
  const stairsX = ROOM_W + 18 * dpr;
  const stairsW = CORRIDOR_W - 36 * dpr;

  // ---- Tingkat 3 ----
  const f3 = floorTop(2);
  // Left bedroom
  furniture.push({ type: 'bed', x: 30 * dpr, y: f3 + 70 * dpr, w: 150 * dpr, h: 190 * dpr, color: '#ffb3c1' });
  furniture.push({ type: 'wardrobe', x: 30 * dpr, y: f3 + 290 * dpr, w: 90 * dpr, h: 130 * dpr, color: '#a1887f' });
  npcs.push({ name: 'Awak', x: ROOM_W * 0.55, y: f3 + 220 * dpr, color: '#ff4d6d', hair: '#5e2a35',
    dialogue: 'Lotso, kek birthday sayang ada atas meja makan di tingkat bawah. Tolong ambilkan ye! 💕' });

  // Right bathroom
  furniture.push({ type: 'bathtub', x: ROOM_W + CORRIDOR_W + 30 * dpr, y: f3 + 80 * dpr, w: 130 * dpr, h: 180 * dpr, color: '#b3e5fc' });
  furniture.push({ type: 'sink', x: ROOM_W + CORRIDOR_W + 150 * dpr, y: f3 + 300 * dpr, w: 70 * dpr, h: 60 * dpr, color: '#fff' });
  npcs.push({ name: 'Mama Bear', x: WORLD_W - ROOM_W * 0.45, y: f3 + 240 * dpr, color: '#fb6f92', hair: '#5e2a35',
    dialogue: 'Hati-hati turun tangga, Lotso. Jangan terbabas! 🧸' });

  // ---- Tingkat 2 ----
  const f2 = floorTop(1);
  // Left study
  furniture.push({ type: 'bookshelf', x: 25 * dpr, y: f2 + 60 * dpr, w: 80 * dpr, h: 200 * dpr, color: '#8d6e63' });
  furniture.push({ type: 'desk', x: 30 * dpr, y: f2 + 300 * dpr, w: 140 * dpr, h: 70 * dpr, color: '#bcaaa4' });
  npcs.push({ name: 'Papa Bear', x: ROOM_W * 0.5, y: f2 + 200 * dpr, color: '#4fc3f7', hair: '#5e2a35',
    dialogue: 'Meja makan tu kat tingkat bawah, Lotso. Teruskan pergi! 🍽️' });

  // Right guest room
  furniture.push({ type: 'bed-small', x: WORLD_W - 190 * dpr, y: f2 + 80 * dpr, w: 140 * dpr, h: 170 * dpr, color: '#ce93d8' });
  furniture.push({ type: 'toybox', x: WORLD_W - 110 * dpr, y: f2 + 290 * dpr, w: 80 * dpr, h: 70 * dpr, color: '#ffcc80' });
  npcs.push({ name: 'Adik Bear', x: WORLD_W - ROOM_W * 0.45, y: f2 + 240 * dpr, color: '#81d4fa', hair: '#5e2a35',
    dialogue: 'Aku dah bau kek dari bawah! Cepat Lotso! 🎂' });

  // ---- Tingkat 1 (full dining room) ----
  const f1 = floorTop(0);
  furniture.push({ type: 'cabinet', x: 40 * dpr, y: f1 + 70 * dpr, w: 120 * dpr, h: 70 * dpr, color: '#a1887f' });
  furniture.push({ type: 'fridge', x: 40 * dpr, y: f1 + 160 * dpr, w: 70 * dpr, h: 130 * dpr, color: '#e3f2fd' });

  diningTable = { x: WORLD_W * 0.55, y: f1 + 260 * dpr, w: 170 * dpr, h: 100 * dpr };
  furniture.push({ type: 'table', ...diningTable, color: '#d7ccc8' });
  furniture.push({ type: 'chair', x: diningTable.x - 40 * dpr, y: diningTable.y + 20 * dpr, w: 35 * dpr, h: 40 * dpr, color: '#8d6e63' });
  furniture.push({ type: 'chair', x: diningTable.x + diningTable.w + 5 * dpr, y: diningTable.y + 20 * dpr, w: 35 * dpr, h: 40 * dpr, color: '#8d6e63' });

  npcs.push({ name: 'Nenek Bear', x: WORLD_W * 0.25, y: f1 + 360 * dpr, color: '#ce93d8', hair: '#7a3d4d',
    dialogue: 'Surprise! Kek tu dah siap menunggu atas meja makan. 🎉' });

  // Lotso starts in bedroom (tingkat 3 left)
  lotso.x = ROOM_W * 0.35;
  lotso.y = f3 + 330 * dpr;
  lotso.facing = 1;
}

function addWallWithDoor(x, y, w, h, side) {
  const doorTop = y + h * 0.32;
  const doorBottom = y + h * 0.68;
  // Top segment
  walls.push({ x, y, w, h: doorTop - y });
  // Bottom segment
  walls.push({ x, y: doorBottom, w, h: y + h - doorBottom });
  // Record door for drawing
  doors.push({ x, y: doorTop, w, h: doorBottom - doorTop, side });
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
    let dx = moveDir.x * lotso.speed * dpr;
    let dy = moveDir.y * lotso.speed * dpr;
    if (dx !== 0 || dy !== 0) {
      if (dx !== 0) lotso.facing = dx > 0 ? 1 : -1;
      lotso.x += dx;
      resolveCollision('x');
      lotso.y += dy;
      resolveCollision('y');
      lotso.x = Math.max(WALL_THICK, Math.min(lotso.x, WORLD_W - lotso.width * dpr - WALL_THICK));
      lotso.y = Math.max(WALL_THICK, Math.min(lotso.y, WORLD_H - lotso.height * dpr - WALL_THICK));
    }
  }

  const moving = moveDir.x !== 0 || moveDir.y !== 0;
  lotso.bob = Math.sin(gameTime * (moving ? 10 : 3)) * 3 * dpr;
  lotso.jumpY = cakeFound ? Math.abs(Math.sin(gameTime * 8)) * -18 * dpr : 0;

  // Camera follow
  const targetX = lotso.x + lotso.width * dpr / 2 - cw / 2;
  const targetY = lotso.y + lotso.height * dpr / 2 - ch / 2;
  camera.x += (targetX - camera.x) * 0.1;
  camera.y += (targetY - camera.y) * 0.1;
  camera.x = Math.max(0, Math.min(camera.x, WORLD_W - cw));
  camera.y = Math.max(0, Math.min(camera.y, WORLD_H - ch));

  updateDialogue();

  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.x += c.vx; c.y += c.vy; c.rot += c.vr; c.vy += 0.05 * dpr;
    if (c.y > camera.y + ch + 30) confetti.splice(i, 1);
  }
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.life -= 0.015; s.y -= 0.4 * dpr;
    if (s.life <= 0) sparkles.splice(i, 1);
  }

  if (shake > 0) shake *= 0.92;
  if (shake < 0.3) shake = 0;

  if (!cakeFound && !cakeRevealed) checkCakeFound();
}

function resolveCollision(axis) {
  const r = { x: lotso.x, y: lotso.y, w: lotso.width * dpr, h: lotso.height * dpr };
  for (const w of walls) {
    if (rectIntersect(r, w)) {
      if (axis === 'x') {
        lotso.x = lotso.x < w.x ? w.x - r.w : w.x + w.w;
      } else {
        lotso.y = lotso.y < w.y ? w.y - r.h : w.y + w.h;
      }
    }
  }
  for (const f of furniture) {
    if (rectIntersect(r, { x: f.x, y: f.y, w: f.w, h: f.h })) {
      if (axis === 'x') {
        lotso.x = lotso.x < f.x ? f.x - r.w : f.x + f.w;
      } else {
        lotso.y = lotso.y < f.y ? f.y - r.h : f.y + f.h;
      }
    }
  }
}

function rectIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updateDialogue() {
  let active = null;
  const cx = lotso.x + lotso.width * dpr / 2;
  const cy = lotso.y + lotso.height * dpr / 2;
  for (const npc of npcs) {
    if (Math.hypot(cx - npc.x, cy - npc.y) < 80 * dpr) {
      active = npc;
      break;
    }
  }
  if (active) {
    dialogueName.textContent = active.name;
    dialogueText.textContent = active.dialogue;
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
  if (Math.hypot(cx - tx, cy - ty) < 95 * dpr) {
    cakeRevealed = true;
    foundCake();
  }
}

// ---------- Drawing ----------
function draw() {
  if (!ctx) return;
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 0, cw, ch);
  ctx.translate(-camera.x, -camera.y);

  drawFloors();
  drawStairs();
  drawDoors();
  drawFurniture();
  drawNPCs();
  drawDiningCake();
  drawLotso();
  drawFloorLabels();
  drawConfetti();
  drawSparkles();

  ctx.restore();
}

function drawFloors() {
  for (let f = 0; f < FLOOR_COUNT; f++) {
    const top = floorTop(f);
    const colors = ['#fff8fa', '#fff0f3', '#fff5f7'];
    const grd = ctx.createLinearGradient(0, top, 0, top + FLOOR_H);
    grd.addColorStop(0, colors[f]);
    grd.addColorStop(1, '#ffe6ec');
    ctx.fillStyle = grd;
    ctx.fillRect(WALL_THICK, top + WALL_THICK, WORLD_W - WALL_THICK * 2, FLOOR_H - WALL_THICK * 2);

    // Floor planks
    ctx.strokeStyle = 'rgba(141, 110, 99, 0.07)';
    ctx.lineWidth = 2 * dpr;
    for (let i = 0; i < FLOOR_H; i += 38 * dpr) {
      ctx.beginPath();
      ctx.moveTo(WALL_THICK, top + i);
      ctx.lineTo(WORLD_W - WALL_THICK, top + i);
      ctx.stroke();
    }
  }

  // Walls
  ctx.fillStyle = '#6d4c41';
  for (const w of walls) {
    ctx.fillRect(w.x, w.y, w.w, w.h);
  }
  // Wall shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (const w of walls) {
    ctx.fillRect(w.x + w.w, w.y, 5 * dpr, w.h);
    ctx.fillRect(w.x, w.y + w.h, w.w, 5 * dpr);
  }
}

function drawStairs() {
  const sx = ROOM_W + 20 * dpr;
  const sw = CORRIDOR_W - 40 * dpr;
  const sh = WORLD_H - 2 * GAP;
  const stepH = 26 * dpr;
  const count = Math.ceil(sh / stepH);

  ctx.fillStyle = '#5d4037';
  ctx.fillRect(sx, GAP, sw, sh);
  for (let i = 0; i < count; i++) {
    const y = GAP + i * stepH;
    ctx.fillStyle = i % 2 === 0 ? '#8d6e63' : '#795548';
    ctx.fillRect(sx, y, sw, stepH);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(sx, y + stepH);
    ctx.lineTo(sx + sw, y + stepH);
    ctx.stroke();
  }
  // Rails
  ctx.strokeStyle = '#d7ccc8';
  ctx.lineWidth = 5 * dpr;
  ctx.beginPath(); ctx.moveTo(sx + 8 * dpr, GAP); ctx.lineTo(sx + 8 * dpr, GAP + sh); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx + sw - 8 * dpr, GAP); ctx.lineTo(sx + sw - 8 * dpr, GAP + sh); ctx.stroke();
}

function drawDoors() {
  ctx.fillStyle = '#8d6e63';
  for (const d of doors) {
    // Frame top & bottom
    ctx.fillRect(d.x - 2 * dpr, d.y - 6 * dpr, d.w + 4 * dpr, 6 * dpr);
    ctx.fillRect(d.x - 2 * dpr, d.y + d.h, d.w + 4 * dpr, 6 * dpr);
    // Side frames
    ctx.fillRect(d.x - 4 * dpr, d.y, 4 * dpr, d.h);
    ctx.fillRect(d.x + d.w, d.y, 4 * dpr, d.h);
    // Open dark inside
    ctx.fillStyle = 'rgba(40, 25, 20, 0.35)';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = '#8d6e63';
  }
}

function drawFurniture() {
  for (const f of furniture) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(f.x + 5 * dpr, f.y + 5 * dpr, f.w, f.h);
    ctx.fillStyle = f.color;
    roundRect(f.x, f.y, f.w, f.h, 6 * dpr);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    if (f.type === 'bed' || f.type === 'bed-small') {
      ctx.fillRect(f.x + 8 * dpr, f.y + 8 * dpr, f.w - 16 * dpr, f.h * 0.35);
      ctx.fillStyle = '#fff';
      ctx.fillRect(f.x + 12 * dpr, f.y + 14 * dpr, f.w * 0.25, f.h * 0.18);
      ctx.fillRect(f.x + f.w - f.w * 0.25 - 12 * dpr, f.y + 14 * dpr, f.w * 0.25, f.h * 0.18);
    } else if (f.type === 'bathtub') {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(f.x + f.w / 2, f.y + f.h * 0.4, f.w * 0.35, f.h * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type === 'sink') {
      ctx.fillStyle = '#b3e5fc';
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h * 0.45, f.w * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type === 'bookshelf') {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let i = 1; i <= 4; i++) {
        ctx.fillRect(f.x + 6 * dpr, f.y + i * (f.h / 5), f.w - 12 * dpr, 3 * dpr);
      }
    } else if (f.type === 'desk') {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(f.x + 8 * dpr, f.y + f.h - 15 * dpr, f.w - 16 * dpr, 10 * dpr);
    } else if (f.type === 'toybox') {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(f.x + 8 * dpr, f.y + 12 * dpr, f.w - 16 * dpr, 8 * dpr);
    } else if (f.type === 'tv') {
      ctx.fillStyle = '#263238';
      ctx.fillRect(f.x + 8 * dpr, f.y + 8 * dpr, f.w - 16 * dpr, f.h - 16 * dpr);
    } else if (f.type === 'cabinet') {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(f.x + 8 * dpr, f.y + f.h * 0.45, f.w - 16 * dpr, 4 * dpr);
    } else if (f.type === 'fridge') {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(f.x + 8 * dpr, f.y + f.h * 0.35, f.w - 16 * dpr, 4 * dpr);
    } else if (f.type === 'table') {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(f.x + 8 * dpr, f.y + 8 * dpr, f.w - 16 * dpr, f.h - 16 * dpr);
    } else if (f.type === 'chair') {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(f.x + 5 * dpr, f.y + 5 * dpr, f.w - 10 * dpr, f.h - 10 * dpr);
    }
  }
}

function drawDiningCake() {
  if (!cakeRevealed || !diningTable) return;
  const cx = diningTable.x + diningTable.w / 2;
  const cy = diningTable.y - 28 * dpr;
  const w = 58 * dpr;
  const h = 52 * dpr;

  const g = ctx.createRadialGradient(cx, cy, w * 0.3, cx, cy, w * 1.5);
  g.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
  g.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, w * 1.5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.ellipse(cx, cy + h * 0.45, w * 0.7, 7 * dpr, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#8d5524';
  roundRect(cx - w * 0.5, cy, w, h * 0.55, 6 * dpr); ctx.fill();
  ctx.fillStyle = '#ff99aa';
  roundRect(cx - w * 0.45, cy - h * 0.05, w * 0.9, h * 0.2, 5 * dpr); ctx.fill();
  ctx.fillStyle = '#a66a36';
  roundRect(cx - w * 0.35, cy - h * 0.45, w * 0.7, h * 0.45, 5 * dpr); ctx.fill();

  const candleW = 4 * dpr, candleH = 13 * dpr;
  [-w * 0.15, w * 0.15].forEach(off => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx + off - candleW / 2, cy - h * 0.45 - candleH, candleW, candleH);
    const flicker = Math.sin(gameTime * 12 + off) * 1.5 * dpr;
    ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
    ctx.beginPath();
    ctx.moveTo(cx + off, cy - h * 0.45 - candleH + flicker);
    ctx.quadraticCurveTo(cx + off - 4 * dpr, cy - h * 0.45 - candleH - 7 * dpr, cx + off, cy - h * 0.45 - candleH - 13 * dpr + flicker);
    ctx.quadraticCurveTo(cx + off + 4 * dpr, cy - h * 0.45 - candleH - 7 * dpr, cx + off, cy - h * 0.45 - candleH + flicker);
    ctx.fill();
  });
}

function drawNPCs() {
  for (const npc of npcs) drawPerson(npc.x, npc.y, npc.color, npc.hair);
}

function drawPerson(x, y, bodyColor, hairColor) {
  const s = dpr;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(x, y + 30 * s, 16 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.ellipse(x, y + 10 * s, 16 * s, 20 * s, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#ffe0bd';
  ctx.beginPath(); ctx.arc(x, y - 14 * s, 13 * s, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = hairColor;
  ctx.beginPath(); ctx.arc(x, y - 18 * s, 14 * s, Math.PI, 0); ctx.fill();

  ctx.fillStyle = '#3e2723';
  ctx.beginPath(); ctx.arc(x - 4 * s, y - 14 * s, 2 * s, 0, Math.PI * 2); ctx.arc(x + 4 * s, y - 14 * s, 2 * s, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath(); ctx.arc(x, y - 11 * s, 4 * s, 0.2, Math.PI - 0.2); ctx.stroke();
}

function drawLotso() {
  if (!lotsoImg.complete || !lotsoImg.naturalWidth) return;
  const w = lotso.width * dpr;
  const h = lotso.height * dpr;
  const x = lotso.x;
  const y = lotso.y + lotso.bob + lotso.jumpY;

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(x + w / 2, y + h - 3 * dpr, w * 0.4, 6 * dpr, 0, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(lotso.facing * (w / lotsoImg.naturalWidth), h / lotsoImg.naturalHeight);
  ctx.drawImage(lotsoImg, -lotsoImg.naturalWidth / 2, -lotsoImg.naturalHeight / 2);
  ctx.restore();
}

function drawFloorLabels() {
  ctx.font = `bold ${16 * dpr}px Quicksand, sans-serif`;
  ctx.fillStyle = 'rgba(93, 64, 55, 0.22)';
  for (let f = 0; f < FLOOR_COUNT; f++) {
    const top = floorTop(f);
    const label = f === 2 ? 'Tingkat 3' : f === 1 ? 'Tingkat 2' : 'Tingkat 1';
    ctx.fillText(label, 16 * dpr, top + 26 * dpr);
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

// ---------- Effects & events ----------
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
  if (birthdaySong) { birthdaySong.pause(); birthdaySong.currentTime = 0; }
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

function initCakeControls() {
  if (!dpad) return;
  const buttons = dpad.querySelectorAll('.dpad-btn');
  const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  buttons.forEach(btn => {
    const start = (e) => { e.preventDefault(); if (cakeFound) return; const d = dirs[btn.dataset.dir]; moveDir.x = d[0]; moveDir.y = d[1]; };
    const stop = (e) => { e.preventDefault(); moveDir.x = 0; moveDir.y = 0; };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
  });
}

window.addEventListener('keydown', (e) => {
  if (!cakeGameActive || cakeFound) return;
  const map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  if (map[e.key]) { e.preventDefault(); moveDir.x = map[e.key][0]; moveDir.y = map[e.key][1]; }
});
window.addEventListener('keyup', () => { moveDir.x = 0; moveDir.y = 0; });
window.addEventListener('resize', () => { if (cakeGameActive) resizeCanvas(); });

window.addEventListener('DOMContentLoaded', () => {
  initCakeControls();
  if (birthdaySong) birthdaySong.addEventListener('ended', resumeBackgroundMusic);
  if (canvas) {
    resizeCanvas();
    imagesReady.then(() => { cakeGameActive = true; startGameLoop(); });
  }
});
