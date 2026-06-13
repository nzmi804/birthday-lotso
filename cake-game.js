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
let cw = 0, ch = 0;

let cakeGameActive = false;
let cakeFound = false;
let gameTime = 0;
let wasMusicPlaying = false;

const lotsoImg = new Image();
lotsoImg.src = 'assets/lotso.svg';
const imagesReady = Promise.all([new Promise(r => { lotsoImg.onload = r; lotsoImg.onerror = r; })]);

// World dimensions
let ROOM_W = 0, ROOM_H = 0, CORRIDOR_W = 0;
let WORLD_W = 0, WORLD_H = 0, GAP = 0, WALL_THICK = 0;

const lotso = { x: 0, y: 0, width: 52, height: 64, speed: 1.6, facing: 1, bob: 0, jumpY: 0 };
const camera = { x: 0, y: 0 };
let moveDir = { x: 0, y: 0 };

const walls = [];
const doors = [];
const furniture = [];
const npcs = [];
let diningTable = null;
let cakeRevealed = false;
let confetti = [], sparkles = [];
let shake = 0;

function resizeCanvas() {
  if (!room || !canvas) return;
  const rect = room.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cw = Math.max(1, Math.floor(rect.width * dpr));
  ch = Math.max(1, Math.floor(rect.height * dpr));
  canvas.width = cw; canvas.height = ch;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx = canvas.getContext('2d');
  buildWorld();
}

