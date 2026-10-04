import { assets } from '../assets/AssetLoader.js';
import { sprites } from '../assets/SpriteManager.js';
import { sounds } from '../audio/SoundEffects.js';
import { music } from '../audio/MusicEngine.js';
import { Player } from './Player.js';
import { PlatformManager } from './PlatformManager.js';
import { WeaponManager } from '../combat/Weapons.js';
import { EnemyManager } from '../combat/Enemies.js';
import { ParticleSystem } from '../juice/ParticleSystem.js';
import { ComboManager } from '../juice/ComboManager.js';
import { InteractiveBackground } from '../juice/InteractiveBackground.js';
import { PostProcessing } from '../juice/PostProcessing.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.width = window.innerWidth || 1024;
    this.height = window.innerHeight || 768;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.player = new Player(this.width);
    this.platforms = new PlatformManager();
    this.weapons = new WeaponManager();
    this.enemies = new EnemyManager();
    this.particles = new ParticleSystem();
    this.combos = new ComboManager();
    this.interactiveBg = new InteractiveBackground(document.getElementById('interactive-bg-wrap'));
    this.postProcessing = new PostProcessing(this.canvas);
    this.music = music;

    // Apply saved screen shake multiplier
    this.particles.shakeMultiplier = this.postProcessing.settings.shakeMultiplier;

    this.state = 'MENU';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('wartower_highscore') || '0', 10);
    this.highFloor = parseInt(localStorage.getItem('wartower_highfloor') || '0', 10);
    this.unlockedCheckpoint = parseInt(localStorage.getItem('wartower_checkpoint') || '0', 10);

    // Initial camera centered on Harold
    this.cameraY = this.player.y - (this.height * 0.65);
    this.dangerY = 1400;
    this.dangerSpeed = 35;
    this.dangerPaused = true;
    this.currentCheckpointFloor = 0;
    this.fluidTime = 0;
    this.initFluidBubbles();

    this.defeatedBosses = new Set();
    this.announcedSectors = new Set();
    this.commsKeyHandler = null;

    this.keys = {};
    this.mouse = {
      canvasX: this.width / 2,
      canvasY: this.height / 2,
      leftDown: false,
      rightDown: false
    };

    this.setupInputs();
    this.setupComboCallbacks();
    this.updateMenuStats();
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  initFluidBubbles() {
    this.fluidBubbles = [];
    for (let i = 0; i < 28; i++) {
      this.fluidBubbles.push({
        x: Math.random() * (this.width || 1024),
        relDepth: 20 + Math.random() * 220,
        radius: 2 + Math.random() * 4.5,
        speed: 22 + Math.random() * 38,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      // Audio unlocking on first user interaction
      sounds.init();
      this.music.init();

      // Prevent spacebar from triggering focused DOM buttons & page scrolling
      if (e.code === 'Space') {
        e.preventDefault();
      }

      this.keys[e.code] = true;

      // Settings / Pause shortcut
      if ((e.code === 'Escape' || e.code === 'KeyP') && (this.state === 'PLAYING' || this.state === 'SETTINGS')) {
        e.preventDefault();
        this.toggleSettingsModal();
        return;
      }

      // Only launch from menu on Spacebar if strictly in MENU state
      if (e.code === 'Space' && this.state === 'MENU') {
        this.startMission();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
      }
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.canvasX = e.clientX - rect.left;
      this.mouse.canvasY = e.clientY - rect.top;

      const crosshair = document.getElementById('custom-crosshair');
      if (crosshair) {
        crosshair.style.left = `${e.clientX}px`;
        crosshair.style.top = `${e.clientY}px`;
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      sounds.init();
      this.music.init();
      if (e.button === 0) this.mouse.leftDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.leftDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  toggleSettingsModal() {
    const modal = document.getElementById('tutorial-modal');
    if (!modal) return;
    if (this.state === 'SETTINGS') {
      modal.classList.remove('active');
      this.state = 'PLAYING';
      this.canvas.focus();
    } else if (this.state === 'PLAYING') {
      this.state = 'SETTINGS';
      modal.classList.add('active');
    }
  }

  setupComboCallbacks() {
    this.combos.onComboChange = (info) => {
      const display = document.getElementById('combo-display');
      const text = document.getElementById('combo-text');
      const mult = document.getElementById('combo-multiplier');
      const bar = document.getElementById('combo-timer-bar');
      const badge = document.getElementById('combo-rank-badge');
      const letter = document.getElementById('combo-rank-letter');

      if (!display) return;

      if (info.isActive && info.count > 0) {
        display.classList.add('active');
        const rankLetter = info.rank ? (info.rank.rank || 'D') : 'D';
        const rankColor = info.rank ? info.rank.color : '#cd7f32';
        const rankTitle = info.rank ? info.rank.label : 'CYBER COMBAT';

        text.innerText = info.rank ? info.rank.label : `${info.count} FLOORS!`;
        if (info.rank) text.style.color = rankColor;
        mult.innerText = `COMBO x${info.count}`;
        bar.style.width = `${info.timerPct * 100}%`;

        const titleEl = document.getElementById('combo-rank-capsule-title');
        if (titleEl) {
          titleEl.innerText = rankTitle;
          titleEl.style.color = rankColor;
        }

        // Military Rank Shield Badge
        if (badge && letter) {
          letter.innerText = rankLetter;
          badge.style.borderColor = rankColor;
          badge.style.boxShadow = `0 0 25px ${rankColor}`;
        }
      } else {
        display.classList.remove('active');
      }
    };

    this.combos.onComboEnd = (result) => {
      if (result.bonusScore > 0) {
        this.score += result.bonusScore;
        this.particles.addFloatingText(
          this.player.x + this.player.width / 2,
          this.player.y - 25,
          `+${result.bonusScore} COMBO BONUS!`,
          '#ffd700',
          24
        );
      }
    };
  }

  startMission(startingFloor = 0) {
    // Unfocus all DOM buttons to prevent spacebar re-triggering click events!
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    this.canvas.focus();

    sounds.init();
    this.music.init();
    sprites.init();
    this.state = 'PLAYING';
    this.score = startingFloor > 0 ? startingFloor * 500 : 0;

    const startingSector = Math.min(5, Math.floor(startingFloor / 50) + 1);
    this.music.setSector(startingSector);
    this.music.setState('PLAYING');

    this.defeatedBosses.clear();
    this.announcedSectors.clear();
    if (startingFloor >= 50) this.announcedSectors.add(1);
    if (startingFloor >= 100) this.announcedSectors.add(2);
    if (startingFloor >= 150) this.announcedSectors.add(3);
    if (startingFloor >= 200) this.announcedSectors.add(4);

    this.player.reset(this.width, startingFloor);
    this.player.x = this.width / 2 - this.player.width / 2;
    this.platforms.reset(startingFloor);
    this.weapons.setWeapon(startingFloor >= 100 ? 'RAILGUN' : (startingFloor >= 50 ? 'RPG' : 'RIFLE'));
    this.enemies.reset();
    this.combos.reset();

    // Mission start spawn shockwave
    this.postProcessing.addShockwave(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height,
      180,
      '#00f0ff',
      0.45
    );

    this.cameraY = this.player.y - (this.height * 0.65);

    // Freeze thermal fluid at checkpoint/start until player climbs into next sector
    this.currentCheckpointFloor = startingFloor;
    this.dangerPaused = true;
    this.dangerY = this.cameraY + this.height + 400;
    this.dangerSpeed = 35 + Math.min(160, startingFloor * 1.6);

    const dangerWarning = document.getElementById('danger-warning');
    if (dangerWarning) dangerWarning.style.display = 'none';

    const commsModal = document.getElementById('campaign-modal');
    if (commsModal) commsModal.classList.remove('active');
    const bossHud = document.getElementById('boss-hud');
    if (bossHud) bossHud.classList.add('hidden');

    document.getElementById('main-menu').classList.remove('active');
    document.getElementById('game-over-modal').classList.remove('active');
    this.updateHUD();
  }

  gameOver() {
    this.state = 'GAMEOVER';
    this.music.setState('GAMEOVER');
    sounds.playExplosion(true);
    this.particles.addExplosion(this.player.x + 16, this.player.y + 20, true);
    this.postProcessing.triggerAberration(1.0, 0.65);
    this.postProcessing.addShockwave(this.player.x + 16, this.player.y + 20, 380, '#ff1a3b', 0.6);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('wartower_highscore', this.highScore.toString());
    }
    if (this.player.highestFloor > this.highFloor) {
      this.highFloor = this.player.highestFloor;
      localStorage.setItem('wartower_highfloor', this.highFloor.toString());
    }

    document.getElementById('final-floor').innerText = `FLOOR ${this.player.highestFloor}`;
    document.getElementById('final-score').innerText = this.score.toLocaleString();
    document.getElementById('final-kills').innerText = this.enemies.totalKills.toString();
    document.getElementById('final-combo').innerText = `x${this.combos.comboCount || 0}`;

    document.getElementById('game-over-modal').classList.add('active');
    this.updateMenuStats();
  }

  updateMenuStats() {
    const hf = document.getElementById('menu-high-floor');
    const hs = document.getElementById('menu-high-score');
    if (hf) hf.innerText = `FL-${this.highFloor.toString().padStart(3, '0')}`;
    if (hs) hs.innerText = `${this.highScore.toLocaleString()} PTS`;

    const btnStartCp = document.getElementById('btn-start-checkpoint');
    const btnRestartCp = document.getElementById('btn-restart-checkpoint');
    const menuCpStat = document.getElementById('menu-checkpoint-stat');

    if (this.unlockedCheckpoint >= 50) {
      if (btnStartCp) {
        btnStartCp.style.display = 'flex';
        const txt = btnStartCp.querySelector('.checkpoint-target-text');
        if (txt) txt.innerText = `FL-${this.unlockedCheckpoint}`;
      }
      if (btnRestartCp) {
        btnRestartCp.style.display = 'flex';
        const txt = btnRestartCp.querySelector('.checkpoint-target-text');
        if (txt) txt.innerText = `FL-${this.unlockedCheckpoint}`;
      }
      if (menuCpStat) {
        menuCpStat.style.display = 'inline';
        menuCpStat.innerText = `CHECKPOINT: FL-${this.unlockedCheckpoint}`;
      }
    } else {
      if (btnStartCp) btnStartCp.style.display = 'none';
      if (btnRestartCp) btnRestartCp.style.display = 'none';
      if (menuCpStat) menuCpStat.style.display = 'none';
    }
  }

  update(dt) {
    this.lastDt = dt;
    if (this.state !== 'PLAYING') {
      this.particles.update(dt, this.platforms.platforms);
      this.postProcessing.update(dt, this.player);
      if (this.interactiveBg) {
        this.interactiveBg.update(
          this.cameraY,
          this.player ? this.player.highestFloor : 0,
          0,
          0,
          dt
        );
      }
      return;
    }

    const effectiveDt = this.player.isOverdrive ? dt * 0.5 : dt;

    // Advance liquid thermal fluid wave time and bubbles
    this.fluidTime = (this.fluidTime || 0) + effectiveDt;
    if (this.fluidBubbles) {
      for (const b of this.fluidBubbles) {
        b.relDepth -= b.speed * effectiveDt;
        b.wobble += effectiveDt * 3.8;
        b.x += Math.sin(b.wobble) * 14 * effectiveDt;
        if (b.relDepth <= 0) {
          b.relDepth = 180 + Math.random() * 120;
          b.x = Math.random() * this.width;
        }
      }
    }

    // 360° Cursor Aiming Angle
    const playerScreenY = this.player.y - this.cameraY;
    const playerScreenX = this.player.x + this.player.width / 2;
    this.player.aimAngle = Math.atan2(
      this.mouse.canvasY - playerScreenY,
      this.mouse.canvasX - playerScreenX
    );

    // Inputs
    this.player.handleInput(this.keys, this.mouse, effectiveDt);

    // Continuous shoot on mouse hold
    if (this.mouse.leftDown && this.weapons.canFire()) {
      const recoil = this.weapons.shoot(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        this.player.aimAngle,
        this.particles
      );
      this.player.applyRecoil(recoil.rx, recoil.ry);
      if (this.interactiveBg) {
        this.interactiveBg.triggerWeaponFire(this.weapons.currentWeapon.id);
      }
    }

    // Update Player & Platforms
    this.player.update(effectiveDt, this.platforms.platforms, this.cameraY, this.particles, this.combos, this.width);
    this.platforms.update(effectiveDt, this.cameraY, this.player);

    // Check if player touched and claimed a Checkpoint floor
    if (this.player.reachedCheckpoint) {
      const cpFloor = this.player.reachedCheckpoint;
      this.player.reachedCheckpoint = null;
      if (cpFloor > this.unlockedCheckpoint) {
        this.unlockedCheckpoint = cpFloor;
        localStorage.setItem('wartower_checkpoint', this.unlockedCheckpoint.toString());
      }
      this.currentCheckpointFloor = cpFloor;
      // Completely pause thermal fluid from rising while player is on checkpoint
      this.dangerPaused = true;
      this.dangerY = this.cameraY + this.height + 600; // Drop far below screen
      this.score += 2500;
      this.particles.addFloatingText(
        this.player.x + this.player.width / 2,
        this.player.y - 40,
        `★ CHECKPOINT FL-${cpFloor} REACHED ★`,
        '#00f0ff',
        22
      );
      this.updateMenuStats();

      // Trigger Sector Boss Encounter if not already defeated in this run!
      if (cpFloor > 0 && cpFloor % 50 === 0 && !this.defeatedBosses.has(cpFloor)) {
        this.enemies.spawnCheckpointBoss(cpFloor, this.cameraY, this.width);
        this.music.setState('BOSS');
        this.postProcessing.addShockwave(this.width / 2, this.cameraY + 160, 420, '#ff2a4b', 0.8);
        this.postProcessing.triggerAberration(0.85, 0.5);
        this.particles.addFloatingText(
          this.player.x + this.player.width / 2,
          this.player.y - 70,
          '⚠ SECTOR BOSS INCOMING! ⚠',
          '#ff2a4b',
          28
        );
      }
    }

    // Keep danger strictly frozen while fighting a boss
    if (this.enemies.boss) {
      this.dangerPaused = true;
      this.dangerY = this.cameraY + this.height + 600;
    } else if (this.dangerPaused && this.player.highestFloor > this.currentCheckpointFloor + 1) {
      // Unpause when player proceeds beyond the checkpoint floor into higher elevation
      this.dangerPaused = false;
      this.dangerY = this.cameraY + this.height + 250;
      this.particles.addFloatingText(
        this.player.x + this.player.width / 2,
        this.player.y - 30,
        'THERMAL THREAT ACTIVE!',
        '#ffaa00',
        18
      );
    }

    // Procedural enemy spawning as Harold ascends (within 850px radar above camera)
    for (const plat of this.platforms.platforms) {
      if (!plat.enemiesSpawned && plat.floor > 1 && plat.type !== 'CHECKPOINT') {
        if (plat.y > this.cameraY - 850 && plat.y < this.cameraY + this.height + 200) {
          plat.enemiesSpawned = true;
          this.enemies.spawnForPlatform(plat);
        }
      }
    }

    // Boss at floor 35+ (currently disabled until boss arenas are ready)
    this.enemies.checkBossSpawn(this.player.highestFloor, this.cameraY, this.width);

    this.weapons.update(effectiveDt, this.particles);
    this.enemies.update(effectiveDt, this.player, this.particles, this.cameraY, this.width);
    this.particles.update(effectiveDt, this.platforms.platforms);
    this.combos.update(effectiveDt);

    this.handleCollisions();

    // Camera upward smooth tracking
    const targetCameraY = this.player.y - (this.height * 0.65);
    if (targetCameraY < this.cameraY) {
      this.cameraY += (targetCameraY - this.cameraY) * 9 * effectiveDt;
    }

    // Rising danger line (strictly frozen while at checkpoint staging decks)
    if (!this.dangerPaused) {
      this.dangerSpeed = 35 + Math.min(160, this.player.highestFloor * 1.6);
      this.dangerY -= this.dangerSpeed * effectiveDt;
    }

    const dangerWarning = document.getElementById('danger-warning');
    if (dangerWarning) {
      const dangerDist = this.dangerY - (this.cameraY + this.height);
      dangerWarning.style.display = (!this.dangerPaused && dangerDist < 160) ? 'flex' : 'none';
    }

    // Check Death (ensure danger line cannot kill when paused off-screen)
    if (this.player.hp <= 0 || (!this.dangerPaused && this.player.y > this.dangerY) || this.player.y > this.cameraY + this.height + 80) {
      this.gameOver();
    }

    if (this.interactiveBg) {
      this.interactiveBg.update(
        this.cameraY,
        this.player ? this.player.highestFloor : 0,
        this.player ? this.player.adrenaline : 0,
        this.combos ? this.combos.comboCount : 0,
        effectiveDt
      );
    }

    // Update Post-Processing pipeline
    this.postProcessing.update(effectiveDt, this.player);

    // Update Music dynamics
    const currentElevation = this.player ? this.player.highestFloor : 0;
    const currentSector = Math.min(5, Math.floor(currentElevation / 50) + 1);
    this.music.setSector(currentSector);
    if (this.enemies.boss && this.music.state !== 'BOSS') {
      this.music.setState('BOSS');
    } else if (!this.enemies.boss && this.music.state === 'BOSS') {
      this.music.setState('PLAYING');
    }
    this.music.setAdrenaline(this.player.isOverdrive);
    this.music.setCombo(this.combos ? this.combos.comboCount : 0);

    this.updateCrosshairLock();
    this.updateHUD();
  }

  handleCollisions() {
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    // 1. Supply Pickups (Floating Weapons, Ammo Crates, and Medkit Armor Crates)
    for (const plat of this.platforms.platforms) {
      const handlePickup = (crateKey, crateProp, x, y) => {
        if (!crateKey || !plat.active) return;
        if (
          px + pw > x &&
          px < x + 36 &&
          py + ph > y &&
          py < y + 32
        ) {
          sounds.playCratePickup();
          if (crateKey === 'MEDKIT') {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);
            this.particles.addFloatingText(px + pw / 2, py - 20, '+40 ARMOR', '#22c55e', 20);
            this.particles.addSparks(x + 18, y + 14, 16, '#22c55e');
          } else if (crateKey === 'AMMO' || crateKey === 'AMMO_BOX') {
            const res = this.weapons.addAmmo(12);
            if (res.replenished) {
              this.particles.addFloatingText(px + pw / 2, py - 20, `+AMMO (${this.weapons.ammo})`, '#ffaa00', 20);
              this.particles.addSparks(x + 18, y + 14, 16, '#ffaa00');
            } else {
              // Default rifle: grants tactical adrenaline surge & score
              this.player.adrenaline = Math.min(this.player.maxAdrenaline, this.player.adrenaline + 35);
              this.score += 500;
              this.particles.addFloatingText(px + pw / 2, py - 20, '+OVERDRIVE SURGE!', '#00f0ff', 20);
              this.particles.addSparks(x + 18, y + 14, 16, '#00f0ff');
            }
          } else {
            // Player collects the floating weapon itself!
            this.weapons.setWeapon(crateKey);
            this.score += 250;
            this.particles.addFloatingText(px + pw / 2, py - 24, `${crateKey} EQUIPPED!`, '#ffd700', 22);
            this.particles.addSparks(x + 18, y + 14, 20, '#00f0ff');
          }
          plat[crateProp] = null;
        }
      };

      // Primary pickup
      handlePickup(plat.hasCrate, 'hasCrate', plat.crateX, plat.crateY);

      // Secondary pickup (e.g. checkpoint heavy weapon cache)
      if (plat.hasCrate2) {
        handlePickup(plat.hasCrate2, 'hasCrate2', plat.crate2X, plat.crate2Y);
      }
    }

    // 2. Head Stomp / Pogo
    for (let i = this.enemies.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies.enemies[i];
      if (
        px + pw > e.x &&
        px < e.x + e.width &&
        py + ph >= e.y &&
        py + ph <= e.y + 24 &&
        this.player.vy > 40
      ) {
        this.player.stompRebound(this.particles);
        this.postProcessing.addShockwave(e.x + e.width / 2, e.y + e.height / 2, 170, '#ffd700', 0.35);
        e.hp -= 50;
        this.combos.addCombo(1, true);
        this.particles.addFloatingText(e.x + e.width / 2, e.y - 12, 'CRUSH STOMP!', '#ffd700', 20);

        if (e.hp <= 0) {
          this.killEnemy(e, i);
        }
      }
    }

    // 3A. Beams vs Hazards, Boss & Enemies (Instant high-energy Plasma Rail beam)
    for (const b of this.weapons.beams) {
      if (b.hasCollided) continue;
      b.hasCollided = true;

      const distToSeg = (cx, cy, x1, y1, x2, y2) => {
        const dx = x2 - x1, dy = y2 - y1;
        const l2 = dx * dx + dy * dy;
        if (l2 === 0) return Math.hypot(cx - x1, cy - y1);
        let t = ((cx - x1) * dx + (cy - y1) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(cx - (x1 + t * dx), cy - (y1 + t * dy));
      };

      // Check Hazard laser spikes
      for (const plat of this.platforms.platforms) {
        if (plat.type === 'HAZARD' && plat.active && !plat.isHazardDestroyed && plat.hp > 0) {
          const pcx = plat.x + plat.width / 2;
          const pcy = plat.y + plat.height / 2;
          if (distToSeg(pcx, pcy, b.x1, b.y1, b.x2, b.y2) < plat.width / 2 + 18) {
            plat.hp -= b.damage;
            this.particles.addSparks(pcx, pcy, 12, '#00f0ff');
            if (plat.hp <= 0) {
              plat.type = 'NORMAL';
              plat.isHazardDestroyed = true;
              sounds.playExplosion(false);
              this.particles.addExplosion(pcx, plat.y, false);
              this.particles.addFloatingText(pcx, plat.y - 12, 'SPIKES VAPORIZED! +150', '#00f0ff', 18);
              this.score += 150;
            }
          }
        }
      }

      // Check Boss
      if (this.enemies.boss) {
        const boss = this.enemies.boss;
        if (distToSeg(boss.x, boss.y, b.x1, b.y1, b.x2, b.y2) < boss.width / 2 + 20) {
          boss.hp -= b.damage;
          this.particles.addSparks(boss.x, boss.y, 14, '#00f0ff');
          if (boss.hp <= 0) this.killBoss();
        }
      }

      // Check Enemies
      for (let ei = this.enemies.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies.enemies[ei];
        const ecx = e.x + e.width / 2;
        const ecy = e.y + e.height / 2;
        if (distToSeg(ecx, ecy, b.x1, b.y1, b.x2, b.y2) < Math.max(e.width, e.height) / 2 + 16) {
          e.hp -= b.damage;
          this.particles.addSparks(ecx, ecy, 14, '#00f0ff');
          this.particles.addFloatingText(ecx, e.y - 16, `-${b.damage}`, '#00f0ff', 20);
          if (e.hp <= 0) {
            this.killEnemy(e, ei);
          }
        }
      }
    }

    // 3B. Projectiles vs Hazards & Enemies
    for (let pi = this.weapons.projectiles.length - 1; pi >= 0; pi--) {
      const proj = this.weapons.projectiles[pi];

      // Destructible Hazard Laser Spikes
      let hitHazard = false;
      for (const plat of this.platforms.platforms) {
        if (plat.type === 'HAZARD' && plat.active && !plat.isHazardDestroyed && plat.hp > 0) {
          if (
            proj.x >= plat.x &&
            proj.x <= plat.x + plat.width &&
            proj.y >= plat.y - 10 &&
            proj.y <= plat.y + plat.height + 8
          ) {
            plat.hp -= proj.damage;
            this.particles.addSparks(proj.x, proj.y, 8, '#ff2a4b');
            sounds.playWallKick();

            if (proj.type === 'ROCKET') {
              sounds.playExplosion(false);
              this.particles.addExplosion(plat.x + plat.width / 2, plat.y, false);
              this.postProcessing.addShockwave(plat.x + plat.width / 2, plat.y, 200, '#ff6600', 0.35);
            }

            if (plat.hp <= 0) {
              plat.type = 'NORMAL';
              plat.isHazardDestroyed = true;
              sounds.playExplosion(false);
              this.particles.addExplosion(plat.x + plat.width / 2, plat.y, false);
              this.postProcessing.addShockwave(plat.x + plat.width / 2, plat.y, 220, '#00f0ff', 0.4);
              this.particles.addFloatingText(plat.x + plat.width / 2, plat.y - 12, 'SPIKES DESTROYED! +150', '#00ff77', 18);
              this.score += 150;
              this.player.adrenaline = Math.min(this.player.maxAdrenaline, this.player.adrenaline + 15);
            }

            if (proj.type !== 'PLASMA') {
              this.weapons.projectiles.splice(pi, 1);
            }
            hitHazard = true;
            break;
          }
        }
      }
      if (hitHazard && proj.type !== 'PLASMA') continue;

      // Boss
      if (this.enemies.boss) {
        const b = this.enemies.boss;
        if (
          proj.x >= b.x - b.width / 2 &&
          proj.x <= b.x + b.width / 2 &&
          proj.y >= b.y - b.height / 2 &&
          proj.y <= b.y + b.height / 2
        ) {
          b.hp -= proj.damage;
          this.particles.addSparks(proj.x, proj.y, 6, '#ff2a4b');
          if (proj.type === 'ROCKET') {
            sounds.playExplosion(true);
            this.particles.addExplosion(proj.x, proj.y, true);
            this.postProcessing.addShockwave(proj.x, proj.y, 240, '#ff4400', 0.45);
          }
          if (proj.type !== 'PLASMA') {
            this.weapons.projectiles.splice(pi, 1);
          }
          if (b.hp <= 0) {
            this.killBoss();
          }
          if (proj.type !== 'PLASMA') continue;
        }
      }

      // Regular Enemies
      for (let ei = this.enemies.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies.enemies[ei];
        if (
          proj.x >= e.x &&
          proj.x <= e.x + e.width &&
          proj.y >= e.y &&
          proj.y <= e.y + e.height
        ) {
          // If plasma projectile, check pierce hit list to avoid multi-hitting on same frame
          if (proj.type === 'PLASMA') {
            if (proj.hitList && proj.hitList.has(e)) {
              continue;
            }
            if (proj.hitList) proj.hitList.add(e);
          }

          if (e.type === 'SHIELD_ENFORCER' && proj.type !== 'ROCKET' && proj.type !== 'PLASMA') {
            const isHittingFront = (proj.vx < 0 && e.facing > 0) || (proj.vx > 0 && e.facing < 0);
            if (isHittingFront) {
              sounds.playWallKick();
              e.shieldFlash = 0.22;
              this.particles.addSparks(proj.x, proj.y, 10, '#38bdf8');
              this.weapons.projectiles.splice(pi, 1);
              break;
            }
          }

          e.hp -= proj.damage;
          const sparkColor = proj.type === 'PLASMA' ? '#00f0ff' : '#ff3b30';
          this.particles.addSparks(proj.x, proj.y, 8, sparkColor);

          if (proj.type === 'ROCKET') {
            sounds.playExplosion(false);
            this.particles.addExplosion(proj.x, proj.y, false);
            this.postProcessing.addShockwave(proj.x, proj.y, 200, '#ff6600', 0.35);
          }

          if (proj.type !== 'PLASMA') {
            this.weapons.projectiles.splice(pi, 1);
          }

          if (e.hp <= 0) {
            this.killEnemy(e, ei);
          }
          break;
        }
      }
    }

    // 4. Enemy Bullets vs Player
    for (let bi = this.enemies.enemyBullets.length - 1; bi >= 0; bi--) {
      const eb = this.enemies.enemyBullets[bi];
      if (
        eb.x >= px &&
        eb.x <= px + pw &&
        eb.y >= py &&
        eb.y <= py + ph
      ) {
        this.player.takeDamage(eb.damage, this.particles);
        this.postProcessing.triggerDamage(eb.damage);
        this.enemies.enemyBullets.splice(bi, 1);
      }
    }
  }

  killEnemy(e, index) {
    sounds.playExplosion(false);
    this.particles.addExplosion(e.x + e.width / 2, e.y + e.height / 2, false);
    if (this.interactiveBg) this.interactiveBg.triggerExplosion(0.35);
    this.postProcessing.addShockwave(e.x + e.width / 2, e.y + e.height / 2, 140, '#00f0ff', 0.3);
    this.enemies.enemies.splice(index, 1);
    this.enemies.totalKills++;

    const killPts = e.type === 'SHIELD_ENFORCER' ? 500 : 250;
    this.score += killPts;
    this.player.adrenaline = Math.min(this.player.maxAdrenaline, this.player.adrenaline + 20);

    this.particles.addFloatingText(e.x + e.width / 2, e.y, `+${killPts}`, '#00f0ff', 18);
    this.combos.addCombo(1, true);
  }

  killBoss() {
    sounds.playExplosion(true);
    const b = this.enemies.boss;
    const bossFloor = b ? b.floor : this.currentCheckpointFloor;
    this.defeatedBosses.add(bossFloor);
    this.particles.addExplosion(b.x, b.y, true);
    this.particles.addExplosion(b.x - 50, b.y + 25, true);
    this.particles.addExplosion(b.x + 50, b.y - 25, true);
    if (this.interactiveBg) this.interactiveBg.triggerExplosion(1.5);
    this.postProcessing.addShockwave(b.x, b.y, 480, '#ffd700', 0.85);
    this.postProcessing.triggerAberration(1.0, 0.7);
    this.music.setState('PLAYING');
    this.score += 50000;
    this.enemies.boss = null;
    this.particles.addFloatingText(this.width / 2, this.cameraY + 200, '★ SECTOR BOSS DESTROYED! +50,000 ★', '#ffd700', 30);
    this.combos.addCombo(10, true);

    // Trigger Campaign Story Cutscene Modal!
    this.showCampaignTransmission(bossFloor);
  }

  showCampaignTransmission(floor) {
    this.state = 'COMMS_CUTSCENE';
    // Full armor restore on victory
    this.player.hp = this.player.maxHp;
    this.player.adrenaline = this.player.maxAdrenaline;
    // Replenish special weapon ammo
    this.weapons.addAmmo(30);

    const modal = document.getElementById('campaign-modal');
    const titleEl = document.getElementById('comms-dialogue-header');
    const msgEl = document.getElementById('comms-dialogue-text');
    const proceedBtn = document.getElementById('btn-comms-proceed');

    const sectorNum = Math.max(1, Math.floor(floor / 50));
    const commsData = {
      1: {
        title: 'SECTOR 01 SECURED // ELEVATION GRANTED',
        msg: 'Outstanding performance, Vanguard! Valkyrie-9 Gunship has been neutralized. The ground citadel gates are open. Ascend into the Sector 02 Citadel Shaft and watch out for internal electrical storms!'
      },
      2: {
        title: 'SECTOR 02 BREACHED // REACTOR OVERLOAD',
        msg: 'Incredible combat execution! Titan-Core Dreadnought has been eliminated. The internal reactor is breaching. Climb through the storm deck into Sector 03 Atmospheric Spires!'
      },
      3: {
        title: 'SECTOR 03 CLEARED // EXOSPHERE CLEARANCE',
        msg: 'Stratos-X is down! You have broken through the cloud barrier into the Sector 04 Orbital Space Elevator! Prepare for low-gravity ascent and cosmic defense satellites!'
      },
      4: {
        title: 'ORBITAL APEX DOMINATED // SUPREME VICTORY',
        msg: 'MISSION ACCOMPLISHED! Overlord neutralized. The orbital citadel is liberated. You are an elite legend of the War Tower!'
      }
    };

    const d = commsData[sectorNum] || commsData[1];
    if (titleEl) titleEl.innerText = d.title;
    if (msgEl) msgEl.innerText = d.msg;

    if (modal) {
      modal.classList.add('active');
    }

    if (this.commsKeyHandler) {
      window.removeEventListener('keydown', this.commsKeyHandler);
      this.commsKeyHandler = null;
    }

    const closeComms = () => {
      if (this.state !== 'COMMS_CUTSCENE') return;
      if (this.commsKeyHandler) {
        window.removeEventListener('keydown', this.commsKeyHandler);
        this.commsKeyHandler = null;
      }
      if (proceedBtn) proceedBtn.blur();
      if (modal) modal.classList.remove('active');
      this.state = 'PLAYING';
      this.canvas.focus();
      // Super launch boost when resuming into next sector!
      this.player.vy = -680;
      this.player.adrenaline = 100;
      this.particles.addSparks(this.player.x + this.player.width / 2, this.player.y + this.player.height, 28, '#00f0ff');
      sounds.playJump(3);
    };

    if (proceedBtn) {
      proceedBtn.onclick = () => closeComms();
    }

    // Support Space / Enter key
    this.commsKeyHandler = (e) => {
      if (this.state === 'COMMS_CUTSCENE' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        closeComms();
      }
    };
    window.addEventListener('keydown', this.commsKeyHandler);
  }

  showSectorBanner(sectorNum, sectorName, subtitle) {
    const banner = document.getElementById('sector-banner');
    const titleEl = document.getElementById('sector-banner-title');
    const subEl = document.getElementById('sector-banner-sub');
    if (!banner || !titleEl || !subEl) return;

    titleEl.innerText = `ENTERING SECTOR 0${sectorNum} // ${sectorName}`;
    if (subEl) subEl.innerText = subtitle;

    banner.classList.remove('hidden');
    // Sound effect
    sounds.playComboFanfare(5);

    setTimeout(() => {
      banner.classList.add('hidden');
    }, 3200);
  }

  updateHUD() {
    const hpBar = document.getElementById('hp-bar');
    const hpText = document.getElementById('hp-text');
    const adBar = document.getElementById('adrenaline-bar');
    const adText = document.getElementById('adrenaline-text');
    const floorCounter = document.getElementById('floor-counter');
    const scoreCounter = document.getElementById('score-counter');
    const weaponName = document.getElementById('weapon-name');
    const weaponIcon = document.getElementById('weapon-icon');
    const ammoCount = document.getElementById('ammo-count');
    const ammoTrack = document.getElementById('ammo-gauge-track');
    const ammoFill = document.getElementById('ammo-gauge-fill');

    if (hpBar) hpBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
    if (hpText) hpText.innerText = `${Math.ceil(this.player.hp)} / 100`;

    if (adBar) adBar.style.width = `${(this.player.adrenaline / this.player.maxAdrenaline) * 100}%`;
    if (adText) adText.innerText = `${Math.floor(this.player.adrenaline)}%`;

    if (floorCounter) floorCounter.innerText = this.player.highestFloor.toString();
    if (scoreCounter) scoreCounter.innerText = this.score.toString().padStart(6, '0');

    if (weaponName) weaponName.innerText = this.weapons.currentWeapon.name;
    if (ammoCount) ammoCount.innerText = this.weapons.ammo === Infinity ? '∞' : this.weapons.ammo.toString();

    // Weapon Preview Icon
    if (weaponIcon) {
      const weaponIcons = {
        RIFLE: '/assets/pickup_rifle.png',
        SHOTGUN: '/assets/pickup_shotgun.png',
        RPG: '/assets/pickup_rpg.png',
        RAILGUN: '/assets/pickup_railgun.png'
      };
      const iconSrc = weaponIcons[this.weapons.currentWeapon.id] || weaponIcons.RIFLE;
      if (weaponIcon.getAttribute('src') !== iconSrc) {
        weaponIcon.setAttribute('src', iconSrc);
      }
    }

    // Special Ammo Capacity Gauge
    const typeCodeEl = document.getElementById('weapon-type-code');
    const ammoPctEl = document.getElementById('ammo-pct-text');
    if (typeCodeEl) {
      const typeCodes = { RIFLE: 'RF', SHOTGUN: 'SG', RPG: 'RPG', RAILGUN: 'RG' };
      typeCodeEl.innerText = typeCodes[this.weapons.currentWeapon.id] || 'AR';
    }

    if (ammoTrack && ammoFill) {
      if (this.weapons.currentWeapon.ammo !== Infinity) {
        const maxAmmoMap = { SHOTGUN: 48, RPG: 18, RAILGUN: 24 };
        const maxCap = maxAmmoMap[this.weapons.currentWeapon.id] || 40;
        const pct = Math.max(0, Math.min(100, (this.weapons.ammo / maxCap) * 100));
        ammoFill.style.width = `${pct}%`;
        if (ammoPctEl) ammoPctEl.innerText = `${Math.round(pct)}%`;
      } else {
        ammoFill.style.width = '100%';
        if (ammoPctEl) ammoPctEl.innerText = '100%';
      }
    }

    // Dedicated Boss Health Bar
    const bossHud = document.getElementById('boss-hud');
    const bossNameEl = document.getElementById('boss-name');
    const bossSectorEl = document.getElementById('boss-sector-tag');
    const bossBarFill = document.getElementById('boss-bar-fill');
    const bossHpText = document.getElementById('boss-bar-hp-text');

    if (this.enemies && this.enemies.boss) {
      const b = this.enemies.boss;
      if (bossHud) bossHud.classList.remove('hidden');
      if (bossNameEl) bossNameEl.innerText = b.name;
      if (bossSectorEl) bossSectorEl.innerText = b.sectorTag || 'SECTOR BOSS';
      if (bossBarFill) bossBarFill.style.width = `${Math.max(0, (b.hp / b.maxHp) * 100)}%`;
      if (bossHpText) bossHpText.innerText = `${Math.ceil(b.hp)} / ${b.maxHp} HP`;
    } else if (bossHud) {
      bossHud.classList.add('hidden');
    }

    const hiScoreCounter = document.getElementById('hiscore-counter');
    if (hiScoreCounter) hiScoreCounter.innerText = this.highScore.toString().padStart(6, '0');
  }

  updateCrosshairLock() {
    const crosshair = document.getElementById('custom-crosshair');
    const lockLabel = document.getElementById('crosshair-lock');
    if (!crosshair || !lockLabel) return;

    const worldMouseX = this.mouse.canvasX;
    const worldMouseY = this.mouse.canvasY + this.cameraY;

    let closestDist = Infinity;
    let targetFound = false;

    // Check boss first
    if (this.enemies && this.enemies.boss) {
      const b = this.enemies.boss;
      const d = Math.hypot(b.x - worldMouseX, b.y - worldMouseY);
      if (d < 140) {
        closestDist = d;
        targetFound = true;
      }
    }

    // Check regular enemies
    if (this.enemies && this.enemies.enemies) {
      for (const e of this.enemies.enemies) {
        const ecx = e.x + e.width / 2;
        const ecy = e.y + e.height / 2;
        const d = Math.hypot(ecx - worldMouseX, ecy - worldMouseY);
        if (d < 95 && d < closestDist) {
          closestDist = d;
          targetFound = true;
        }
      }
    }

    if (targetFound) {
      crosshair.classList.add('locked');
      const meters = Math.max(12, Math.round(closestDist * 0.6));
      lockLabel.innerText = `LOCK: ${meters}m`;
    } else {
      crosshair.classList.remove('locked');
      const floor = this.player ? this.player.highestFloor : 0;
      lockLabel.innerText = `ELEV: FL-${floor}`;
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Continuous Multi-Sector Interactive Living Background (Renders bgSector1 to bgSector5 seamlessly)
    if (this.interactiveBg) {
      this.interactiveBg.render(
        this.ctx,
        this.width,
        this.height,
        this.cameraY,
        this.player,
        this.lastDt || 0.016,
        this.particles.shakeOffsetX,
        this.particles.shakeOffsetY
      );
    }

    const currentElevation = this.player && Number.isFinite(this.player.highestFloor) ? this.player.highestFloor : 0;

    // Trigger sector entry alerts as player crosses elevation milestones:
    const checkAnnouncement = (floorThreshold, secNum, name, sub) => {
      if (currentElevation >= floorThreshold && !this.announcedSectors.has(secNum)) {
        this.announcedSectors.add(secNum);
        this.showSectorBanner(secNum, name, sub);
      }
    };
    checkAnnouncement(48, 2, 'CITADEL SHAFT', 'ATMOSPHERIC ELECTRICAL STORM DECK DETECTED');
    checkAnnouncement(98, 3, 'ATMOSPHERIC SPIRES', 'MONOLITHIC CITADEL TOWERS PIERCING CLOUDS');
    checkAnnouncement(148, 4, 'ORBITAL APEX RING', 'SPACE ELEVATOR TRANSIT // VACUUM EXOSPHERE');
    checkAnnouncement(198, 5, 'DEEP SPACE DEFENSE', 'COSMIC ZERO-G DEFENSE PERIMETER // STARFIELD');

    this.ctx.save();
    this.ctx.translate(this.particles.shakeOffsetX, this.particles.shakeOffsetY);

    // 2. High-Tech Sci-Fi Fortress Modular Wall Pillars (Left & Right with smooth parallax scroll)
    sprites.drawFortressWalls(this.ctx, this.width, this.height, this.cameraY);

    // 3. Render Platforms
    this.platforms.render(this.ctx, this.cameraY);

    // 4. Render Weapons & Projectiles
    this.weapons.render(this.ctx, this.cameraY);

    // 5. Render Enemies
    this.enemies.render(this.ctx, this.cameraY);

    // 6. Render Player Commando with dynamic equipped weapon
    this.player.render(this.ctx, this.cameraY, this.weapons.currentWeapon.id);

    // 7. Render Particles & Floating Text
    this.particles.render(this.ctx, this.cameraY);

    // 8. Rising Liquid Thermal Fluid (Multi-Wave Molten Plasma Simulation)
    if (!this.dangerPaused) {
      const dangerScreenY = this.dangerY - this.cameraY;
      if (dangerScreenY < this.height + 120) {
        const t = this.fluidTime || (Date.now() * 0.001);
        const step = 16;
        const ptsCount = Math.ceil(this.width / step) + 1;

        // Layer 1: Background Dark Crimson Magma Wave
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        for (let i = 0; i <= ptsCount; i++) {
          const wx = i * step;
          const wy = dangerScreenY - 6 + Math.sin(wx * 0.009 - t * 2.2) * 8 + Math.cos(wx * 0.022 + t * 1.8) * 5;
          this.ctx.lineTo(wx, wy);
        }
        this.ctx.lineTo(this.width, this.height);
        this.ctx.closePath();

        const bgFluidGrad = this.ctx.createLinearGradient(0, dangerScreenY - 10, 0, dangerScreenY + 240);
        bgFluidGrad.addColorStop(0, '#ff1a3b');
        bgFluidGrad.addColorStop(0.35, '#880011');
        bgFluidGrad.addColorStop(1, '#150004');
        this.ctx.fillStyle = bgFluidGrad;
        this.ctx.fill();

        // Layer 2: Foreground Molten Thermal Liquid Wave
        const frontWavePts = [];
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        for (let i = 0; i <= ptsCount; i++) {
          const wx = i * step;
          const wy = dangerScreenY + Math.sin(wx * 0.014 + t * 3.8) * 10 + Math.cos(wx * 0.032 - t * 2.4) * 6;
          frontWavePts.push({ x: wx, y: wy });
          this.ctx.lineTo(wx, wy);
        }
        this.ctx.lineTo(this.width, this.height);
        this.ctx.closePath();

        const fgFluidGrad = this.ctx.createLinearGradient(0, dangerScreenY - 5, 0, dangerScreenY + 280);
        fgFluidGrad.addColorStop(0, 'rgba(255, 235, 120, 0.98)');
        fgFluidGrad.addColorStop(0.12, 'rgba(255, 110, 20, 0.95)');
        fgFluidGrad.addColorStop(0.45, 'rgba(210, 20, 45, 0.92)');
        fgFluidGrad.addColorStop(1, 'rgba(12, 0, 4, 0.98)');
        this.ctx.fillStyle = fgFluidGrad;
        this.ctx.fill();

        // Layer 3: Glowing Liquid Meniscus & Foam Crest Line
        this.ctx.beginPath();
        for (let i = 0; i < frontWavePts.length; i++) {
          const pt = frontWavePts[i];
          if (i === 0) this.ctx.moveTo(pt.x, pt.y);
          else this.ctx.lineTo(pt.x, pt.y);
        }
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3.5;
        this.ctx.shadowColor = '#ff6600';
        this.ctx.shadowBlur = 18;
        this.ctx.stroke();

        this.ctx.strokeStyle = '#ffaa00';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 8;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Layer 4: Boiling Magma Bubbles
        if (this.fluidBubbles) {
          for (const b of this.fluidBubbles) {
            const bScreenY = dangerScreenY + b.relDepth;
            if (bScreenY < this.height && bScreenY > dangerScreenY) {
              this.ctx.fillStyle = '#ffea75';
              this.ctx.shadowColor = '#ff5500';
              this.ctx.shadowBlur = 8;
              this.ctx.beginPath();
              this.ctx.arc(b.x, bScreenY, b.radius, 0, Math.PI * 2);
              this.ctx.fill();
              this.ctx.shadowBlur = 0;
            }
          }
        }
      }
    }

    this.ctx.restore();

    // 9. Master Screen-Space Post-Processing FX Pass (Shockwaves, Speed Warps, Vignettes, Bullet-Time)
    if (this.postProcessing) {
      this.postProcessing.render(this.ctx, this.width, this.height, this.cameraY, this.player);
    }
  }
}
