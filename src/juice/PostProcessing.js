// Post-Processing & Cinematic Visual FX Pipeline
// Delivers arcade-grade screen effects: Chromatic Aberration RGB Shift,
// Dynamic Shockwave Distortion Rings, Critical Health Heartbeat Vignette,
// Adrenaline Hyper-Focus Matrix, Speed Zoom Warp Streaks, and CRT Phosphor Simulation.

export class PostProcessing {
  constructor(canvas) {
    this.canvas = canvas;
    this.gameContainer = document.getElementById('game-container');
    this.crtOverlay = document.getElementById('crt-overlay');

    // Post-Processing Settings & Preferences
    this.settings = {
      crt: localStorage.getItem('wartower_fx_crt') !== 'false',
      chromatic: localStorage.getItem('wartower_fx_chromatic') !== 'false',
      shockwaves: localStorage.getItem('wartower_fx_shockwaves') !== 'false',
      shakeMultiplier: parseFloat(localStorage.getItem('wartower_fx_shake') || '1.0'),
      bloom: localStorage.getItem('wartower_fx_bloom') !== 'false'
    };

    // Dynamic Effect States
    this.aberration = 0;         // 0 to 1
    this.aberrationDecay = 3.5;
    this.glitchTimer = 0;

    this.shockwaves = [];        // Expanding refractive rings
    this.speedWarpAlpha = 0;     // 0 to 1
    this.heartbeatTimer = 0;
    this.adrenalinePulse = 0;

    this.applySettings();
  }

  applySettings() {
    if (this.crtOverlay) {
      if (this.settings.crt) {
        this.crtOverlay.classList.remove('disabled');
      } else {
        this.crtOverlay.classList.add('disabled');
      }
    }
  }

  setSetting(key, val) {
    this.settings[key] = val;
    localStorage.setItem(`wartower_fx_${key}`, val.toString());
    this.applySettings();
  }

  // --- TRIGGER EVENTS ---

  triggerDamage(amount = 20) {
    const intensity = Math.min(1.0, amount / 35.0);
    this.triggerAberration(0.85 * intensity, 0.35);
  }

  triggerAberration(intensity = 0.8, duration = 0.3) {
    if (!this.settings.chromatic) return;
    this.aberration = Math.min(1.0, this.aberration + intensity);
    this.aberrationDecay = 1.0 / Math.max(0.1, duration);
  }

  // Spawns expanding refractive shockwave ring in world space
  addShockwave(worldX, worldY, maxRadius = 240, color = '#00f0ff', duration = 0.45) {
    if (!this.settings.shockwaves) return;
    this.shockwaves.push({
      x: worldX,
      y: worldY,
      radius: 8,
      maxRadius,
      width: 14,
      color,
      life: duration,
      maxLife: duration
    });
    this.triggerAberration(0.35, 0.2);
  }

  update(dt, player) {
    // 1. Decay Chromatic Aberration
    if (this.aberration > 0) {
      this.aberration = Math.max(0, this.aberration - dt * this.aberrationDecay);
    }

    // 2. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      const progress = 1.0 - (sw.life / sw.maxLife);
      // Ease out expansion
      sw.radius = 8 + (sw.maxRadius - 8) * (1 - Math.pow(1 - progress, 3));
      sw.width = 14 * (1 - progress * 0.6);

      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Speed Warp Lines (When Super-Jumping or Sprint Launching)
    if (player && (player.vy < -550 || (player.sprintMomentum && player.sprintMomentum > 0.6))) {
      this.speedWarpAlpha = Math.min(0.8, this.speedWarpAlpha + dt * 4.0);
    } else {
      this.speedWarpAlpha = Math.max(0, this.speedWarpAlpha - dt * 3.5);
    }

    // 4. Critical Health Heartbeat Pulse (when HP < 35)
    if (player && player.hp < 35) {
      this.heartbeatTimer += dt * 3.8;
    } else {
      this.heartbeatTimer = 0;
    }

    // 5. Adrenaline Overdrive Pulse
    if (player && player.isOverdrive) {
      this.adrenalinePulse = Math.min(1.0, this.adrenalinePulse + dt * 5.0);
    } else {
      this.adrenalinePulse = Math.max(0, this.adrenalinePulse - dt * 3.0);
    }

    // 6. Apply Dynamic CSS Chromatic Aberration & Lens Flare Filters
    this.applyCanvasFilters();
  }