function buildWorld() {
  ROOM_W = 230 * dpr;
  ROOM_H = 330 * dpr;
  CORRIDOR_W = 105 * dpr;
  WORLD_W = ROOM_W * 2 + CORRIDOR_W;
  GAP = 28 * dpr;
  WALL_THICK = 12 * dpr;
  WORLD_H = 3 * ROOM_H + 4 * GAP;

  walls.length = 0; doors.length = 0; furniture.length = 0; npcs.length = 0;

  const roomDefs = [
    // Left column
    { key: 'bedroom', side: 'left', row: 0, name: 'Bilik Tidur', bg: '#fff0f3', npc: { name: 'Awak', color: '#ff4d6d', hair: '#5e2a35', dialogue: 'Lotso, kek birthday sayang ada dalam Bilik Makan. Cari pintu kanan bawah ye! 💕' },
      furniture: [
        { type: 'bed', x: 25*dpr, y: 50*dpr, w: 140*dpr, h: 170*dpr, color: '#ffb3c1' },
        { type: 'wardrobe', x: 25*dpr, y: 250*dpr, w: 80*dpr, h: 120*dpr, color: '#a1887f' }
      ] },
    { key: 'study', side: 'left', row: 1, name: 'Bilik Study', bg: '#f3e5f5', npc: { name: 'Papa Bear', color: '#4fc3f7', hair: '#5e2a35', dialogue: 'Kek tu sorok dalam Bilik Makan. Jangan masuk bilik lain tak tentu arah! 📚' },
      furniture: [
        { type: 'bookshelf', x: 20*dpr, y: 40*dpr, w: 70*dpr, h: 180*dpr, color: '#8d6e63' },
        { type: 'desk', x: 110*dpr, y: 220*dpr, w: 110*dpr, h: 60*dpr, color: '#bcaaa4' }
      ] },
    { key: 'living', side: 'left', row: 2, name: 'Bilik Tamu', bg: '#e8f5e9', npc: { name: 'Adik Bear', color: '#81d4fa', hair: '#5e2a35', dialogue: 'Aku nampak Nenek Bear bawa kek masuk Bilik Makan tadi! 🎂' },
      furniture: [
        { type: 'sofa', x: 25*dpr, y: 60*dpr, w: 150*dpr, h: 75*dpr, color: '#ff99aa' },
        { type: 'tv', x: 40*dpr, y: 220*dpr, w: 120*dpr, h: 75*dpr, color: '#5e2a35' }
      ] },
    // Right column
    { key: 'bathroom', side: 'right', row: 0, name: 'Bilik Mandi', bg: '#e1f5fe', npc: { name: 'Mama Bear', color: '#fb6f92', hair: '#5e2a35', dialogue: 'Mandi dulu ke cari kek dulu? Hihi, cepat pergi Bilik Makan! 🛁' },
      furniture: [
        { type: 'bathtub', x: 40*dpr, y: 50*dpr, w: 130*dpr, h: 160*dpr, color: '#b3e5fc' },
        { type: 'sink', x: 120*dpr, y: 250*dpr, w: 65*dpr, h: 55*dpr, color: '#fff' }
      ] },
    { key: 'guest', side: 'right', row: 1, name: 'Bilik Tetamu', bg: '#fff3e0', npc: { name: 'Kawan Bear', color: '#ffcc80', hair: '#5e2a35', dialogue: 'Bilik Makan ada bau manis-manis. Mesti kek tu! 🍰' },
      furniture: [
        { type: 'bed-small', x: 35*dpr, y: 55*dpr, w: 130*dpr, h: 150*dpr, color: '#ce93d8' },
        { type: 'toybox', x: 120*dpr, y: 240*dpr, w: 75*dpr, h: 60*dpr, color: '#ffab91' }
      ] },
    { key: 'dining', side: 'right', row: 2, name: 'Bilik Makan', bg: '#fff8fa', npc: { name: 'Nenek Bear', color: '#ce93d8', hair: '#7a3d4d', dialogue: 'Surprise! Kek dah siap atas meja. Selamat mencari! 🎉' },
      furniture: [
        { type: 'fridge', x: 30*dpr, y: 40*dpr, w: 60*dpr, h: 120*dpr, color: '#e3f2fd' },
        { type: 'cabinet', x: 30*dpr, y: 180*dpr, w: 110*dpr, h: 60*dpr, color: '#a1887f' }
      ] }
  ];

  // Build rooms
  roomDefs.forEach(def => {
    const rx = def.side === 'left' ? 0 : ROOM_W + CORRIDOR_W;
    const ry = GAP + def.row * (ROOM_H + GAP);

    // Room background
    ctx && ctx.fill(def.bg); // not needed here

    // Outer walls (top/bottom/outer side)
    walls.push({ x: rx, y: ry, w: ROOM_W, h: WALL_THICK }); // top
    walls.push({ x: rx, y: ry + ROOM_H - WALL_THICK, w: ROOM_W, h: WALL_THICK }); // bottom
    if (def.side === 'left') {
      walls.push({ x: rx, y: ry, w: WALL_THICK, h: ROOM_H }); // outer left
    } else {
      walls.push({ x: rx + ROOM_W - WALL_THICK, y: ry, w: WALL_THICK, h: ROOM_H }); // outer right
    }

    // Inner wall facing corridor with door
    const wallX = def.side === 'left' ? rx + ROOM_W - WALL_THICK : rx;
    addWallWithDoor(wallX, ry, WALL_THICK, ROOM_H, def.side);

    // Furniture (convert local room coords to world)
    def.furniture.forEach(f => {
      furniture.push({ ...f, x: f.x + rx, y: f.y + ry });
    });

    // NPC
    const npcX = rx + (def.side === 'left' ? ROOM_W * 0.55 : ROOM_W * 0.45);
    const npcY = ry + ROOM_H * 0.6;
    npcs.push({ ...def.npc, x: npcX, y: npcY });

    // Dining table with hidden cake
    if (def.key === 'dining') {
      diningTable = {
        x: rx + 40 * dpr,
        y: ry + ROOM_H - 150 * dpr,
        w: 150 * dpr,
        h: 90 * dpr
      };
      furniture.push({ type: 'table', ...diningTable, color: '#d7ccc8' });
      furniture.push({ type: 'chair', x: diningTable.x - 35*dpr, y: diningTable.y + 20*dpr, w: 30*dpr, h: 35*dpr, color: '#8d6e63' });
      furniture.push({ type: 'chair', x: diningTable.x + diningTable.w + 5*dpr, y: diningTable.y + 20*dpr, w: 30*dpr, h: 35*dpr, color: '#8d6e63' });
    }
  });

  // Corridor top/bottom walls
  const cx = ROOM_W;
  walls.push({ x: cx, y: 0, w: CORRIDOR_W, h: GAP }); // top cap
  walls.push({ x: cx, y: WORLD_H - GAP, w: CORRIDOR_W, h: GAP }); // bottom cap

  // Lotso starts in corridor at top (lobby)
  lotso.x = cx + CORRIDOR_W / 2 - lotso.width * dpr / 2;
  lotso.y = GAP + 30 * dpr;
  lotso.facing = 1;
}

