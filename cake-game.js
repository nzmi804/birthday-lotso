/* ==========================
   Cake Hunt Finale
   ========================== */

const room = document.getElementById('room');
const lotsoRoom = document.getElementById('lotsoRoom');
const cakeSpot = document.getElementById('cakeSpot');
const roomOverlay = document.getElementById('roomOverlay');
const friendsContainer = document.getElementById('friends');
const celebration = document.getElementById('celebration');
const cakeHint = document.getElementById('cakeHint');
const dpad = document.getElementById('dpad');
const lotsoArrow = document.getElementById('lotsoArrow');
const birthdayConsole = document.getElementById('birthdayConsole');

let cakeGameActive = false;
let cakeFound = false;
let lotsoPos = { x: 20, y: 0 };
const cakeMoveStep = 14;
let cakeMoveRepeat = null;
let wasMusicPlaying = false;
const birthdaySong = document.getElementById('birthdaySong');

// Lotso's bear friends that appear around the cake when found
const friendCharacters = [
  { imgClass: 'friend-left',   pos: { right: '18%', bottom: '6%' } },
  { imgClass: 'friend-right',  pos: { right: '2%',  bottom: '12%' } },
  { imgClass: 'friend-bottom', pos: { right: '10%', bottom: '14%' } }
];

function startCakeGame() {
  if (cakeGameActive || !room) return;
  cakeGameActive = true;
  cakeFound = false;

  resetCakeGame();
  initFriends();

  const roomRect = room.getBoundingClientRect();
  lotsoPos.x = 20;
  lotsoPos.y = Math.max(0, roomRect.height * 0.12);
  clampLotsoPosition();
  updateLotsoPosition();
  updateSpotlight();

  if (cakeHint) cakeHint.textContent = 'Sila jalan-jalan ikut je anak panah tu ye.';
}

function stopCakeGame() {
  cakeGameActive = false;
  clearInterval(cakeMoveRepeat);
  cakeMoveRepeat = null;
}

function resetCakeGame() {
  cakeFound = false;
  room.classList.remove('found');
  cakeSpot.classList.remove('found');
  celebration.classList.remove('active');
  if (roomOverlay) roomOverlay.style.opacity = '';
  if (cakeHint) cakeHint.textContent = 'Sila jalan-jalan ikut je anak panah tu ye.';
  if (dpad) dpad.classList.remove('hidden');
  if (birthdayConsole) {
    birthdayConsole.classList.remove('active');
    birthdayConsole.setAttribute('aria-hidden', 'true');
  }
}

function initFriends() {
  if (!friendsContainer || friendsContainer.children.length) return;
  friendCharacters.forEach((char, i) => {
    const f = document.createElement('div');
    f.className = 'friend';
    f.style.right = char.pos.right;
    f.style.bottom = char.pos.bottom;
    f.style.setProperty('--delay', (i * 0.12) + 's');
    f.style.transitionDelay = (i * 0.12) + 's';

    const img = document.createElement('img');
    img.src = 'assets/lotso.svg';
    img.alt = 'Lotso friend';
    img.className = 'friend-img ' + char.imgClass;
    img.draggable = false;

    f.appendChild(img);
    friendsContainer.appendChild(f);
  });
}

function clampLotsoPosition() {
  const roomRect = room.getBoundingClientRect();
  const lotsoRect = lotsoRoom.getBoundingClientRect();
  const maxX = roomRect.width - lotsoRect.width;
  const maxY = roomRect.height - lotsoRect.height;
  lotsoPos.x = Math.max(0, Math.min(lotsoPos.x, maxX));
  lotsoPos.y = Math.max(0, Math.min(lotsoPos.y, maxY));
}

function updateLotsoPosition() {
  lotsoRoom.style.left = lotsoPos.x + 'px';
  lotsoRoom.style.top = lotsoPos.y + 'px';
  updateArrow();
}

function updateArrow() {
  if (!lotsoArrow || !room || !cakeSpot) return;
  const roomRect = room.getBoundingClientRect();
  const lotsoRect = lotsoRoom.getBoundingClientRect();
  const cakeRect = cakeSpot.getBoundingClientRect();

  const lotsoCx = lotsoRect.left - roomRect.left + lotsoRect.width / 2;
  const lotsoCy = lotsoRect.top - roomRect.top + lotsoRect.height / 2;
  const cakeCx = cakeRect.left - roomRect.left + cakeRect.width / 2;
  const cakeCy = cakeRect.top - roomRect.top + cakeRect.height / 2;

  const angle = Math.atan2(cakeCy - lotsoCy, cakeCx - lotsoCx) * 180 / Math.PI;
  lotsoArrow.style.transform = `translateX(-50%) rotate(${angle}deg)`;
}

function updateSpotlight() {
  const roomRect = room.getBoundingClientRect();
  const lotsoRect = lotsoRoom.getBoundingClientRect();
  const cx = lotsoRect.left - roomRect.left + lotsoRect.width / 2;
  const cy = lotsoRect.top - roomRect.top + lotsoRect.height / 2;
  roomOverlay.style.setProperty('--spot-x', cx + 'px');
  roomOverlay.style.setProperty('--spot-y', cy + 'px');
}

function moveLotso(dx, dy) {
  if (!cakeGameActive || cakeFound) return;
  lotsoPos.x += dx * cakeMoveStep;
  lotsoPos.y += dy * cakeMoveStep;
  clampLotsoPosition();
  updateLotsoPosition();
  updateSpotlight();
  checkCakeFound();
}

