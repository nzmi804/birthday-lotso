/* ==========================
   Shared effects, music, reasons, confetti, typewriter
   ========================== */

let musicStarted = false;
let revealedReasons = 0;

/* ---------- Background music ---------- */
const music = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

function startBackgroundMusic() {
  if (musicStarted || !music || window.birthdaySongPlaying) return;
  music.volume = 0.9;
  music.play().then(() => {
    musicStarted = true;
    sessionStorage.setItem('musicPlaying', 'true');
    updateMusicToggle(true);
  }).catch(() => {
    // Autoplay blocked; user can still use the toggle button
  });
}

function toggleMusic() {
  if (!musicStarted) {
    startBackgroundMusic();
    return;
  }

  if (music.paused) {
    music.play();
    sessionStorage.setItem('musicPlaying', 'true');
    updateMusicToggle(true);
  } else {
    music.pause();
    sessionStorage.setItem('musicPlaying', 'false');
    updateMusicToggle(false);
  }
}

function updateMusicToggle(playing) {
  if (!musicToggle) return;
  if (playing) {
    musicToggle.classList.remove('muted');
    musicToggle.textContent = '🎵';
  } else {
    musicToggle.classList.add('muted');
    musicToggle.textContent = '🔇';
  }
}

function enableAutoMusic() {
  if (!music || musicStarted) return;
  const startOnce = () => startBackgroundMusic();
  window.addEventListener('click', startOnce, { once: true });
  window.addEventListener('touchstart', startOnce, { once: true });
  window.addEventListener('keydown', startOnce, { once: true });
}

function initMusicState() {
  window.birthdaySongPlaying = false;
  if (!music) {
    updateMusicToggle(false);
    enableAutoMusic();
    return;
  }

  music.volume = 0.9;
  music.play().then(() => {
    musicStarted = true;
    sessionStorage.setItem('musicPlaying', 'true');
    updateMusicToggle(true);
  }).catch(() => updateMusicToggle(false));

  enableAutoMusic();
}

function retryAutoPlay() {
  if (!music || musicStarted || window.birthdaySongPlaying) return;
  music.play().then(() => {
    musicStarted = true;
    sessionStorage.setItem('musicPlaying', 'true');
    updateMusicToggle(true);
  }).catch(() => {});
}

/* ---------- Custom video placeholder (Lotso + play button) ---------- */
function initVideoPlaceholder() {
  const lotsoBtn = document.getElementById('lotsoVideoBtn');
  const placeholder = document.getElementById('videoPlaceholder');
  const video = document.getElementById('birthdayVideo');
  if (!lotsoBtn || !placeholder || !video) return;

  lotsoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    placeholder.style.display = 'none';
    video.style.display = 'block';
    video.setAttribute('controls', 'true');
    video.play().catch(() => {});
  });
}

/* ---------- Pause music while watching the special video ---------- */
function initVideoMusic() {
  const video = document.getElementById('birthdayVideo');
  const nextBtn = document.getElementById('videoNextBtn');
  if (!video || !music) return;
  let pausedByVideo = false;

  video.addEventListener('play', () => {
    if (!music.paused) {
      music.pause();
      pausedByVideo = true;
      updateMusicToggle(false);
    }
  });

  const maybeResume = () => {
    if (pausedByVideo && sessionStorage.getItem('musicPlaying') === 'true') {
      music.play().then(() => updateMusicToggle(true)).catch(() => {});
    }
    pausedByVideo = false;
  };

  video.addEventListener('pause', maybeResume);
  video.addEventListener('ended', () => {
    maybeResume();
    if (nextBtn) nextBtn.classList.remove('hidden');
  });
}

/* ---------- Background particles ---------- */
const bgParticles = document.getElementById('bgParticles');
const particleTypes = ['💖', '🍓', '✨', '🎀', '🧸', '💕'];

function createParticle() {
  const p = document.createElement('div');
  p.className = 'particle';
  p.textContent = particleTypes[Math.floor(Math.random() * particleTypes.length)];
  p.style.left = Math.random() * 100 + 'vw';
  p.style.fontSize = (1.2 + Math.random() * 1.4) + 'rem';
  p.style.animationDuration = (6 + Math.random() * 8) + 's';
  p.style.opacity = 0.5 + Math.random() * 0.4;
  bgParticles.appendChild(p);

  setTimeout(() => p.remove(), 14000);
}

setInterval(createParticle, 700);

