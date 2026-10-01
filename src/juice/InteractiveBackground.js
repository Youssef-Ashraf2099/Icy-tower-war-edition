// Interactive Multi-Sector Animated Living Background Engine
// Renders the 5 high-detail Sector Backgrounds (bg_sector1.jpg to bg_sector5.jpg)
// with seamless multi-sector elevation crossfading, 2.5D mouse-aim perspective tilt,
// camera depth parallax, player movement inertia, and dynamic living environmental FX.

import { assets } from '../assets/AssetLoader.js';

export class InteractiveBackground {
  constructor(container) {
    this.container = container;
    if (this.container) {
      this.container.innerHTML = '';
    }

    // 2.5D Mouse Aim & Perspective Tilt
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.tiltX = 0;
    this.tiltY = 0;
    this.playerSwayX = 0;

    // Environmental Timers & Dynamic Elements
    this.time = 0;
    this.lightningTimer = 3.2;
    this.lightningFlash = 0; // 0 to 1
    this.lightningBolts = [];
    this.explosionFlash = 0;
    this.muzzleFlash = 0;
    this.speedStreakAlpha = 0;

    // --- SECTOR 1: Electrical Conduit Pulses & Rising Embers ---
    this.conduitPulses = [
      { xPct: 0.16, yOffset: 120, speed: 260, color: '#00f0ff', radius: 4 },
      { xPct: 0.28, yOffset: 450, speed: 320, color: '#00f0ff', radius: 3.5 },
      { xPct: 0.52, yOffset: 200, speed: 280, color: '#ffaa00', radius: 4 },
      { xPct: 0.74, yOffset: 600, speed: 340, color: '#00f0ff', radius: 3.5 },
      { xPct: 0.88, yOffset: 300, speed: 300, color: '#00f0ff', radius: 4 },
      { xPct: 0.42, yOffset: 750, speed: 380, color: '#ffee55', radius: 3 }
    ];

    this.embers = [];
    for (let i = 0; i < 40; i++) {
      this.embers.push({
        x: Math.random(),
        y: Math.random(),
        vy: 35 + Math.random() * 55,
        vx: (Math.random() - 0.5) * 18,
        radius: 1 + Math.random() * 2.2,
        color: Math.random() > 0.35 ? '#00f0ff' : '#ffaa00',
        alpha: 0.2 + Math.random() * 0.6
      });
    }

    // Steam vents along lower citadel
    this.steamVents = [
      { xPct: 0.14, yPct: 0.78, timer: 0, interval: 2.8, active: 0 },
      { xPct: 0.86, yPct: 0.65, timer: 1.4, interval: 3.2, active: 0 }
    ];
    this.steamParticles = [];

    // --- SECTOR 2: Atmospheric Wind-Driven Rain & Drifting Clouds ---
    this.rainDrops = [];
    for (let i = 0; i < 140; i++) {
      this.rainDrops.push({
        x: Math.random(),
        y: Math.random(),
        length: 24 + Math.random() * 28,
        speed: 800 + Math.random() * 500,
        alpha: 0.2 + Math.random() * 0.45
      });
    }

    this.clouds = [
      { x: 0.1, y: 0.65, speed: 18, width: 680, height: 200, alpha: 0.24 },
      { x: 0.55, y: 0.32, speed: -15, width: 800, height: 240, alpha: 0.18 },
      { x: 0.8, y: 0.75, speed: 24, width: 560, height: 180, alpha: 0.26 }
    ];

    // Electric structural arcs across fortress pylons
    this.arcTimer = 2.0;
    this.activeArc = null;

    // --- SECTOR 3: Spire Warning Aviation Beacons & Patrol Drones ---
    this.beacons = [
      { xPct: 0.505, yPct: 0.05, color: '#ff2a4b', period: 1.2, radius: 5.0 },
      { xPct: 0.408, yPct: 0.16, color: '#00f0ff', period: 1.8, radius: 4.0 },
      { xPct: 0.635, yPct: 0.19, color: '#00f0ff', period: 1.5, radius: 4.0 },
      { xPct: 0.288, yPct: 0.32, color: '#ff2a4b', period: 1.1, radius: 4.5 },
      { xPct: 0.742, yPct: 0.40, color: '#ffaa00', period: 2.0, radius: 4.0 }
    ];

    this.patrolDrones = [
      { x: -0.15, y: 0.28, vx: 0.035, size: 10, blinkTimer: 0 },
      { x: 1.15, y: 0.45, vx: -0.028, size: 8, blinkTimer: 0.5 }
    ];

    // --- SECTOR 4: Space Elevator Transit Shuttles & Shooting Stars ---
    this.shuttles = [
      { x: 0.38, y: 1.1, vy: -0.065, size: 14, trail: [] },
      { x: 0.62, y: -0.1, vy: 0.055, size: 12, trail: [] },
      { x: -0.1, y: 0.22, vx: 0.025, vy: -0.003, size: 12, trail: [] }
    ];

    this.shootingStars = [];
    this.shootingStarTimer = 2.5;

    // --- SECTOR 5: Deep Space Defense Laser Matrix & Starfield ---
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        radius: 0.6 + Math.random() * 1.8,
        color: Math.random() > 0.4 ? '#ffffff' : (Math.random() > 0.5 ? '#00f0ff' : '#ffd000'),
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 1.5 + Math.random() * 3.5
      });
    }

    this.laserNodes = [
      { xPct: 0.15, yPct: 0.28 },
      { xPct: 0.22, yPct: 0.55 },
      { xPct: 0.36, yPct: 0.46 },
      { xPct: 0.49, yPct: 0.39 },
      { xPct: 0.58, yPct: 0.24 },
      { xPct: 0.78, yPct: 0.28 },
      { xPct: 0.58, yPct: 0.72 },
      { xPct: 0.82, yPct: 0.86 },
      { xPct: 0.66, yPct: 0.93 }
    ];

    this.laserBeams = [
      { from: 0, to: 2, packet: 0.2, speed: 0.6 },
      { from: 2, to: 3, packet: 0.7, speed: 0.8 },
      { from: 3, to: 4, packet: 0.4, speed: 0.5 },
      { from: 4, to: 5, packet: 0.1, speed: 0.7 },
      { from: 1, to: 6, packet: 0.8, speed: 0.65 },
      { from: 6, to: 7, packet: 0.3, speed: 0.75 },
      { from: 7, to: 8, packet: 0.5, speed: 0.9 },
      { from: 0, to: 4, packet: 0.9, speed: 0.55 }
    ];

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      const sw = window.innerWidth || 1024;
      const sh = window.innerHeight || 768;
      this.mouseX = Math.max(0, Math.min(1, e.clientX / sw));
      this.mouseY = Math.max(0, Math.min(1, e.clientY / sh));
    });
  }

  triggerExplosion(intensity = 1.0) {
    this.explosionFlash = Math.min(1.0, this.explosionFlash + 0.6 * (Number.isFinite(intensity) ? intensity : 1.0));
  }

  triggerWeaponFire(weaponId) {
    const boost = weaponId === 'RPG' || weaponId === 'RAILGUN' ? 0.35 : 0.15;
    this.muzzleFlash = Math.min(0.6, this.muzzleFlash + boost);
  }

  update(cameraY = 0, elevation = 0, adrenaline = 0, comboCount = 0, dt = 0.016) {
    const safeDt = Math.max(0.001, Math.min(0.1, Number.isFinite(dt) ? dt : 0.016));
    const safeAdrenaline = Math.max(0, Math.min(100, Number.isFinite(adrenaline) ? adrenaline : 0));
    const safeCombo = Math.max(0, Number.isFinite(comboCount) ? comboCount : 0);

    this.time += safeDt;

    // 1. Smooth 2.5D Mouse Aim Perspective Tilt
    const targetTiltX = (this.mouseX - 0.5) * -36;
    const targetTiltY = (this.mouseY - 0.5) * -24;
    this.tiltX += (targetTiltX - this.tiltX) * Math.min(1, safeDt * 7);
    this.tiltY += (targetTiltY - this.tiltY) * Math.min(1, safeDt * 7);

    if (!Number.isFinite(this.tiltX)) this.tiltX = 0;
    if (!Number.isFinite(this.tiltY)) this.tiltY = 0;

    // 2. Light Flashes Decay
    if (this.explosionFlash > 0) {
      this.explosionFlash = Math.max(0, this.explosionFlash - safeDt * 2.8);
    }
    if (this.muzzleFlash > 0) {
      this.muzzleFlash = Math.max(0, this.muzzleFlash - safeDt * 6.5);
    }
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - safeDt * 3.2);
    }

    // 3. Lightning Flash Timer (Active in Sector 1 & Sector 2)
    this.lightningTimer -= safeDt;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 3.5 + Math.random() * 4.5;
      this.triggerLightning();
    }

    // 4. Sector 1 Conduits: Pulse speed accelerates with Adrenaline & Combos
    const pulseSpeedMult = 1 + (safeAdrenaline / 100) * 1.6 + Math.min(1.5, safeCombo * 0.1);
    this.conduitPulses.forEach((p) => {
      p.yOffset -= p.speed * pulseSpeedMult * safeDt;
      if (p.yOffset < -100) p.yOffset = 1800;
      if (!Number.isFinite(p.yOffset)) p.yOffset = 200;
    });

    // Sector 1 Embers
    this.embers.forEach((em) => {
      em.y -= (em.vy * safeDt) / 1080;
      em.x += ((em.vx + Math.sin(this.time * 2 + em.y * 10) * 12) * safeDt) / 1920;
      if (em.y < 0) {
        em.y = 1.05;
        em.x = Math.random();
      }
    });

    // Sector 1 Steam Vents
    this.steamVents.forEach((sv) => {
      sv.timer -= safeDt;
      if (sv.timer <= 0) {
        sv.timer = sv.interval + Math.random() * 1.5;
        sv.active = 0.8;
      }
      if (sv.active > 0) {
        sv.active -= safeDt;
        this.steamParticles.push({
          x: sv.xPct,
          y: sv.yPct,
          vx: (sv.xPct < 0.5 ? 1 : -1) * (30 + Math.random() * 30),
          vy: -(25 + Math.random() * 25),
          radius: 6 + Math.random() * 8,
          alpha: 0.35,
          life: 0.8
        });
      }
    });

    for (let i = this.steamParticles.length - 1; i >= 0; i--) {
      const sp = this.steamParticles[i];
      sp.life -= safeDt;
      sp.alpha = (sp.life / 0.8) * 0.35;
      sp.radius += safeDt * 18;
      sp.x += (sp.vx * safeDt) / 1920;
      sp.y += (sp.vy * safeDt) / 1080;
      if (sp.life <= 0) {
        this.steamParticles.splice(i, 1);
      }
    }

    // 5. Sector 2 Rain
    this.rainDrops.forEach((drop) => {
      drop.y += (drop.speed * safeDt) / 1080;
      drop.x -= (180 * safeDt) / 1920; // Slanted wind
      if (drop.y > 1.1) {
        drop.y = -0.1;
        drop.x = Math.random() * 1.2;
      }
    });

    // 6. Sector 2 & 3 Clouds
    this.clouds.forEach((c) => {
      c.x += (c.speed * safeDt) / 1920;
      if (c.x > 1.3) c.x = -0.4;
      if (c.x < -0.4) c.x = 1.3;
    });

    // Sector 2 Structural Arcs
    this.arcTimer -= safeDt;
    if (this.arcTimer <= 0) {
      this.arcTimer = 2.2 + Math.random() * 3.0;
      this.activeArc = {
        life: 0.18,
        x1: 0.22 + Math.random() * 0.56,
        y1: 0.35 + Math.random() * 0.3,
        x2: 0.22 + Math.random() * 0.56,
        y2: 0.35 + Math.random() * 0.3
      };
    }
    if (this.activeArc) {
      this.activeArc.life -= safeDt;
      if (this.activeArc.life <= 0) this.activeArc = null;
    }

    // Sector 3 Patrol Drones
    this.patrolDrones.forEach((d) => {
      d.x += (d.vx || 0.03) * safeDt;
      d.blinkTimer += safeDt * 2.5;
      if (d.vx > 0 && d.x > 1.25) d.x = -0.25;
      if (d.vx < 0 && d.x < -0.25) d.x = 1.25;
    });

    // 7. Sector 4 Space Shuttles
    this.shuttles.forEach((s) => {
      if (s.vy !== undefined) {
        s.y += s.vy * safeDt;
        if (s.vy < 0 && s.y < -0.15) s.y = 1.15;
        if (s.vy > 0 && s.y > 1.15) s.y = -0.15;
      }
      if (s.vx !== undefined) {
        s.x += s.vx * safeDt;
        if (s.vx > 0 && s.x > 1.2) s.x = -0.2;
        if (s.vx < 0 && s.x < -0.2) s.x = 1.2;
      }
    });

    // Sector 4 Shooting Stars
    this.shootingStarTimer -= safeDt;
    if (this.shootingStarTimer <= 0) {
      this.shootingStarTimer = 2.5 + Math.random() * 4.0;
      this.shootingStars.push({
        x: 0.2 + Math.random() * 0.7,
        y: 0.05 + Math.random() * 0.3,
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.4),
        vy: 0.3 + Math.random() * 0.3,
        length: 60 + Math.random() * 50,
        life: 0.35,
        maxLife: 0.35
      });
    }
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.life -= safeDt;
      ss.x += ss.vx * safeDt;
      ss.y += ss.vy * safeDt;
      if (ss.life <= 0) this.shootingStars.splice(i, 1);
    }

    // 8. Sector 5 Laser Network Packets
    const laserSpeedMult = 1 + (safeAdrenaline / 100) * 0.8 + (this.muzzleFlash > 0 ? 1.2 : 0);
    this.laserBeams.forEach((b) => {
      b.packet += b.speed * laserSpeedMult * safeDt;
      if (b.packet > 1.0) b.packet -= 1.0;
    });
  }

  triggerLightning() {
    this.lightningFlash = 1.0;
    this.lightningBolts = [];
    const numBolts = 1 + Math.floor(Math.random() * 2);
    for (let b = 0; b < numBolts; b++) {
      const startX = 0.2 + Math.random() * 0.6;
      let curX = startX;
      let curY = 0.02;
      const pts = [{ x: curX, y: curY }];
      for (let i = 0; i < 7; i++) {
        curY += 0.04 + Math.random() * 0.05;
        curX += (Math.random() - 0.5) * 0.12;
        pts.push({ x: curX, y: curY });
      }
      this.lightningBolts.push(pts);
    }
  }

  // Master Render Method: Draws seamless multi-sector backdrop onto canvas ctx
  render(ctx, width, height, cameraY, player, effectiveDt = 0.016, shakeOffsetX = 0, shakeOffsetY = 0) {
    if (!ctx) return;
    const safeW = Math.max(100, Number.isFinite(width) ? width : 1024);
    const safeH = Math.max(100, Number.isFinite(height) ? height : 768);
    const safeCamY = Number.isFinite(cameraY) ? cameraY : 0;
    const safeDt = Math.max(0.001, Number.isFinite(effectiveDt) ? effectiveDt : 0.016);
    const safeShakeX = Number.isFinite(shakeOffsetX) ? shakeOffsetX : 0;
    const safeShakeY = Number.isFinite(shakeOffsetY) ? shakeOffsetY : 0;

    const elevation = player && Number.isFinite(player.highestFloor) ? player.highestFloor : 0;

    // Track horizontal player movement for inertial background sway
    if (player) {
      const targetSway = (Number.isFinite(player.vx) ? player.vx : 0) * -0.06;
      this.playerSwayX += (targetSway - this.playerSwayX) * Math.min(1, safeDt * 6);
    }
    if (!Number.isFinite(this.playerSwayX)) this.playerSwayX = 0;

    // High combo / Super Jump speed lines trigger
    if (player && Number.isFinite(player.vy) && player.vy < -550) {
      this.speedStreakAlpha = Math.min(0.7, this.speedStreakAlpha + safeDt * 4);
    } else {
      this.speedStreakAlpha = Math.max(0, this.speedStreakAlpha - safeDt * 3);
    }

    // Retrieve the 5 Sector Background assets
    const bg1 = assets.getImage('bgSector1') || assets.getImage('background');
    const bg2 = assets.getImage('bgSector2') || bg1;
    const bg3 = assets.getImage('bgSector3') || bg2;
    const bg4 = assets.getImage('bgSector4') || bg3;
    const bg5 = assets.getImage('bgSector5') || bg4;

    const sectorBgs = [bg1, bg2, bg3, bg4, bg5];

    // Determine current sectors and smooth S-curve blend transition factor
    // Floor 0-45: Sector 1 (Citadel Chasm)
    // Floor 42-52: Crossfade 1 -> 2
    // Floor 50-95: Sector 2 (Storm Mountain Fortress)
    // Floor 92-102: Crossfade 2 -> 3
    // Floor 100-145: Sector 3 (Atmospheric Spire)
    // Floor 142-152: Crossfade 3 -> 4
    // Floor 150-195: Sector 4 (Orbital Apex Ring)
    // Floor 192-202: Crossfade 4 -> 5
    // Floor 200+: Sector 5 (Deep Space Defense Network)
    let secA = 0;
    let secB = 0;
    let blend = 0;

    if (elevation < 42) {
      secA = 0; secB = 0; blend = 0;
    } else if (elevation < 52) {
      secA = 0; secB = 1;
      const t = (elevation - 42) / 10;
      blend = t * t * (3 - 2 * t);
    } else if (elevation < 92) {
      secA = 1; secB = 1; blend = 0;
    } else if (elevation < 102) {
      secA = 1; secB = 2;
      const t = (elevation - 92) / 10;
      blend = t * t * (3 - 2 * t);
    } else if (elevation < 142) {
      secA = 2; secB = 2; blend = 0;
    } else if (elevation < 152) {
      secA = 2; secB = 3;
      const t = (elevation - 142) / 10;
      blend = t * t * (3 - 2 * t);
    } else if (elevation < 192) {
      secA = 3; secB = 3; blend = 0;
    } else if (elevation < 202) {
      secA = 3; secB = 4;
      const t = (elevation - 192) / 10;
      blend = t * t * (3 - 2 * t);
    } else {
      secA = 4; secB = 4; blend = 0;
    }

    const imgA = sectorBgs[secA];
    const imgB = sectorBgs[secB];

    // Master Save to preserve clean canvas state
    ctx.save();

    // Helper: Draw seamless tiled background with parallax & 2.5D perspective tilt
    const drawSectorImg = (img, alpha = 1.0) => {
      if (!img) return;
      const imgW = img.width || 1024;
      const imgH = img.height || 1800;

      // Scale to cover full screen plus 8% margin for 2.5D mouse parallax movement
      const scale = Math.max(safeW / imgW, safeH / imgH) * 1.08;
      const scaledW = imgW * scale;
      const scaledH = imgH * scale;

      // Parallax offsets
      const totalOffsetX = (safeW - scaledW) / 2 + this.tiltX + this.playerSwayX + (safeShakeX * 0.4);
      const parallaxFactor = 0.16;
      const bgYOffset = ((safeCamY * parallaxFactor) % scaledH + scaledH) % scaledH;
      const startY = -bgYOffset + this.tiltY + (safeShakeY * 0.4);

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      // Seamless vertical tiling
      for (let y = startY - scaledH; y < safeH + scaledH; y += scaledH) {
        ctx.drawImage(img, totalOffsetX, y, scaledW, scaledH);
      }
      ctx.restore();
    };

    // 1. Draw Primary & Crossfading Sector Images
    if (imgA) {
      drawSectorImg(imgA, 1.0);
    } else {
      // Fallback sci-fi gradient if image is still loading
      const grad = ctx.createLinearGradient(0, 0, 0, safeH);
      grad.addColorStop(0, '#060a12');
      grad.addColorStop(1, '#0e1726');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, safeW, safeH);
    }

    if (imgB && blend > 0 && imgA !== imgB) {
      drawSectorImg(imgB, blend);
    }

    // 2. Draw Sector-Specific Dynamic Living FX Overlays (Guarded against any crash)
    const activeAlphaA = 1.0 - blend;
    const activeAlphaB = blend;

    try {
      if (activeAlphaA > 0.05) this.renderSectorFX(ctx, secA, safeW, safeH, activeAlphaA, safeCamY);
      if (activeAlphaB > 0.05 && secA !== secB) this.renderSectorFX(ctx, secB, safeW, safeH, activeAlphaB, safeCamY);
    } catch (fxErr) {
      console.warn('[InteractiveBackground] FX error suppressed:', fxErr);
    }

    // 3. Super Jump Speed Streaks
    if (this.speedStreakAlpha > 0.05) {
      this.renderSpeedStreaks(ctx, safeW, safeH, this.speedStreakAlpha);
    }

    // 4. Combat Lighting Reactions (Explosions & Heavy Weapon Muzzle Glow)
    const combatGlow = Math.max(this.explosionFlash * 0.4, this.muzzleFlash * 0.35);
    if (combatGlow > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(0, 240, 255, ${combatGlow * 0.25})`;
      ctx.fillRect(0, 0, safeW, safeH);

      const centerGlow = ctx.createRadialGradient(
        safeW / 2, safeH / 2, 80,
        safeW / 2, safeH / 2, Math.max(85, safeW * 0.7)
      );
      centerGlow.addColorStop(0, `rgba(255, 255, 255, ${combatGlow * 0.4})`);
      centerGlow.addColorStop(0.4, `rgba(0, 240, 255, ${combatGlow * 0.25})`);
      centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, safeW, safeH);
      ctx.restore();
    }

    // 5. Adrenaline Overdrive Aura Pulse
    if (player && player.adrenaline > 40) {
      const adrIntensity = (player.adrenaline - 40) / 60;
      const pulseWave = 0.5 + 0.5 * Math.sin(this.time * 6);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const edgeAura = ctx.createRadialGradient(
        safeW / 2, safeH / 2, Math.max(10, safeW * 0.35),
        safeW / 2, safeH / 2, Math.max(20, safeW * 0.75)
      );
      edgeAura.addColorStop(0, 'rgba(0, 240, 255, 0)');
      edgeAura.addColorStop(0.85, `rgba(0, 240, 255, ${0.12 * adrIntensity * pulseWave})`);
      edgeAura.addColorStop(1, `rgba(255, 170, 0, ${0.22 * adrIntensity * pulseWave})`);
      ctx.fillStyle = edgeAura;
      ctx.fillRect(0, 0, safeW, safeH);
      ctx.restore();
    }

    // 6. Eye-Comfort Vignette & Depth Balancing
    ctx.save();
    const edgeGrad = ctx.createRadialGradient(
      safeW / 2, safeH / 2, Math.max(10, safeW * 0.38),
      safeW / 2, safeH / 2, Math.max(20, safeW * 0.85)
    );
    edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    edgeGrad.addColorStop(0.7, 'rgba(2, 6, 12, 0.25)');
    edgeGrad.addColorStop(1, 'rgba(2, 6, 12, 0.55)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, safeW, safeH);
    ctx.restore();

    // Restore clean master canvas state so foreground platform rendering is untouched!
    ctx.restore();
  }

  // Render FX unique to each sector
  renderSectorFX(ctx, sectorIdx, width, height, alpha, cameraY) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    if (sectorIdx === 0) {
      // SECTOR 1: CITADEL CHASM (Conduits, Rising Embers, Steam Vents, Storm Lightning)
      this.drawSector1Conduits(ctx, width, height);
      this.drawSector1Embers(ctx, width, height);
      this.drawSector1Steam(ctx, width, height);
      this.drawSector1Lightning(ctx, width, height);
    } else if (sectorIdx === 1) {
      // SECTOR 2: MOUNTAIN FORTRESS (Rain, Drifting Mountain Fog, High-Voltage Arcs, Distant Thunder)
      this.drawSector2Rain(ctx, width, height);
      this.drawSector2Fog(ctx, width, height);
      this.drawSector2Arcs(ctx, width, height);
      this.drawSector2Thunder(ctx, width, height);
    } else if (sectorIdx === 2) {
      // SECTOR 3: ATMOSPHERIC MEGA-SPIRE (Antenna Beacons, Clouds, Patrol Drones)
      this.drawSector3Beacons(ctx, width, height);
      this.drawSector3Clouds(ctx, width, height);
      this.drawSector3Drones(ctx, width, height);
    } else if (sectorIdx === 3) {
      // SECTOR 4: ORBITAL APEX RING (Cruising Shuttles, Breathing Earth Limb, Shooting Stars)
      this.drawSector4Shuttles(ctx, width, height);
      this.drawSector4EarthAtmosphere(ctx, width, height);
      this.drawSector4ShootingStars(ctx, width, height);
    } else if (sectorIdx === 4) {
      // SECTOR 5: DEEP SPACE DEFENSE (Twinkling Starfield, Pulsing Lasers, Thruster Flames)
      this.drawSector5Stars(ctx, width, height);
      this.drawSector5Lasers(ctx, width, height);
      this.drawSector5Thrusters(ctx, width, height);
    }

    ctx.restore();
  }

  // --- SECTOR 1 FX ---
  drawSector1Conduits(ctx, width, height) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const safeH = Math.max(1, height);

    this.conduitPulses.forEach((p) => {
      const cx = p.xPct * width + this.tiltX * 0.5;
      const cy = ((p.yOffset % safeH) + safeH) % safeH;
      const r = Math.max(1, p.radius || 4);

      if (Number.isFinite(cx) && Number.isFinite(cy)) {
        const grad = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, r * 3.5);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, p.color);
        grad.addColorStop(1, 'rgba(0, 240, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Vertical energy streak line
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 25);
        ctx.lineTo(cx, cy + 25);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  drawSector1Embers(ctx, width, height) {
    ctx.save();
    this.embers.forEach((em) => {
      ctx.fillStyle = em.color;
      ctx.globalAlpha = em.alpha * (0.6 + 0.4 * Math.sin(this.time * 4 + em.x * 20));
      ctx.beginPath();
      ctx.arc(em.x * width + this.tiltX * 0.3, em.y * height, em.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawSector1Steam(ctx, width, height) {
    if (this.steamParticles.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    this.steamParticles.forEach((sp) => {
      const sx = sp.x * width;
      const sy = sp.y * height;
      const grad = ctx.createRadialGradient(sx, sy, 1, sx, sy, Math.max(2, sp.radius));
      grad.addColorStop(0, `rgba(160, 230, 255, ${sp.alpha})`);
      grad.addColorStop(0.6, `rgba(100, 180, 240, ${sp.alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(40, 90, 140, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, sp.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawSector1Lightning(ctx, width, height) {
    if (this.lightningFlash <= 0.05) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Sky cloud flash illumination
    ctx.fillStyle = `rgba(0, 240, 255, ${this.lightningFlash * 0.28})`;
    ctx.fillRect(0, 0, width, height * 0.45);

    // Jagged lightning strokes
    this.lightningBolts.forEach((bolt) => {
      if (bolt.length < 2) return;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.moveTo(bolt[0].x * width, bolt[0].y * height);
      for (let i = 1; i < bolt.length; i++) {
        ctx.lineTo(bolt[i].x * width, bolt[i].y * height);
      }
      ctx.stroke();

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 5;
      ctx.stroke();
    });
    ctx.restore();
  }

  // --- SECTOR 2 FX ---
  drawSector2Rain(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.45)';
    ctx.lineWidth = 1.2;
    this.rainDrops.forEach((d) => {
      const rx = d.x * width;
      const ry = d.y * height;
      ctx.globalAlpha = d.alpha;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 6, ry + d.length);
      ctx.stroke();
    });
    ctx.restore();
  }

  drawSector2Fog(ctx, width, height) {
    ctx.save();
    this.clouds.forEach((c) => {
      const cx = c.x * width;
      const cy = c.y * height;
      const r = Math.max(30, c.width / 2);
      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, r);
      grad.addColorStop(0, `rgba(14, 30, 48, ${c.alpha})`);
      grad.addColorStop(0.6, `rgba(10, 22, 36, ${c.alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(6, 14, 24, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, c.width / 2, c.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawSector2Arcs(ctx, width, height) {
    if (!this.activeArc) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;

    const x1 = this.activeArc.x1 * width;
    const y1 = this.activeArc.y1 * height;
    const x2 = this.activeArc.x2 * width;
    const y2 = this.activeArc.y2 * height;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const steps = 5;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20;
      const my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
      ctx.lineTo(mx, my);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawSector2Thunder(ctx, width, height) {
    if (this.lightningFlash <= 0.05) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const grad = ctx.createRadialGradient(
      width * 0.6, height * 0.35, 60,
      width * 0.6, height * 0.35, Math.max(70, width * 0.6)
    );
    grad.addColorStop(0, `rgba(200, 240, 255, ${this.lightningFlash * 0.4})`);
    grad.addColorStop(0.5, `rgba(50, 140, 220, ${this.lightningFlash * 0.2})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // --- SECTOR 3 FX ---
  drawSector3Beacons(ctx, width, height) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    this.beacons.forEach((b) => {
      const bx = b.xPct * width + this.tiltX * 0.4;
      const by = b.yPct * height + this.tiltY * 0.4;
      const phase = (this.time % b.period) / b.period;
      const pulse = phase < 0.2 ? Math.sin((phase / 0.2) * Math.PI) : 0.08;

      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12 * pulse;
      ctx.beginPath();
      ctx.arc(bx, by, b.radius * (0.8 + 0.6 * pulse), 0, Math.PI * 2);
      ctx.fill();

      // Horizontal flare gleam when peaking
      if (pulse > 0.5) {
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx - 18 * pulse, by);
        ctx.lineTo(bx + 18 * pulse, by);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  drawSector3Clouds(ctx, width, height) {
    ctx.save();
    const cy = height * 0.76;
    const wave = Math.sin(this.time * 0.8) * 8;
    const grad = ctx.createLinearGradient(0, cy - 60 + wave, 0, cy + 120);
    grad.addColorStop(0, 'rgba(16, 24, 42, 0)');
    grad.addColorStop(0.5, 'rgba(18, 30, 52, 0.4)');
    grad.addColorStop(1, 'rgba(10, 16, 28, 0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, cy - 60 + wave, width, 180);
    ctx.restore();
  }

  drawSector3Drones(ctx, width, height) {
    ctx.save();
    this.patrolDrones.forEach((d) => {
      const dx = d.x * width;
      const dy = d.y * height;
      const dir = d.vx > 0 ? 1 : -1;

      // Drone fuselage
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dx + dir * d.size, dy);
      ctx.lineTo(dx - dir * d.size, dy - d.size * 0.35);
      ctx.lineTo(dx - dir * (d.size * 0.6), dy);
      ctx.lineTo(dx - dir * d.size, dy + d.size * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Blinking cyan marker light
      const blink = Math.sin(d.blinkTimer * 4) > 0;
      ctx.fillStyle = blink ? '#00f0ff' : '#0369a1';
      ctx.beginPath();
      ctx.arc(dx, dy, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // --- SECTOR 4 FX ---
  drawSector4Shuttles(ctx, width, height) {
    ctx.save();
    this.shuttles.forEach((s) => {
      const sx = s.x * width;
      const sy = s.y * height;
      const dirX = s.vx ? (s.vx > 0 ? 1 : -1) : 0;
      const dirY = s.vy ? (s.vy > 0 ? 1 : -1) : 0;

      // Ion engine glow plume
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      if (dirY !== 0) {
        ctx.ellipse(sx, sy - dirY * (s.size + 4), 3, 6, 0, 0, Math.PI * 2);
      } else {
        ctx.ellipse(sx - dirX * (s.size + 4), sy, 6, 3, 0, 0, Math.PI * 2);
      }
      ctx.fill();

      // Shuttle body
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      if (dirY !== 0) {
        ctx.moveTo(sx, sy + dirY * s.size);
        ctx.lineTo(sx - s.size * 0.4, sy - dirY * s.size);
        ctx.lineTo(sx, sy - dirY * s.size * 0.7);
        ctx.lineTo(sx + s.size * 0.4, sy - dirY * s.size);
      } else {
        ctx.moveTo(sx + dirX * s.size, sy);
        ctx.lineTo(sx - dirX * s.size, sy - s.size * 0.4);
        ctx.lineTo(sx - dirX * s.size * 0.7, sy);
        ctx.lineTo(sx - dirX * s.size, sy + s.size * 0.4);
      }
      ctx.closePath();
      ctx.fill();

      // Red navigation strobe
      if ((this.time * 2.5) % 1.0 < 0.2) {
        ctx.fillStyle = '#ff2a4b';
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  drawSector4EarthAtmosphere(ctx, width, height) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const breath = 0.8 + 0.2 * Math.sin(this.time * 1.5);
    const limbGrad = ctx.createLinearGradient(0, height * 0.82, 0, height);
    limbGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    limbGrad.addColorStop(0.4, `rgba(0, 200, 255, ${0.22 * breath})`);
    limbGrad.addColorStop(1, `rgba(50, 120, 255, ${0.45 * breath})`);
    ctx.fillStyle = limbGrad;
    ctx.fillRect(0, height * 0.82, width, height * 0.18);
    ctx.restore();
  }

  drawSector4ShootingStars(ctx, width, height) {
    if (this.shootingStars.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    this.shootingStars.forEach((ss) => {
      const sx = ss.x * width;
      const sy = ss.y * height;
      const alpha = (ss.life / ss.maxLife);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - (ss.vx * ss.length * 0.1), sy - (ss.vy * ss.length * 0.1));
      ctx.stroke();
    });
    ctx.restore();
  }

  // --- SECTOR 5 FX ---
  drawSector5Stars(ctx, width, height) {
    ctx.save();
    this.stars.forEach((st) => {
      const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this.time * st.twinkleSpeed + st.phase));
      ctx.fillStyle = st.color;
      ctx.globalAlpha = alpha;
      const sx = st.x * width + this.tiltX * 0.15;
      const sy = st.y * height + this.tiltY * 0.15;
      ctx.beginPath();
      ctx.arc(sx, sy, st.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawSector5Lasers(ctx, width, height) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    this.laserBeams.forEach((b) => {
      const fromNode = this.laserNodes[b.from];
      const toNode = this.laserNodes[b.to];
      if (!fromNode || !toNode) return;

      const x1 = fromNode.xPct * width + this.tiltX * 0.3;
      const y1 = fromNode.yPct * height + this.tiltY * 0.3;
      const x2 = toNode.xPct * width + this.tiltX * 0.3;
      const y2 = toNode.yPct * height + this.tiltY * 0.3;

      // Connecting laser beam line
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Traveling glowing energy packet
      const px = x1 + (x2 - x1) * b.packet;
      const py = y1 + (y2 - y1) * b.packet;

      if (Number.isFinite(px) && Number.isFinite(py)) {
        const pGrad = ctx.createRadialGradient(px, py, 1, px, py, 6);
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.4, '#00f0ff');
        pGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  drawSector5Thrusters(ctx, width, height) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    this.laserNodes.forEach((node, idx) => {
      if (idx % 2 === 1) return;
      const nx = node.xPct * width + this.tiltX * 0.3;
      const ny = node.yPct * height + this.tiltY * 0.3 + 12;
      const flicker = 0.6 + 0.4 * Math.sin(this.time * 20 + idx);

      if (Number.isFinite(nx) && Number.isFinite(ny)) {
        const rad = Math.max(1, 8 * flicker);
        const flareGrad = ctx.createRadialGradient(nx, ny, 0.5, nx, ny, rad);
        flareGrad.addColorStop(0, '#ffffff');
        flareGrad.addColorStop(0.5, '#00f0ff');
        flareGrad.addColorStop(1, 'rgba(0, 150, 255, 0)');
        ctx.fillStyle = flareGrad;
        ctx.beginPath();
        ctx.arc(nx, ny, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  // Super Jump / High Velocity Speed Streaks
  renderSpeedStreaks(ctx, width, height, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = `rgba(0, 240, 255, ${Math.max(0, Math.min(1, alpha * 0.4))})`;
    ctx.lineWidth = 1.5;

    const streakCount = 18;
    for (let i = 0; i < streakCount; i++) {
      const sx = ((i * 107 + (this.time * 400)) % width);
      const sy = ((i * 243 + (this.time * 1200)) % height);
      const len = 70 + (i % 5) * 35;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy + len);
      ctx.stroke();
    }
    ctx.restore();
  }
}