function checkCakeFound() {
  const roomRect = room.getBoundingClientRect();
  const lotsoRect = lotsoRoom.getBoundingClientRect();
  const cakeRect = cakeSpot.getBoundingClientRect();

  const lotsoCx = lotsoRect.left - roomRect.left + lotsoRect.width / 2;
  const lotsoCy = lotsoRect.top - roomRect.top + lotsoRect.height / 2;
  const cakeCx = cakeRect.left - roomRect.left + cakeRect.width / 2;
  const cakeCy = cakeRect.top - roomRect.top + cakeRect.height / 2;

  const dist = Math.hypot(lotsoCx - cakeCx, lotsoCy - cakeCy);
  if (dist < 78) {
    foundCake();
  }
}

function foundCake() {
  if (cakeFound) return;
  cakeFound = true;
  stopCakeGame();
  room.classList.add('found');
  cakeSpot.classList.add('found');

  if (dpad) dpad.classList.add('hidden');
  if (birthdayConsole) {
    birthdayConsole.classList.add('active');
    birthdayConsole.setAttribute('aria-hidden', 'false');
  }

  if (cakeHint) cakeHint.textContent = 'Yay! Dah sampai! Selamat Hari Lahir Sayang! 💕';

  vibrate([80, 60, 80]);
  burstHearts(80);
  launchConfetti();
  launchRoomConfetti();
  startPartyEffects();
  lotsoReact('jump', 'lotsoRoom');

  // Pause background music and play birthday song (only ONE song)
  wasMusicPlaying = musicStarted && !music.paused;
  if (wasMusicPlaying) music.pause();

  playHappyBirthdaySong();
}

/* ---------- Birthday song ---------- */
function resumeBackgroundMusic() {
  if (wasMusicPlaying && musicStarted) {
    music.play().catch(() => {});
  }
}

function playHappyBirthdaySong() {
  if (!birthdaySong) return;
  birthdaySong.currentTime = 0;
  birthdaySong.volume = 0.85;
  birthdaySong.play().catch(() => {
    resumeBackgroundMusic();
  });
}

/* ---------- D-pad controls ---------- */
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
      if (cakeMoveRepeat) return;
      const dir = dirs[btn.dataset.dir];
      moveLotso(dir[0], dir[1]);
      cakeMoveRepeat = setInterval(() => moveLotso(dir[0], dir[1]), 90);
    };
    const stopMove = () => {
      clearInterval(cakeMoveRepeat);
      cakeMoveRepeat = null;
    };

    btn.addEventListener('pointerdown', startMove);
    btn.addEventListener('pointerup', stopMove);
    btn.addEventListener('pointerleave', stopMove);
    btn.addEventListener('pointercancel', stopMove);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
  });
}

/* ---------- Keyboard controls ---------- */
document.addEventListener('keydown', (e) => {
  if (!room || !cakeGameActive || cakeFound) return;
  const dirMap = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
  };
  if (dirMap[e.key]) {
    e.preventDefault();
    moveLotso(...dirMap[e.key]);
  }
});

function restartCakeGame() {
  // Stop any birthday song currently playing
  if (birthdaySong) {
    birthdaySong.pause();
    birthdaySong.currentTime = 0;
  }

  // Resume background music if it was playing before
  resumeBackgroundMusic();

  // Clear party sparkles
  const partySparkles = document.getElementById('partySparkles');
  if (partySparkles) partySparkles.innerHTML = '';

  // Reset UI
  if (dpad) dpad.classList.remove('hidden');
  if (birthdayConsole) {
    birthdayConsole.classList.remove('active');
    birthdayConsole.setAttribute('aria-hidden', 'true');
  }

  // Reset positions and restart
  cakeFound = false;
  cakeGameActive = true;
  room.classList.remove('found');
  cakeSpot.classList.remove('found');
  if (roomOverlay) roomOverlay.style.opacity = '';
  if (cakeHint) cakeHint.textContent = 'Sila jalan-jalan ikut je anak panah tu ye.';

  const roomRect = room.getBoundingClientRect();
  lotsoPos.x = 20;
  lotsoPos.y = Math.max(0, roomRect.height * 0.12);
  clampLotsoPosition();
  updateLotsoPosition();
  updateSpotlight();
}

/* ---------- Extra party effects ---------- */
function startPartyEffects() {
  const sparklesContainer = document.getElementById('partySparkles');
  if (!sparklesContainer) return;
  sparklesContainer.innerHTML = '';

  const symbols = ['✨', '💖', '🎀', '⭐', '🍓', '💫'];
  for (let i = 0; i < 36; i++) {
    const s = document.createElement('div');
    s.className = 'party-sparkle';
    s.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = Math.random() * 1.2 + 's';
    s.style.fontSize = (0.7 + Math.random() * 1.2) + 'rem';
    sparklesContainer.appendChild(s);
  }
}

function launchRoomConfetti() {
  const colors = ['#ff4d6d', '#ff8fab', '#ffb3c1', '#fff', '#ffccd5', '#c77dff', '#ffd700'];
  for (let i = 0; i < 120; i++) {
    const c = document.createElement('div');
    c.style.position = 'fixed';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.top = '-10px';
    c.style.width = (6 + Math.random() * 10) + 'px';
    c.style.height = (6 + Math.random() * 10) + 'px';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    c.style.zIndex = '300';
    c.style.pointerEvents = 'none';
    c.style.transition = `top ${2 + Math.random() * 3}s linear, transform ${2 + Math.random() * 3}s linear`;
    document.body.appendChild(c);

    requestAnimationFrame(() => {
      c.style.top = '110vh';
      c.style.transform = `rotate(${Math.random() * 360}deg)`;
    });

    setTimeout(() => c.remove(), 5500);
  }
}

/* ---------- Auto-start if this is the cake page ---------- */
window.addEventListener('DOMContentLoaded', () => {
  initCakeControls();
  if (birthdaySong) birthdaySong.addEventListener('ended', resumeBackgroundMusic);
  if (room) startCakeGame();
});
