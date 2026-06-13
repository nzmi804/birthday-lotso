/* ==========================
   Lotso Family Birthday Adventure
   ========================== */

const room = document.getElementById('room');
const canvas = document.getElementById('gameCanvas');
const cakeHint = document.getElementById('cakeHint');
const dpad = document.getElementById('dpad');
const birthdayConsole = document.getElementById('birthdayConsole');
const birthdaySong = document.getElementById('birthdaySong');
if (birthdaySong) birthdaySong.onended = resumeBackgroundMusic;

let ctx = null;
let dpr = 1;
let cw = 0, ch = 0;

let cakeGameActive = false;
let cakeFound = false;
let gameTime = 0;
let wasMusicPlaying = false;
let birthdayAudioPrimed = false;

const lotsoImg = new Image();
lotsoImg.src = 'assets/lotso.svg';
const imagesReady = Promise.all([new Promise(r => { lotsoImg.onload = r; lotsoImg.onerror = r; })]);

// World
let ROOM_W = 0, ROOM_H = 0, CORRIDOR_W = 0;
let WORLD_W = 0, WORLD_H = 0, GAP = 0, WALL_THICK = 0;

const lotso = { x: 0, y: 0, width: 52, height: 64, speed: 2.0, facing: 1, bob: 0, jumpY: 0 };
const camera = { x: 0, y: 0 };
let moveDir = { x: 0, y: 0 };

const walls = [];
const doors = [];
const furniture = [];
const npcs = [];
let diningDoor = null;
let diningTable = null;
let diningRoomRect = null;
let cakeRevealed = false;
let confetti = [], sparkles = [];
let shake = 0;
let celebrating = false;
let metFamily = new Set();