function addWallWithDoor(x, y, w, h, side) {
  const doorTop = y + h * 0.35;
  const doorBottom = y + h * 0.65;
  walls.push({ x, y, w, h: doorTop - y });
  walls.push({ x, y: doorBottom, w, h: y + h - doorBottom });
  doors.push({ x, y: doorTop, w, h: doorBottom - doorTop, side });
}

// ---------- Game loop ----------
function startGameLoop() { if (cakeGameActive) requestAnimationFrame(gameLoop); }
function gameLoop(timestamp) {
  if (!cakeGameActive) return;
  gameTime = timestamp / 1000;
  update(); draw();
  if (cakeGameActive) requestAnimationFrame(gameLoop);
}

function update() {
  if (!cakeFound) {
    let dx = moveDir.x * lotso.speed * dpr;
    let dy = moveDir.y * lotso.speed * dpr;
    if (dx !== 0 || dy !== 0) {
      if (dx !== 0) lotso.facing = dx > 0 ? 1 : -1;
      lotso.x += dx; resolveCollision('x');
      lotso.y += dy; resolveCollision('y');
      lotso.x = Math.max(WALL_THICK, Math.min(lotso.x, WORLD_W - lotso.width*dpr - WALL_THICK));
      lotso.y = Math.max(WALL_THICK, Math.min(lotso.y, WORLD_H - lotso.height*dpr - WALL_THICK));
    }
  }
  const moving = moveDir.x !== 0 || moveDir.y !== 0;
  lotso.bob = Math.sin(gameTime * (moving ? 10 : 3)) * 3 * dpr;
  lotso.jumpY = cakeFound ? Math.abs(Math.sin(gameTime * 8)) * -18 * dpr : 0;

  camera.x += (lotso.x + lotso.width*dpr/2 - cw/2 - camera.x) * 0.1;
  camera.y += (lotso.y + lotso.height*dpr/2 - ch/2 - camera.y) * 0.1;
  camera.x = Math.max(0, Math.min(camera.x, WORLD_W - cw));
  camera.y = Math.max(0, Math.min(camera.y, WORLD_H - ch));

  updateDialogue();

  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i]; c.x += c.vx; c.y += c.vy; c.rot += c.vr; c.vy += 0.05*dpr;
    if (c.y > camera.y + ch + 30) confetti.splice(i, 1);
  }
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i]; s.life -= 0.015; s.y -= 0.4*dpr;
    if (s.life <= 0) sparkles.splice(i, 1);
  }
  if (shake > 0) shake *= 0.92; if (shake < 0.3) shake = 0;
  if (!cakeFound && !cakeRevealed) checkCakeFound();
}