  applyCanvasFilters() {
    if (!this.canvas) return;

    if (this.settings.chromatic && this.aberration > 0.04) {
      // Authentic RGB split shift: red shifted left, cyan shifted right
      const shift = Math.round(this.aberration * 7.0);
      this.canvas.style.filter = `drop-shadow(${shift}px 0 0 rgba(255, 30, 80, 0.75)) drop-shadow(-${shift}px 0 0 rgba(0, 240, 255, 0.75))`;
    } else {
      this.canvas.style.filter = 'none';
    }
  }

  // Master Render Pass: Executed at the very end of Game.render() in screen coordinates
  render(ctx, width, height, cameraY, player) {
    ctx.save();

    // 1. Render Shockwave Refraction Rings
    if (this.settings.shockwaves && this.shockwaves.length > 0) {
      ctx.save();
      for (const sw of this.shockwaves) {
        const screenX = sw.x;
        const screenY = sw.y - cameraY;
        const alpha = Math.max(0, sw.life / sw.maxLife);

        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.width;
        ctx.globalAlpha = alpha * 0.75;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 16;

        ctx.beginPath();
        ctx.arc(screenX, screenY, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner secondary refraction ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0;
        ctx.globalAlpha = alpha * 0.9;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(1, sw.radius - 4), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. High-Speed Aerodynamic Warp Lines (Super-Jump / Supersonic Sprint)
    if (this.speedWarpAlpha > 0.05) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.8;

      const numLines = 24;
      const cx = width / 2;
      const cy = height * 0.65;

      for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * Math.PI * 2;
        const dist1 = 140 + (Math.sin(Date.now() * 0.015 + i) * 60);
        const dist2 = dist1 + 90 + (Math.cos(Date.now() * 0.02 + i) * 50);

        const x1 = cx + Math.cos(angle) * dist1;
        const y1 = cy + Math.sin(angle) * dist1;
        const x2 = cx + Math.cos(angle) * dist2;
        const y2 = cy + Math.sin(angle) * dist2;

        ctx.globalAlpha = Math.max(0, Math.min(1, this.speedWarpAlpha * (0.35 + 0.35 * Math.sin(i * 1.5))));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Adrenaline Bullet-Time Hyper-Focus Matrix Aura
    if (this.adrenalinePulse > 0.05) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // Cyan peripheral focus tunnel
      const adrGrad = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.28,
        width / 2, height / 2, width * 0.78
      );
      adrGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      adrGrad.addColorStop(0.7, `rgba(0, 240, 255, ${0.14 * this.adrenalinePulse})`);
      adrGrad.addColorStop(1, `rgba(0, 160, 255, ${0.32 * this.adrenalinePulse})`);

      ctx.fillStyle = adrGrad;
      ctx.fillRect(0, 0, width, height);

      // Micro digital telemetry scan grid line
      const scanY = (Date.now() * 0.4) % height;
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 * this.adrenalinePulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      ctx.restore();
    }

    // 4. Critical Health Heartbeat Alarm (< 35 HP)
    if (player && player.hp < 35) {
      // Systolic/diastolic dual heartbeat pulse waveform
      const pulsePhase = this.heartbeatTimer % (Math.PI * 2);
      const beatIntensity = Math.pow(Math.max(0, Math.sin(pulsePhase)), 4) * 0.6 +
                           Math.pow(Math.max(0, Math.sin(pulsePhase + 0.5)), 4) * 0.35;

      const dangerSeverity = (35 - player.hp) / 35; // 0 to 1
      const totalAlpha = (0.2 + 0.45 * dangerSeverity) * beatIntensity;

      ctx.save();
      const bloodGrad = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.30,
        width / 2, height / 2, width * 0.75
      );
      bloodGrad.addColorStop(0, 'rgba(180, 0, 30, 0)');
      bloodGrad.addColorStop(0.65, `rgba(180, 0, 30, ${totalAlpha * 0.55})`);
      bloodGrad.addColorStop(1, `rgba(110, 0, 15, ${totalAlpha})`);

      ctx.fillStyle = bloodGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    ctx.restore();
  }
}