// YouTube
let youtubePlayer = null;
let youtubeReady = false;
const BIRTHDAY_VIDEO_ID = '90w2RegGf9w';

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
  ROOM_W = 300 * dpr;
  ROOM_H = 420 * dpr;
  CORRIDOR_W = 120 * dpr;
  WORLD_W = ROOM_W * 2 + CORRIDOR_W;
  GAP = 32 * dpr;
  WALL_THICK = 12 * dpr;
  WORLD_H = 4 * ROOM_H + 5 * GAP;

  walls.length = 0; doors.length = 0; furniture.length = 0; npcs.length = 0;
  metFamily.clear();
  celebrating = false;
  cakeFound = false;
  cakeRevealed = false;

  const roomDefs = [
    { key: 'masterBedroom', side: 'left', row: 0, bg: '#fff0f3', locked: false,
      npc: { name: 'Abi', color: '#4fc3f7', hair: '#3e2723', gender: 'man', dialogue: 'Yayang, nanti malam kita ada plan special. Jangan tanya apa-apa dulu! 😉' },
      furniture: [
        { type: 'wardrobe', x: 12*dpr, y: 12*dpr, w: 110*dpr, h: 130*dpr, color: '#a1887f' },
        { type: 'bed', x: 12*dpr, y: 260*dpr, w: 170*dpr, h: 140*dpr, color: '#ffb3c1' },
        { type: 'cabinet', x: 210*dpr, y: 280*dpr, w: 78*dpr, h: 120*dpr, color: '#bcaaa4' }
      ] },
    { key: 'kidsBedroom', side: 'left', row: 1, bg: '#f3e5f5', locked: false,
      npcs: [
        { name: 'Abang', color: '#81d4fa', hair: '#3e2723', gender: 'boy', dialogue: 'Shhh… jangan bising. Nanti Ummie tahu surprise kita! 🤫' },
        { name: 'Adik', color: '#ce93d8', hair: '#5e2a35', gender: 'girl', dialogue: 'Ummie nampak comel hari ni. Kita semua sayang Ummie! 💕' }
      ],
      furniture: [
        { type: 'bed-small', x: 12*dpr, y: 270*dpr, w: 140*dpr, h: 130*dpr, color: '#e1bee7' },
        { type: 'desk', x: 12*dpr, y: 40*dpr, w: 120*dpr, h: 70*dpr, color: '#bcaaa4' },
        { type: 'toybox', x: 12*dpr, y: 140*dpr, w: 90*dpr, h: 60*dpr, color: '#ffab91' },
        { type: 'bookshelf', x: 210*dpr, y: 300*dpr, w: 78*dpr, h: 100*dpr, color: '#8d6e63' }
      ] },
    { key: 'livingRoom', side: 'left', row: 2, bg: '#e8f5e9', locked: false,
      npc: { name: 'Kakak', color: '#ff99aa', hair: '#5e2a35', gender: 'girl', dialogue: 'Hari ni Ummie pakai baju comel. Mesti ada sesuatu istimewa. 👗' },
      furniture: [
        { type: 'tv', x: 12*dpr, y: 30*dpr, w: 140*dpr, h: 60*dpr, color: '#5e2a35' },
        { type: 'sofa', x: 12*dpr, y: 290*dpr, w: 180*dpr, h: 80*dpr, color: '#ff8fab' },
        { type: 'table', x: 110*dpr, y: 330*dpr, w: 100*dpr, h: 60*dpr, color: '#d7ccc8' },
        { type: 'plant', x: 230*dpr, y: 40*dpr, w: 50*dpr, h: 50*dpr, color: '#81c784' }
      ] },
    { key: 'kitchen', side: 'left', row: 3, bg: '#fff3e0', locked: false,
      npc: null,
      furniture: [
        { type: 'fridge', x: 12*dpr, y: 40*dpr, w: 65*dpr, h: 130*dpr, color: '#e3f2fd' },
        { type: 'cabinet', x: 12*dpr, y: 210*dpr, w: 100*dpr, h: 190*dpr, color: '#a1887f' },
        { type: 'cabinet', x: 12*dpr, y: 320*dpr, w: 250*dpr, h: 70*dpr, color: '#a1887f' },
        { type: 'table', x: 130*dpr, y: 280*dpr, w: 100*dpr, h: 60*dpr, color: '#d7ccc8' }
      ] },
    { key: 'study', side: 'right', row: 0, bg: '#e1f5fe', locked: false,
      npc: null,
      furniture: [
        { type: 'bookshelf', x: 205*dpr, y: 40*dpr, w: 75*dpr, h: 220*dpr, color: '#8d6e63' },
        { type: 'desk', x: 120*dpr, y: 40*dpr, w: 150*dpr, h: 70*dpr, color: '#bcaaa4' },
        { type: 'chair', x: 150*dpr, y: 125*dpr, w: 55*dpr, h: 55*dpr, color: '#8d6e63' },
        { type: 'plant', x: 150*dpr, y: 300*dpr, w: 50*dpr, h: 50*dpr, color: '#81c784' }
      ] },
    { key: 'diningRoom', side: 'right', row: 1, bg: '#fff8fa', locked: true,
      npc: null,
      furniture: [
        { type: 'wardrobe', x: 180*dpr, y: 40*dpr, w: 100*dpr, h: 75*dpr, color: '#a1887f' },
        { type: 'cabinet', x: 180*dpr, y: 330*dpr, w: 100*dpr, h: 60*dpr, color: '#bcaaa4' },
        { type: 'plant', x: 35*dpr, y: 40*dpr, w: 45*dpr, h: 45*dpr, color: '#81c784' }
      ] },
    { key: 'commonBathroom', side: 'right', row: 2, bg: '#e1f5fe', locked: false,
      npc: null,
      furniture: [
        { type: 'bathtub', x: 130*dpr, y: 50*dpr, w: 150*dpr, h: 100*dpr, color: '#b3e5fc' },
        { type: 'sink', x: 180*dpr, y: 220*dpr, w: 85*dpr, h: 60*dpr, color: '#fff' },
        { type: 'cabinet', x: 200*dpr, y: 320*dpr, w: 80*dpr, h: 80*dpr, color: '#a1887f' }
      ] },
    { key: 'guestRoom', side: 'right', row: 3, bg: '#fff8fa', locked: false,
      npc: null,
      furniture: [
        { type: 'cabinet', x: 30*dpr, y: 40*dpr, w: 250*dpr, h: 60*dpr, color: '#a1887f' },
        { type: 'fridge', x: 210*dpr, y: 130*dpr, w: 60*dpr, h: 120*dpr, color: '#e3f2fd' }
      ] }
  ];

  roomDefs.forEach(def => {
    const rx = def.side === 'left' ? 0 : ROOM_W + CORRIDOR_W;
    const ry = GAP + def.row * (ROOM_H + GAP);

    // Outer walls
    walls.push({ x: rx, y: ry, w: ROOM_W, h: WALL_THICK });
    walls.push({ x: rx, y: ry + ROOM_H - WALL_THICK, w: ROOM_W, h: WALL_THICK });
    if (def.side === 'left') walls.push({ x: rx, y: ry, w: WALL_THICK, h: ROOM_H });
    else walls.push({ x: rx + ROOM_W - WALL_THICK, y: ry, w: WALL_THICK, h: ROOM_H });

    // Door wall
    const wallX = def.side === 'left' ? rx + ROOM_W - WALL_THICK : rx;
    const doorInfo = addWallWithDoor(wallX, ry, WALL_THICK, ROOM_H, def.side, def.locked);

    // Furniture
    def.furniture.forEach(f => furniture.push({ ...f, x: f.x + rx, y: f.y + ry }));

    // NPCs (single or multiple)
    const roomNpcs = def.npcs || (def.npc ? [def.npc] : []);
    roomNpcs.forEach((npc, i) => {
      // Keep NPCs on the open side of the room (opposite the wall with furniture)
      const baseX = ROOM_W * 0.38;
      const offsetX = (i % 2 === 0 ? -20 : 20) * dpr;
      const offsetY = (i >= 2 ? 40 : (i === 1 ? 35 : 0)) * dpr;
      npcs.push({ ...npc, x: rx + baseX + offsetX, y: ry + ROOM_H * 0.62 + offsetY });
    });

    // Dining table + chairs
    if (def.key === 'diningRoom') {
      diningRoomRect = { x: rx, y: ry, w: ROOM_W, h: ROOM_H };
      diningTable = { x: rx + 75*dpr, y: ry + 200*dpr, w: 150*dpr, h: 90*dpr };
      furniture.push({ type: 'table', ...diningTable, color: '#d7ccc8' });
      furniture.push({ type: 'chair', x: diningTable.x - 35*dpr, y: diningTable.y + 20*dpr, w: 30*dpr, h: 35*dpr, color: '#8d6e63' });
      furniture.push({ type: 'chair', x: diningTable.x + diningTable.w + 5*dpr, y: diningTable.y + 20*dpr, w: 30*dpr, h: 35*dpr, color: '#8d6e63' });
    }

    if (def.locked) diningDoor = doorInfo;
  });

  // Master bedroom en-suite bathroom (inside the top-right corner)
  const masterRx = 0;
  const masterRy = GAP;
  const bathW = 98 * dpr;
  const bathH = 130 * dpr;
  const bathX = masterRx + ROOM_W - WALL_THICK - bathW;
  const bathY = masterRy + WALL_THICK;
  const doorTop = bathY + bathH * 0.35;
  const doorBottom = bathY + bathH * 0.65;
  walls.push({ x: bathX, y: bathY + bathH, w: bathW, h: WALL_THICK }); // bottom wall
  walls.push({ x: bathX, y: bathY, w: WALL_THICK, h: doorTop - bathY }); // left wall top
  walls.push({ x: bathX, y: doorBottom, w: WALL_THICK, h: bathY + bathH - doorBottom }); // left wall bottom
  furniture.push(
    { type: 'bathtub', x: bathX + 10*dpr, y: bathY + 10*dpr, w: 80*dpr, h: 60*dpr, color: '#b3e5fc' },
    { type: 'sink', x: bathX + 10*dpr, y: bathY + 85*dpr, w: 45*dpr, h: 30*dpr, color: '#fff' }
  );

  // Corridor caps
  const cx = ROOM_W;
  walls.push({ x: cx, y: 0, w: CORRIDOR_W, h: GAP });
  walls.push({ x: cx, y: WORLD_H - GAP, w: CORRIDOR_W, h: GAP });

  // Start in corridor top
  lotso.x = cx + CORRIDOR_W/2 - lotso.width*dpr/2;
  lotso.y = GAP + 30*dpr;
  lotso.facing = 1;
}

