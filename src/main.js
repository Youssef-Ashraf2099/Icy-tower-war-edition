import { Game } from './engine/Game.js';
import { assets } from './assets/AssetLoader.js';
import { sounds } from './audio/SoundEffects.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  // Initialize Game Controller
  const game = new Game(canvas);

  // Preload Generated Assets
  try {
    await assets.loadAll();
  } catch (err) {
    console.error('Asset loading error:', err);
  }

  // Setup DOM UI Buttons
  const btnStart = document.getElementById('btn-start');
  const btnStartCheckpoint = document.getElementById('btn-start-checkpoint');
  const btnTutorial = document.getElementById('btn-tutorial');
  const btnCloseTutorial = document.getElementById('btn-close-tutorial');
  const btnRestart = document.getElementById('btn-restart');
  const btnRestartCheckpoint = document.getElementById('btn-restart-checkpoint');
  const btnMainMenu = document.getElementById('btn-main-menu');
  const tutorialModal = document.getElementById('tutorial-modal');
  const gameOverModal = document.getElementById('game-over-modal');
  const mainMenuModal = document.getElementById('main-menu');

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      game.startMission(0);
    });
  }

  if (btnStartCheckpoint) {
    btnStartCheckpoint.addEventListener('click', () => {
      game.startMission(game.unlockedCheckpoint);
    });
  }

  if (btnTutorial) {
    btnTutorial.addEventListener('click', () => {
      tutorialModal.classList.add('active');
    });
  }

  if (btnCloseTutorial) {
    btnCloseTutorial.addEventListener('click', () => {
      tutorialModal.classList.remove('active');
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      game.startMission(0);
    });
  }

  if (btnRestartCheckpoint) {
    btnRestartCheckpoint.addEventListener('click', () => {
      game.startMission(game.unlockedCheckpoint);
    });
  }

  const btnSound = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const soundLabel = document.getElementById('sound-label');
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      sounds.enabled = !sounds.enabled;
      if (soundIcon) soundIcon.textContent = sounds.enabled ? '🔊' : '🔇';
      if (soundLabel) soundLabel.textContent = sounds.enabled ? 'AUDIO ON' : 'AUDIO OFF';
    });
  }

  if (btnMainMenu) {
    btnMainMenu.addEventListener('click', () => {
      gameOverModal.classList.remove('active');
      mainMenuModal.classList.add('active');
      game.state = 'MENU';
      game.updateMenuStats();
    });
  }

  // Refresh menu statistics and checkpoint status
  game.updateMenuStats();

  // ── Menu Particle System ──────────────────────────────────────────────────
  const particleCanvas = document.getElementById('menu-particle-canvas');
  let particleAnimId = null;
  const particles = [];

  function resizeParticleCanvas() {
    if (!particleCanvas) return;
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }
  resizeParticleCanvas();
  window.addEventListener('resize', resizeParticleCanvas);

  const PARTICLE_COUNT = 90;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const isAmber = Math.random() < 0.72;
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -(Math.random() * 1.6 + 0.6), // upward rising embers from the blast furnaces
      size: Math.random() * 2.8 + 0.8,
      alpha: Math.random() * 0.7 + 0.25,
      baseColor: isAmber ? '255, 160, 20' : '0, 240, 255',
      swaySpeed: Math.random() * 0.03 + 0.012,
      swayOffset: Math.random() * Math.PI * 2,
    });
  }

  function animateParticles() {
    if (!particleCanvas) return;
    const ctx = particleCanvas.getContext('2d');
    const W = particleCanvas.width;
    const H = particleCanvas.height;
    ctx.clearRect(0, 0, W, H);

    // Render Rising War Tower Embers and Cyber Spark Particles
    for (const p of particles) {
      p.swayOffset += p.swaySpeed;
      p.x += p.vx + Math.sin(p.swayOffset) * 0.5;
      p.y += p.vy;

      const flicker = 0.7 + 0.3 * Math.sin(p.swayOffset * 2.5);
      const a = p.alpha * flicker;

      // Glow halo
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5);
      grad.addColorStop(0, `rgba(${p.baseColor}, ${a * 0.75})`);
      grad.addColorStop(1, `rgba(${p.baseColor}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Bright core spark
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, a * 1.6)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Wrap around edges: when rising above screen, re-spawn below bottom
      if (p.y < -20) {
        p.y = H + 20;
        p.x = Math.random() * W;
      }
      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;
    }

    particleAnimId = requestAnimationFrame(animateParticles);
  }

  // Start particles when menu is visible, stop when hidden
  function startMenuParticles() {
    if (!particleAnimId) animateParticles();
  }
  function stopMenuParticles() {
    if (particleAnimId) { cancelAnimationFrame(particleAnimId); particleAnimId = null; }
  }
  startMenuParticles();

  // ── Lore Ticker Cycling ───────────────────────────────────────────────────
  const loreTicker = document.getElementById('menu-lore-ticker');
  const loreLines = [
    'The tower must not fall. Ascend. Engage all hostiles. Reach the apex.',
    'Enemy drones detected at all elevations. Thermal bombardment rising from below.',
    'Adrenaline surge available — activate when meter is full for bullet-time.',
    'Double-jump mastery is essential. Momentum is your greatest weapon.',
    'Wall-kick off fortress walls to chain aerial combos and reach new heights.',
    'Checkpoint unlocked at FL-50. All operators may fast-deploy directly to sector.',
    'Incoming transmission: hostiles have fortified the upper citadel. Proceed with extreme prejudice.',
  ];
  let loreIndex = 0;
  if (loreTicker) {
    setInterval(() => {
      loreTicker.style.opacity = '0';
      loreTicker.style.transform = 'translateY(8px)';
      setTimeout(() => {
        loreIndex = (loreIndex + 1) % loreLines.length;
        loreTicker.textContent = loreLines[loreIndex];
        loreTicker.style.opacity = '1';
        loreTicker.style.transform = 'translateY(0)';
      }, 400);
    }, 5500);
  }

  // ── Fixed Timestep Game Loop ──────────────────────────────────────────────
  let lastTime = performance.now();
  const FIXED_DT = 1 / 60;
  let accumulator = 0;

  function loop(currentTime) {
    const frameTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    accumulator += frameTime;

    while (accumulator >= FIXED_DT) {
      game.update(FIXED_DT);
      accumulator -= FIXED_DT;
    }

    // Pause particles during gameplay
    if (game.state === 'MENU') {
      startMenuParticles();
    } else {
      stopMenuParticles();
    }

    game.render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