/* ---------- Reasons why I love you ---------- */
const reasonsData = [
  '💗 Sayang selalu bagi abi semangat untuk jadi lebih baik 🌷',
  '💗 Sayang percaya pada kemampuan abi, walaupun kadang-kadang abi sendiri ragu 🥺',
  '💗 Sayang seorang yang sangat baik hati, lembut, dan suka tolong orang 🤍',
  '💗 Sayang seorang yang tabah dan kuat bila hadap dugaan hidup 💕',
  '💗 Abi bangga dengan sayang sebab walaupun banyak benda sayang pendam, sayang masih mampu senyum 🥺',
  '💗 Abi tahu bukan semua benda mudah untuk sayang, tapi sayang tetap cuba bertahan 🤍',
  '💗 Sayang seorang yang ceria, walaupun dalam hati ada banyak rasa yang sayang simpan 🌸',
  '💗 Dengan sayang, abi tak pernah rasa serabut sebab sayang sangat tenang dan menenangkan 🌻',
  '💗 Perangai sayang yang comel tu selalu buat abi makin sayang dekat sayang 🥰',
  '💗 Sayang selalu ada dengan abi, waktu abi kuat mahupun waktu abi rasa lemah 🫶'
];

function initReasons() {
  const grid = document.getElementById('reasonsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  reasonsData.forEach((text) => {
    const item = document.createElement('div');
    item.className = 'reason-item';
    item.innerHTML = `
      <div class="reason-heart">❤️</div>
      <div class="reason-text">${text}</div>
    `;
    item.addEventListener('click', () => revealReason(item));
    grid.appendChild(item);
  });
}

function revealReason(item) {
  if (item.classList.contains('revealed')) return;
  item.classList.add('revealed');
  revealedReasons++;
  vibrate(25);

  if (revealedReasons >= reasonsData.length) {
    document.getElementById('reasonsNextBtn').classList.remove('hidden');
    burstHearts(20);
    vibrate([40, 30, 40]);
  }
}

/* ---------- Lotso reactions ---------- */
function lotsoReact(type, elementId = 'lotsoGame') {
  const lotso = document.getElementById(elementId);
  if (!lotso) return;

  lotso.classList.remove('jump', 'hug', 'wiggle', 'shake');
  void lotso.offsetWidth;
  lotso.classList.add(type);

  setTimeout(() => {
    lotso.classList.remove(type);
  }, 800);
}

/* ---------- Haptic feedback (mobile) ---------- */
function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/* ---------- Heart burst effect ---------- */
function burstHearts(count) {
  for (let i = 0; i < count; i++) {
    const h = document.createElement('div');
    h.textContent = ['💖', '💕', '🍓', '✨'][Math.floor(Math.random() * 4)];
    h.style.position = 'fixed';
    h.style.left = (Math.random() * 100) + 'vw';
    h.style.top = (Math.random() * 100) + 'vh';
    h.style.fontSize = (1 + Math.random() * 2) + 'rem';
    h.style.pointerEvents = 'none';
    h.style.zIndex = '300';
    h.style.opacity = '1';
    h.style.transition = 'all 1.2s ease-out';
    document.body.appendChild(h);

    requestAnimationFrame(() => {
      h.style.transform = `translate(${Math.random() * 200 - 100}px, ${Math.random() * -300 - 50}px) scale(1.5)`;
      h.style.opacity = '0';
    });

    setTimeout(() => h.remove(), 1300);
  }
}