function addWallWithDoor(x, y, w, h, side, locked) {
  const doorTop = y + h * 0.35;
  const doorBottom = y + h * 0.65;
  const info = { x, y: doorTop, w, h: doorBottom - doorTop, side, locked };
  if (locked) {
    // Solid wall for locked room; door info saved for drawing/interaction
    const wall = { x, y, w, h, lockedDoor: true };
    walls.push(wall);
  } else {
    walls.push({ x, y, w, h: doorTop - y });
    walls.push({ x, y: doorBottom, w, h: y + h - doorBottom });
  }
  doors.push(info);
  return info;
}

function isDiningUnlocked() {
  return metFamily.size >= npcs.length;
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

  // Mark family as met
  const cx = lotso.x + lotso.width*dpr/2;
  const cy = lotso.y + lotso.height*dpr/2;
  npcs.forEach(npc => {
    if (Math.hypot(cx - npc.x, cy - npc.y) < 80*dpr) metFamily.add(npc.name);
  });

  if (shake > 0) shake *= 0.92; if (shake < 0.3) shake = 0;
  if (!cakeFound && !cakeRevealed) checkCakeFound();
}

function resolveCollision(axis) {
  // Use a smaller bottom-centred hitbox so Lotso can squeeze past furniture more easily
  const hw = 38 * dpr, hh = 50 * dpr;
  const ox = (lotso.width * dpr - hw) / 2;
  const oy = lotso.height * dpr - hh;
  const r = { x: lotso.x + ox, y: lotso.y + oy, w: hw, h: hh };
  for (const w of walls) {
    if (w.lockedDoor && isDiningUnlocked()) continue; // dining door opens
    if (rectIntersect(r, w)) {
      if (axis === 'x') lotso.x = r.x < w.x ? w.x - ox - hw : w.x + w.w - ox;
      else lotso.y = r.y < w.y ? w.y - oy - hh : w.y + w.h - oy;
    }
  }
  for (const f of furniture) {
    if (rectIntersect(r, { x: f.x, y: f.y, w: f.w, h: f.h })) {
      if (axis === 'x') lotso.x = r.x < f.x ? f.x - ox - hw : f.x + f.w - ox;
      else lotso.y = r.y < f.y ? f.y - oy - hh : f.y + f.h - oy;
    }
  }
}
function rectIntersect(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

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
  ctx.fillStyle = '#3e2723'; ctx.fillRect(0, 0, cw, ch);
  ctx.translate(-camera.x, -camera.y);

  drawRooms();
  drawCorridor();
  drawDoors();
  drawFurniture();
  drawNPCs();
  drawDiningHint();
  drawDiningCake();
  if (celebrating) drawSingingText();
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
    grd.addColorStop(0, d.bg); grd.addColorStop(1, '#ffe6ec');
    ctx.fillStyle = grd;
    ctx.fillRect(rx + WALL_THICK, ry + WALL_THICK, ROOM_W - WALL_THICK*2, ROOM_H - WALL_THICK*2);

    ctx.strokeStyle = 'rgba(141,110,99,0.07)'; ctx.lineWidth = 2*dpr;
    for (let i = 0; i < ROOM_H; i += 38*dpr) {
      ctx.beginPath(); ctx.moveTo(rx + WALL_THICK, ry + i); ctx.lineTo(rx + ROOM_W - WALL_THICK, ry + i); ctx.stroke();
    }
  });

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
  grd.addColorStop(0, '#ffe6ec'); grd.addColorStop(0.5, '#fff'); grd.addColorStop(1, '#ffe6ec');
  ctx.fillStyle = grd;
  ctx.fillRect(cx + WALL_THICK, GAP, CORRIDOR_W - WALL_THICK*2, WORLD_H - 2*GAP);
  ctx.fillStyle = 'rgba(255, 179, 193, 0.25)';
  ctx.fillRect(cx + 25*dpr, GAP, CORRIDOR_W - 50*dpr, WORLD_H - 2*GAP);
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(cx + WALL_THICK, GAP, 4*dpr, WORLD_H - 2*GAP);
  ctx.fillRect(cx + CORRIDOR_W - WALL_THICK - 4*dpr, GAP, 4*dpr, WORLD_H - 2*GAP);
}