function resolveCollision(axis) {
  const r = { x: lotso.x, y: lotso.y, w: lotso.width*dpr, h: lotso.height*dpr };
  for (const w of walls) {
    if (rectIntersect(r, w)) {
      if (axis === 'x') lotso.x = lotso.x < w.x ? w.x - r.w : w.x + w.w;
      else lotso.y = lotso.y < w.y ? w.y - r.h : w.y + w.h;
    }
  }
  for (const f of furniture) {
    if (rectIntersect(r, { x: f.x, y: f.y, w: f.w, h: f.h })) {
      if (axis === 'x') lotso.x = lotso.x < f.x ? f.x - r.w : f.x + f.w;
      else lotso.y = lotso.y < f.y ? f.y - r.h : f.y + f.h;
    }
  }
}
function rectIntersect(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function updateDialogue() {
  const cx = lotso.x + lotso.width*dpr/2;
  const cy = lotso.y + lotso.height*dpr/2;
  let active = null;
  for (const npc of npcs) {
    if (Math.hypot(cx - npc.x, cy - npc.y) < 75*dpr) { active = npc; break; }
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
  const cx = lotso.x + lotso.width*dpr/2;
  const cy = lotso.y + lotso.height*dpr/2;
  const tx = diningTable.x + diningTable.w/2;
  const ty = diningTable.y + diningTable.h/2;
  if (Math.hypot(cx - tx, cy - ty) < 90*dpr) { cakeRevealed = true; foundCake(); }
}

// ---------- Drawing ----------
function draw() {
  if (!ctx) return;
  ctx.save();
  if (shake > 0) ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);
  ctx.fillStyle = '#3e2723'; ctx.fillRect(0,0,cw,ch);
  ctx.translate(-camera.x, -camera.y);

  drawRooms();
  drawCorridor();
  drawDoors();
  drawFurniture();
  drawNPCs();
  drawDiningCake();
  drawLotso();
  drawRoomLabels();
  drawConfetti();
  drawSparkles();

  ctx.restore();
}

function drawRooms() {
  const defs = [
    { side:'left', row:0, bg:'#fff0f3' }, { side:'left', row:1, bg:'#f3e5f5' }, { side:'left', row:2, bg:'#e8f5e9' },
    { side:'right', row:0, bg:'#e1f5fe' }, { side:'right', row:1, bg:'#fff3e0' }, { side:'right', row:2, bg:'#fff8fa' }
  ];
  defs.forEach(d => {
    const rx = d.side === 'left' ? 0 : ROOM_W + CORRIDOR_W;
    const ry = GAP + d.row * (ROOM_H + GAP);
    const grd = ctx.createLinearGradient(rx, ry, rx, ry + ROOM_H);
    grd.addColorStop(0, d.bg);
    grd.addColorStop(1, '#ffe6ec');
    ctx.fillStyle = grd;
    ctx.fillRect(rx + WALL_THICK, ry + WALL_THICK, ROOM_W - WALL_THICK*2, ROOM_H - WALL_THICK*2);

    // Floor planks
    ctx.strokeStyle = 'rgba(141,110,99,0.07)';
    ctx.lineWidth = 2*dpr;
    for (let i = 0; i < ROOM_H; i += 38*dpr) {
      ctx.beginPath(); ctx.moveTo(rx + WALL_THICK, ry + i); ctx.lineTo(rx + ROOM_W - WALL_THICK, ry + i); ctx.stroke();
    }
  });

  // Walls
  ctx.fillStyle = '#6d4c41';
  for (const w of walls) ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (const w of walls) {
    ctx.fillRect(w.x + w.w, w.y, 5*dpr, w.h);
    ctx.fillRect(w.x, w.y + w.h, w.w, 5*dpr);
  }
}

function drawCorridor() {
  const cx = ROOM_W;
  const grd = ctx.createLinearGradient(cx, 0, cx + CORRIDOR_W, 0);
  grd.addColorStop(0, '#ffe6ec');
  grd.addColorStop(0.5, '#fff');
  grd.addColorStop(1, '#ffe6ec');
  ctx.fillStyle = grd;
  ctx.fillRect(cx + WALL_THICK, GAP, CORRIDOR_W - WALL_THICK*2, WORLD_H - 2*GAP);

  // Runner carpet
  ctx.fillStyle = 'rgba(255, 179, 193, 0.25)';
  ctx.fillRect(cx + 25*dpr, GAP, CORRIDOR_W - 50*dpr, WORLD_H - 2*GAP);

  // Wall trim
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(cx + WALL_THICK, GAP, 4*dpr, WORLD_H - 2*GAP);
  ctx.fillRect(cx + CORRIDOR_W - WALL_THICK - 4*dpr, GAP, 4*dpr, WORLD_H - 2*GAP);
}

function drawDoors() {
  ctx.fillStyle = '#8d6e63';
  for (const d of doors) {
    // Frame
    ctx.fillRect(d.x - 2*dpr, d.y - 6*dpr, d.w + 4*dpr, 6*dpr);
    ctx.fillRect(d.x - 2*dpr, d.y + d.h, d.w + 4*dpr, 6*dpr);
    ctx.fillRect(d.x - 4*dpr, d.y, 4*dpr, d.h);
    ctx.fillRect(d.x + d.w, d.y, 4*dpr, d.h);
    // Open dark
    ctx.fillStyle = 'rgba(40,25,20,0.35)';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = '#8d6e63';
  }
}

function drawFurniture() {
  for (const f of furniture) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(f.x + 4*dpr, f.y + 4*dpr, f.w, f.h);
    ctx.fillStyle = f.color;
    roundRect(f.x, f.y, f.w, f.h, 6*dpr);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    if (f.type === 'bed' || f.type === 'bed-small') {
      ctx.fillRect(f.x + 8*dpr, f.y + 8*dpr, f.w - 16*dpr, f.h * 0.35);
      ctx.fillStyle = '#fff';
      ctx.fillRect(f.x + 10*dpr, f.y + 12*dpr, f.w * 0.22, f.h * 0.16);
      ctx.fillRect(f.x + f.w - f.w*0.22 - 10*dpr, f.y + 12*dpr, f.w * 0.22, f.h * 0.16);
    } else if (f.type === 'bathtub') {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(f.x + f.w/2, f.y + f.h*0.4, f.w*0.35, f.h*0.25, 0, 0, Math.PI*2); ctx.fill();
    } else if (f.type === 'sink') {
      ctx.fillStyle = '#b3e5fc';
      ctx.beginPath(); ctx.arc(f.x + f.w/2, f.y + f.h*0.45, f.w*0.25, 0, Math.PI*2); ctx.fill();
    } else if (f.type === 'bookshelf') {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let i = 1; i <= 4; i++) ctx.fillRect(f.x + 5*dpr, f.y + i*(f.h/5), f.w - 10*dpr, 3*dpr);
    } else if (f.type === 'desk') {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(f.x + 6*dpr, f.y + f.h - 12*dpr, f.w - 12*dpr, 8*dpr);
    } else if (f.type === 'toybox') {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(f.x + 6*dpr, f.y + 10*dpr, f.w - 12*dpr, 7*dpr);
    } else if (f.type === 'tv') {
      ctx.fillStyle = '#263238';
      ctx.fillRect(f.x + 8*dpr, f.y + 8*dpr, f.w - 16*dpr, f.h - 16*dpr);
    } else if (f.type === 'sofa') {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(f.x + 8*dpr, f.y + f.h - 18*dpr, f.w - 16*dpr, 12*dpr);
    } else if (f.type === 'cabinet') {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(f.x + 6*dpr, f.y + f.h*0.45, f.w - 12*dpr, 4*dpr);
    } else if (f.type === 'fridge') {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(f.x + 6*dpr, f.y + f.h*0.35, f.w - 12*dpr, 4*dpr);
    } else if (f.type === 'table') {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(f.x + 8*dpr, f.y + 8*dpr, f.w - 16*dpr, f.h - 16*dpr);
    } else if (f.type === 'chair') {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(f.x + 4*dpr, f.y + 4*dpr, f.w - 8*dpr, f.h - 8*dpr);
    } else if (f.type === 'wardrobe') {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(f.x + f.w*0.45, f.y + 8*dpr, 4*dpr, f.h - 16*dpr);
    }
  }
}