/* ---------- Typewriter message ---------- */
const letterEl = document.getElementById('letter');
let typingTimeout;
let typingIndex;
const fullMessage = `
Happy birthday sayanggg ❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️

Hari ini hari yang sangat istimewa untuk sayang, dan abi harap sayang tahu betapa berharganya sayang dalam hidup abi. Abi mungkin tak selalu pandai tunjuk dengan cara yang sempurna, tapi jauh dalam hati abi, abi sangat bersyukur sebab Tuhan hadirkan sayang dalam hidup abi.

Abi tahu sepanjang hidup sayang, sayang dah lalui banyak benda. Banyak ujian, banyak penat, banyak perkara yang mungkin orang lain tak nampak. Kadang-kadang sayang kena kuat walaupun sebenarnya hati sayang sendiri penat. Kadang-kadang sayang senyum, tapi dalam hati ada benda yang sayang simpan sendiri. Abi tahu bukan semua hari mudah untuk sayang, tapi abi sangat bangga dengan sayang sebab sayang masih terus kuat, masih terus bertahan, dan masih cuba jadi yang terbaik walaupun hidup tak selalu berpihak pada sayang.

Untuk hari lahir sayang ini, abi doakan semoga Allah permudahkan semua urusan sayang. Semoga apa yang sayang impikan satu-satu akan jadi kenyataan. Semoga sayang sentiasa diberikan kesihatan, rezeki yang luas, hati yang tenang, dan kebahagiaan yang tak putus-putus. Abi harap lepas ini hidup sayang akan lebih banyak senyuman daripada air mata, lebih banyak bahagia daripada sedih, dan lebih banyak perkara baik datang dalam hidup sayang.

Abi juga nak minta maaf dari hati abi. Maaf kalau selama ini ada kekurangan abi yang buat sayang terasa. Maaf kalau ada kata-kata abi yang menyakitkan hati sayang, ada perbuatan abi yang buat sayang kecewa, atau ada masa abi tak faham apa yang sayang rasa. Abi tahu abi tak sempurna. Abi pun ada banyak kelemahan, banyak kurang, dan mungkin kadang-kadang abi buat sayang rasa penat dengan abi. Tapi percayalah, abi tak pernah berniat nak lukakan hati sayang.

Abi cuma harap sayang tahu yang abi sayang sayang dengan cara abi. Mungkin kadang-kadang abi tak pandai susun ayat, tak pandai pujuk dengan sempurna, dan tak selalu jadi seperti yang sayang harapkan. Tapi abi akan cuba perbaiki diri abi, perlahan-lahan, supaya abi boleh jadi seseorang yang lebih baik untuk sayang.

Terima kasih sebab hadir dalam hidup abi. Terima kasih sebab masih ada, masih bertahan, dan masih beri ruang untuk abi kenal sayang. Sayang bukan sekadar seseorang yang abi sayang, tapi sayang juga seseorang yang banyak ajar abi tentang sabar, tentang menghargai, dan tentang erti hadirnya seseorang yang istimewa.

Pada hari lahir sayang ini, abi cuma nak sayang rasa dihargai. Abi nak sayang tahu yang sayang layak untuk disayangi dengan baik, layak untuk bahagia, dan layak untuk semua perkara indah dalam hidup. Semoga hari ini menjadi permulaan kepada tahun yang lebih baik untuk sayang.

Happy birthday sayangggg ❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️

Semoga sayang terus kuat, terus cantik dengan cara sayang sendiri, terus bahagia, dan terus jadi insan yang abi kenal sebagai seseorang yang sangat istimewa.

Abi love you, sayang. Abi harap birthday wish ini dapat buat sayang rasa betapa sayang sangat disayangi, dihargai, dan tak pernah keseorangan. ❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️
`;

function typeMessage() {
  stopTyping();
  if (!letterEl) return;
  letterEl.innerHTML = '<span class="typing-cursor"></span>';
  typingIndex = 0;

  function typeChar() {
    if (typingIndex < fullMessage.length) {
      letterEl.innerHTML = fullMessage.substring(0, typingIndex + 1).replace(/\n/g, '<br>') + '<span class="typing-cursor"></span>';
      typingIndex++;
      typingTimeout = setTimeout(typeChar, 70);
    } else {
      letterEl.innerHTML = fullMessage.replace(/\n/g, '<br>');
      launchConfetti();
      const nextBtn = document.getElementById('msgNextBtn');
      if (nextBtn) nextBtn.classList.remove('hidden');
    }
  }

  typeChar();
}

function stopTyping() {
  clearTimeout(typingTimeout);
}

/* ---------- Confetti finale ---------- */
function launchConfetti() {
  const colors = ['#ff4d6d', '#ff8fab', '#ffb3c1', '#fff', '#ffccd5', '#c77dff'];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    c.style.width = (6 + Math.random() * 8) + 'px';
    c.style.height = (6 + Math.random() * 8) + 'px';
    c.style.animationDuration = (2 + Math.random() * 3) + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}

/* ---------- Restart ---------- */
function restart() {
  revealedReasons = 0;
  document.querySelectorAll('.reason-item').forEach(item => item.classList.remove('revealed'));
  const reasonsNext = document.getElementById('reasonsNextBtn');
  if (reasonsNext) reasonsNext.classList.add('hidden');

  stopTyping();
  sessionStorage.setItem('musicPlaying', (musicStarted && !music.paused) ? 'true' : 'false');
  window.location.href = 'index.html';
}

/* ---------- Initialize ---------- */
window.addEventListener('DOMContentLoaded', () => {
  createParticle();
  initReasons();
  initMusicState();
  initVideoPlaceholder();
  initVideoMusic();
});