function drawDoors() {
  const unlocked = isDiningUnlocked();
  doors.forEach(d => {
    const locked = d.locked && !unlocked;
    ctx.fillStyle = locked ? '#5d4037' : '#8d6e63';
    ctx.fillRect(d.x - 2*dpr, d.y - 6*dpr, d.w + 4*dpr, 6*dpr);
    ctx.fillRect(d.x - 2*dpr, d.y + d.h, d.w + 4*dpr, 6*dpr);
    ctx.fillRect(d.x - 4*dpr, d.y, 4*dpr, d.h);
    ctx.fillRect(d.x + d.w, d.y, 4*dpr, d.h);

    if (locked) {
      // Locked door panel
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      // Lock icon
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(d.x + d.w/2, d.y + d.h/2 - 4*dpr, 5*dpr, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(d.x + d.w/2 - 5*dpr, d.y + d.h/2 - 2*dpr, 10*dpr, 9*dpr);
      ctx.fillStyle = '#3e2723';
      ctx.beginPath(); ctx.arc(d.x + d.w/2, d.y + d.h/2 + 1*dpr, 2*dpr, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(40,25,20,0.35)';
      ctx.fillRect(d.x, d.y, d.w, d.h);
    }
  });
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

function drawDiningHint() {
  if (!diningRoomRect || !diningTable || cakeFound || cakeRevealed) return;
  const lotsoCX = lotso.x + lotso.width*dpr/2;
  const lotsoCY = lotso.y + lotso.height*dpr/2;
  if (
    lotsoCX < diningRoomRect.x ||
    lotsoCX > diningRoomRect.x + diningRoomRect.w ||
    lotsoCY < diningRoomRect.y ||
    lotsoCY > diningRoomRect.y + diningRoomRect.h
  ) return;

  const tx = diningTable.x + diningTable.w/2;
  const ty = diningTable.y - 44*dpr;
  const bw = 235*dpr, bh = 42*dpr;
  const bx = tx - bw/2, by = ty - bh/2;

  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(91,36,54,0.18)';
  ctx.lineWidth = 2*dpr;
  roundRect(bx, by, bw, bh, 12*dpr);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tx - 8*dpr, by + bh - 1*dpr);
  ctx.lineTo(tx + 8*dpr, by + bh - 1*dpr);
  ctx.lineTo(tx, by + bh + 8*dpr);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = 'var(--dark)';
  ctx.font = `bold ${15*dpr}px Quicksand, Poppins, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Cari saya atas meja! 🎂', tx, ty);
  ctx.restore();
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
  const cx = lotso.x + lotso.width*dpr/2;
  const cy = lotso.y + lotso.height*dpr/2;

  // Locked dining door message
  if (diningDoor && !isDiningUnlocked()) {
    const dx = diningDoor.x + diningDoor.w/2;
    const dy = diningDoor.y + diningDoor.h/2;
    if (Math.hypot(cx - dx, cy - dy) < 90*dpr) {
      drawSpeechBubbleAt(dx, dy - 40*dpr, `Pintu dikunci! Cari ${npcs.length - metFamily.size} orang lagi. 🔒`, '#5e2a35');
    }
  }

  npcs.forEach(npc => {
    drawPerson(npc.x, npc.y, npc.color, npc.hair, npc.gender);
    if (!celebrating && Math.hypot(cx - npc.x, cy - npc.y) < 80*dpr) {
      drawSpeechBubble(npc);
    }
  });
}

function drawSpeechBubble(npc) {
  drawSpeechBubbleAt(npc.x, npc.y - 55*dpr, npc.dialogue, '#5e2a35');
}

function drawSpeechBubbleAt(x, y, text, color) {
  const s = dpr;
  ctx.font = `600 ${12*s}px Quicksand, sans-serif`;
  const maxWidth = 165*s;
  const lines = wrapText(text, maxWidth);
  const lineHeight = 16*s;
  const padX = 12*s, padY = 10*s;
  const bw = Math.min(maxWidth + padX*2, Math.max(...lines.map(l => ctx.measureText(l).width)) + padX*2);
  const bh = lines.length * lineHeight + padY*2;
  const bx = x - bw/2;
  const by = y - bh;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.strokeStyle = 'rgba(255, 77, 109, 0.45)';
  ctx.lineWidth = 2*s;
  roundRect(bx, by, bw, bh, 10*s);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 8*s, by + bh);
  ctx.lineTo(x, by + bh + 10*s);
  ctx.lineTo(x + 8*s, by + bh);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    ctx.fillText(line, x, by + padY + lineHeight*i + lineHeight/2);
  });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function wrapText(text, maxWidth) {
  const words = text.split(' ');
  const lines = []; let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current); current = word;
    } else current = test;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

function drawPerson(x, y, bodyColor, hairColor, gender) {
  const s = dpr;
  const isFemale = gender === 'girl' || gender === 'woman';

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(x, y + 30*s, 15*s, 5*s, 0, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = bodyColor;
  if (isFemale) {
    ctx.beginPath();
    ctx.moveTo(x - 14*s, y + 8*s); ctx.lineTo(x + 14*s, y + 8*s);
    ctx.lineTo(x + 18*s, y + 32*s); ctx.lineTo(x - 18*s, y + 32*s);
    ctx.closePath(); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(x, y + 8*s, 15*s, 19*s, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#5e2a35';
    ctx.fillRect(x - 12*s, y + 20*s, 10*s, 14*s);
    ctx.fillRect(x + 2*s, y + 20*s, 10*s, 14*s);
  }

  ctx.fillStyle = '#ffe0bd';
  ctx.beginPath(); ctx.arc(x, y - 13*s, 12*s, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = hairColor;
  if (isFemale) {
    ctx.beginPath();
    ctx.arc(x, y - 16*s, 13*s, Math.PI, 0);
    ctx.lineTo(x + 13*s, y + 5*s); ctx.lineTo(x - 13*s, y + 5*s);
    ctx.closePath(); ctx.fill();
    if (gender === 'girl') {
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath(); ctx.arc(x - 10*s, y - 22*s, 4*s, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x - 16*s, y - 22*s, 4*s, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(x - 13*s, y - 22*s, 2*s, 0, Math.PI*2); ctx.fill();
    }
  } else {
    ctx.beginPath(); ctx.arc(x, y - 16*s, 13*s, Math.PI, 0); ctx.fill();
  }

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

function drawSingingText() {
  if (!diningTable) return;
  const cx = diningTable.x + diningTable.w/2;
  const cy = diningTable.y - 85*dpr;
  ctx.save();
  ctx.font = `bold ${22*dpr}px Pacifico, cursive`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff4d6d';
  ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 12*dpr;
  const bounce = Math.sin(gameTime*4)*5*dpr;
  ctx.fillText('Happy Birthday to You! 🎶', cx, cy + bounce);
  ctx.restore();
}

function drawRoomLabels() {
  ctx.font = `bold ${14*dpr}px Quicksand, sans-serif`;
  ctx.fillStyle = 'rgba(93,64,55,0.22)';
  const labels = [
    { side:'left', row:0, text:'Bilik Tidur Utama' }, { side:'left', row:1, text:'Bilik Kanak-Kanak' }, { side:'left', row:2, text:'Bilik Tamu' }, { side:'left', row:3, text:'Dapur' },
    { side:'right', row:0, text:'Bilik Study' }, { side:'right', row:1, text:'Bilik Makan' }, { side:'right', row:2, text:'Bilik Mandi' }, { side:'right', row:3, text:'Bilik Tetamu' }
  ];
  labels.forEach(l => {
    const rx = l.side === 'left' ? 0 : ROOM_W + CORRIDOR_W;
    const ry = GAP + l.row * (ROOM_H + GAP);
    const text = (l.text === 'Bilik Makan' && !isDiningUnlocked()) ? '???' : l.text;
    ctx.fillText(text, rx + 14*dpr, ry + 24*dpr);
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

// ---------- Effects ----------
function spawnConfetti(amount = 80) {
  const colors = ['#ff4d6d','#ff8fab','#ffb3c1','#fff','#ffccd5','#c77dff','#ffd700'];
  for (let i = 0; i < amount; i++) {
    confetti.push({
      x: lotso.x + (Math.random()-0.5)*cw, y: lotso.y - Math.random()*ch*0.4,
      vx: (Math.random()-0.5)*3*dpr, vy: (2+Math.random()*3)*dpr,
      rot: Math.random()*Math.PI, vr: (Math.random()-0.5)*0.15,
      size: (4+Math.random()*6)*dpr, color: colors[Math.floor(Math.random()*colors.length)], alpha: 0.8+Math.random()*0.2
    });
  }
}
function spawnSparkles(amount = 30) {
  const symbols = ['✨','💖','🎀','⭐','🍓','💫'];
  for (let i = 0; i < amount; i++) {
    sparkles.push({
      x: lotso.x + (Math.random()-0.5)*cw, y: lotso.y + (Math.random()-0.5)*ch*0.4,
      size: (10+Math.random()*14)*dpr, symbol: symbols[Math.floor(Math.random()*symbols.length)], life: 0.7+Math.random()*0.4
    });
  }
}

function foundCake() {
  if (cakeFound) return;
  cakeFound = true;
  if (dpad) dpad.classList.add('hidden');
  if (birthdayConsole) { birthdayConsole.classList.add('active'); birthdayConsole.setAttribute('aria-hidden','false'); }
  if (cakeHint) cakeHint.textContent = 'Yay! Surprise berjaya! Selamat Hari Lahir Sayang! 💕';

  // Instantly gather family around cake (no lag)
  celebrating = true;
  const cx = diningTable.x + diningTable.w/2;
  const cy = diningTable.y + diningTable.h/2;
  const radius = 90*dpr;
  npcs.forEach((npc, i) => {
    const angle = (i / npcs.length) * Math.PI*2 - Math.PI/2;
    npc.x = cx + Math.cos(angle) * radius;
    npc.y = cy + Math.sin(angle) * radius;
  });

  vibrate([80,60,80,60,80]); shake = 12*dpr;
  spawnConfetti(80); spawnSparkles(30);
  wasMusicPlaying = typeof musicStarted !== 'undefined' && musicStarted && !music.paused;
  if (wasMusicPlaying) music.pause();
  window.birthdaySongPlaying = true;
  playHappyBirthdaySong();
}

function primeBirthdayAudio() {
  if (birthdayAudioPrimed || !birthdaySong) return;
  // Play/pause silently on first user gesture to unlock audio on mobile browsers
  birthdaySong.volume = 0;
  birthdaySong.play().then(() => {
    birthdaySong.pause();
    birthdaySong.currentTime = 0;
    birthdayAudioPrimed = true;
  }).catch(() => {});
}

function playHappyBirthdaySong() {
  if (!birthdaySong) {
    resumeBackgroundMusic();
    return;
  }
  birthdaySong.currentTime = 0;
  birthdaySong.volume = 0.85;
  birthdaySong.play().then(() => {
    birthdayAudioPrimed = true;
  }).catch(() => {
    // Mobile autoplay blocked even after priming; resume background music so it isn't silent
    resumeBackgroundMusic();
  });
}

function onYouTubeIframeAPIReady() {
  if (document.getElementById('youtubePlayer')) {
    youtubePlayer = new YT.Player('youtubePlayer', {
      height: '0', width: '0', videoId: BIRTHDAY_VIDEO_ID,
      playerVars: { autoplay: 0, controls: 0, showinfo: 0, rel: 0, loop: 0, playsinline: 1 },
      events: {
        onReady: () => { youtubeReady = true; },
        onStateChange: (event) => { if (event.data === YT.PlayerState.ENDED) resumeBackgroundMusic(); }
      }
    });
  }
}

function resumeBackgroundMusic() {
  window.birthdaySongPlaying = false;
  if (wasMusicPlaying && typeof musicStarted !== 'undefined' && musicStarted) music.play().catch(()=>{});
}

function restartCakeGame() {
  if (youtubePlayer && youtubePlayer.pauseVideo) youtubePlayer.pauseVideo();
  if (birthdaySong) { birthdaySong.pause(); birthdaySong.currentTime = 0; }
  resumeBackgroundMusic();
  cakeFound = false; cakeRevealed = false; celebrating = false;
  moveDir = {x:0,y:0}; confetti = []; sparkles = [];
  if (dpad) dpad.classList.remove('hidden');
  if (birthdayConsole) { birthdayConsole.classList.remove('active'); birthdayConsole.setAttribute('aria-hidden','true'); }
  if (cakeHint) cakeHint.textContent = 'Cari Abi, Kakak, Abang & Adik dulu.';
  buildWorld();
}

// ---------- Controls ----------
function initCakeControls() {
  if (!dpad) return;
  const buttons = dpad.querySelectorAll('.dpad-btn');
  const dirs = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
  buttons.forEach(btn => {
    const start = (e) => { e.preventDefault(); primeBirthdayAudio(); if (cakeFound) return; const d = dirs[btn.dataset.dir]; moveDir.x = d[0]; moveDir.y = d[1]; };
    const stop = (e) => { e.preventDefault(); moveDir.x = 0; moveDir.y = 0; };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
  });
}

window.addEventListener('keydown', (e) => {
  if (!cakeGameActive || cakeFound) return;
  primeBirthdayAudio();
  const map = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] };
  if (map[e.key]) { e.preventDefault(); moveDir.x = map[e.key][0]; moveDir.y = map[e.key][1]; }
});
window.addEventListener('keyup', () => { moveDir.x = 0; moveDir.y = 0; });
window.addEventListener('resize', () => { if (cakeGameActive) resizeCanvas(); });

window.addEventListener('DOMContentLoaded', () => {
  initCakeControls();
  if (canvas) { resizeCanvas(); imagesReady.then(() => { cakeGameActive = true; startGameLoop(); }); }
});