function drawDiningCake() {
  if (!cakeRevealed || !diningTable) return;
  const cx = diningTable.x + diningTable.w/2;
  const cy = diningTable.y - 26*dpr;
  const w = 56*dpr, h = 50*dpr;
  const g = ctx.createRadialGradient(cx, cy, w*0.3, cx, cy, w*1.5);
  g.addColorStop(0, 'rgba(255,215,0,0.5)'); g.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, w*1.5, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.ellipse(cx, cy + h*0.45, w*0.7, 7*dpr, 0, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = '#8d5524'; roundRect(cx - w*0.5, cy, w, h*0.55, 6*dpr); ctx.fill();
  ctx.fillStyle = '#ff99aa'; roundRect(cx - w*0.45, cy - h*0.05, w*0.9, h*0.2, 5*dpr); ctx.fill();
  ctx.fillStyle = '#a66a36'; roundRect(cx - w*0.35, cy - h*0.45, w*0.7, h*0.45, 5*dpr); ctx.fill();

  const cw_ = 4*dpr, ch_ = 12*dpr;
  [-w*0.15, w*0.15].forEach(off => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx + off - cw_/2, cy - h*0.45 - ch_, cw_, ch_);
    const flicker = Math.sin(gameTime*12 + off)*1.5*dpr;
    ctx.fillStyle = 'rgba(255,200,50,0.9)';
    ctx.beginPath();
    ctx.moveTo(cx + off, cy - h*0.45 - ch_ + flicker);
    ctx.quadraticCurveTo(cx + off - 4*dpr, cy - h*0.45 - ch_ - 7*dpr, cx + off, cy - h*0.45 - ch_ - 13*dpr + flicker);
    ctx.quadraticCurveTo(cx + off + 4*dpr, cy - h*0.45 - ch_ - 7*dpr, cx + off, cy - h*0.45 - ch_ + flicker);
    ctx.fill();
  });
}

function drawNPCs() {
  for (const npc of npcs) drawPerson(npc.x, npc.y, npc.color, npc.hair);
}
function drawPerson(x, y, bodyColor, hairColor) {
  const s = dpr;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(x, y + 28*s, 15*s, 5*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.ellipse(x, y + 9*s, 15*s, 19*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffe0bd';
  ctx.beginPath(); ctx.arc(x, y - 13*s, 12*s, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = hairColor;
  ctx.beginPath(); ctx.arc(x, y - 17*s, 13*s, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#3e2723';
  ctx.beginPath(); ctx.arc(x - 4*s, y - 13*s, 2*s, 0, Math.PI*2); ctx.arc(x + 4*s, y - 13*s, 2*s, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 1.5*s;
  ctx.beginPath(); ctx.arc(x, y - 10*s, 4*s, 0.2, Math.PI - 0.2); ctx.stroke();
}

function drawLotso() {
  if (!lotsoImg.complete || !lotsoImg.naturalWidth) return;
  const w = lotso.width*dpr, h = lotso.height*dpr;
  const x = lotso.x, y = lotso.y + lotso.bob + lotso.jumpY;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(x + w/2, y + h - 3*dpr, w*0.4, 6*dpr, 0, 0, Math.PI*2); ctx.fill();
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  ctx.scale(lotso.facing * (w / lotsoImg.naturalWidth), h / lotsoImg.naturalHeight);
  ctx.drawImage(lotsoImg, -lotsoImg.naturalWidth/2, -lotsoImg.naturalHeight/2);
  ctx.restore();
}

function drawRoomLabels() {
  ctx.font = `bold ${14*dpr}px Quicksand, sans-serif`;
  ctx.fillStyle = 'rgba(93,64,55,0.25)';
  const labels = [
    { side:'left', row:0, text:'Bilik Tidur' }, { side:'left', row:1, text:'Bilik Study' }, { side:'left', row:2, text:'Bilik Tamu' },
    { side:'right', row:0, text:'Bilik Mandi' }, { side:'right', row:1, text:'Bilik Tetamu' }, { side:'right', row:2, text:'Bilik Makan' }
  ];
  labels.forEach(l => {
    const rx = l.side === 'left' ? 0 : ROOM_W + CORRIDOR_W;
    const ry = GAP + l.row * (ROOM_H + GAP);
    ctx.fillText(l.text, rx + 16*dpr, ry + 26*dpr);
  });
}

function drawConfetti() {
  confetti.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y); ctx.rotate(c.rot);
    ctx.fillStyle = c.color; ctx.globalAlpha = c.alpha;
    ctx.fillRect(-c.size/2, -c.size/2, c.size, c.size);
    ctx.restore();
  });
}
function drawSparkles() {
  sparkles.forEach(s => {
    ctx.save();
    ctx.globalAlpha = s.life; ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,255,255,0.8)'; ctx.shadowBlur = 10*dpr;
    ctx.font = `${s.size}px serif`; ctx.fillText(s.symbol, s.x, s.y);
    ctx.restore();
  });
}
function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, w/2, h/2);
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
  const colors = ['#ff4d6d','#ff8fab','#ffb3c1','#fff','#ffccd5','#c77dff','#ffd700'];
  for (let i = 0; i < amount; i++) {
    confetti.push({
      x: lotso.x + (Math.random()-0.5)*cw, y: lotso.y - Math.random()*ch*0.4,
      vx: (Math.random()-0.5)*4*dpr, vy: (2+Math.random()*4)*dpr,
      rot: Math.random()*Math.PI, vr: (Math.random()-0.5)*0.2,
      size: (5+Math.random()*8)*dpr, color: colors[Math.floor(Math.random()*colors.length)], alpha: 0.8+Math.random()*0.2
    });
  }
}
function spawnSparkles(amount = 40) {
  const symbols = ['✨','💖','🎀','⭐','🍓','💫'];
  for (let i = 0; i < amount; i++) {
    sparkles.push({
      x: lotso.x + (Math.random()-0.5)*cw, y: lotso.y + (Math.random()-0.5)*ch*0.4,
      size: (12+Math.random()*18)*dpr, symbol: symbols[Math.floor(Math.random()*symbols.length)], life: 0.8+Math.random()*0.5
    });
  }
}
function foundCake() {
  if (cakeFound) return;
  cakeFound = true;
  if (dpad) dpad.classList.add('hidden');
  if (birthdayConsole) { birthdayConsole.classList.add('active'); birthdayConsole.setAttribute('aria-hidden','false'); }
  if (dialogueBox) dialogueBox.classList.remove('active');
  if (cakeHint) cakeHint.textContent = 'Yay! Jumpa kek! Selamat Hari Lahir Sayang! 💕';
  vibrate([80,60,80,60,80]); shake = 14*dpr;
  spawnConfetti(140); spawnSparkles(50);
  wasMusicPlaying = typeof musicStarted !== 'undefined' && musicStarted && !music.paused;
  if (wasMusicPlaying) music.pause();
  playHappyBirthdaySong();
}
function playHappyBirthdaySong() {
  if (!birthdaySong) return;
  birthdaySong.currentTime = 0; birthdaySong.volume = 0.85;
  birthdaySong.play().catch(() => resumeBackgroundMusic());
}
function resumeBackgroundMusic() {
  if (wasMusicPlaying && typeof musicStarted !== 'undefined' && musicStarted) music.play().catch(()=>{});
}
function restartCakeGame() {
  if (birthdaySong) { birthdaySong.pause(); birthdaySong.currentTime = 0; }
  resumeBackgroundMusic();
  cakeFound = false; cakeRevealed = false; moveDir = {x:0,y:0}; confetti = []; sparkles = [];
  if (dpad) dpad.classList.remove('hidden');
  if (birthdayConsole) { birthdayConsole.classList.remove('active'); birthdayConsole.setAttribute('aria-hidden','true'); }
  if (dialogueBox) dialogueBox.classList.remove('active');
  if (cakeHint) cakeHint.textContent = 'Sila jalan-jalan ikut je anak panah tu ye.';
  buildWorld();
}

function initCakeControls() {
  if (!dpad) return;
  const buttons = dpad.querySelectorAll('.dpad-btn');
  const dirs = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
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
  const map = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] };
  if (map[e.key]) { e.preventDefault(); moveDir.x = map[e.key][0]; moveDir.y = map[e.key][1]; }
});
window.addEventListener('keyup', () => { moveDir.x = 0; moveDir.y = 0; });
window.addEventListener('resize', () => { if (cakeGameActive) resizeCanvas(); });

window.addEventListener('DOMContentLoaded', () => {
  initCakeControls();
  if (birthdaySong) birthdaySong.addEventListener('ended', resumeBackgroundMusic);
  if (canvas) { resizeCanvas(); imagesReady.then(() => { cakeGameActive = true; startGameLoop(); }); }
});
