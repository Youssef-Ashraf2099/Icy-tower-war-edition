export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  addSparks(x, y, count = 8, color = '#ffdd33') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 2.5,
        life: 0.2 + Math.random() * 0.3,
        maxLife: 0.5,
        gravity: 300,
        type: 'spark'
      });
    }
  }

  addShellCasing(x, y, aimAngle) {
    // Eject brass casing backward and up
    const ejectAngle = aimAngle + Math.PI + (Math.random() * 0.6 - 0.3);
    const speed = 120 + Math.random() * 100;
    this.particles.push({
      x,
      y,
      vx: Math.cos(ejectAngle) * speed,
      vy: Math.sin(ejectAngle) * speed - 120,
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 15,
      color: '#ffd700',
      width: 5,
      height: 2.5,
      life: 1.2,
      maxLife: 1.2,
      gravity: 800,
      bounces: 2,
      type: 'casing'
    });
  }

  addExplosion(x, y, isLarge = false) {
    this.addScreenShake(isLarge ? 12 : 6, isLarge ? 0.35 : 0.2);
    const count = isLarge ? 30 : 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (isLarge ? 320 : 180);
      const isFire = Math.random() > 0.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color: isFire ? (Math.random() > 0.5 ? '#ff3b30' : '#ff9500') : '#718096',
        size: isFire ? (4 + Math.random() * 6) : (6 + Math.random() * 8),
        life: 0.3 + Math.random() * 0.4,
        maxLife: 0.7,
        gravity: isFire ? 150 : -40, // smoke drifts up
        type: 'explosion'
      });
    }
  }

  addFloatingText(x, y, text, color = '#ffdd33', size = 16) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      size,
      vy: -60,
      life: 0.8,
      maxLife: 0.8
    });
  }

  addScreenShake(intensity, duration) {
    const mult = typeof this.shakeMultiplier === 'number' ? this.shakeMultiplier : 1.0;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity * mult);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  update(dt, platforms = []) {
    // Screen shake update
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= Math.pow(0.1, dt);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeIntensity = 0;
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;

      if (p.type === 'casing') {
        p.rotation += p.rotSpeed * dt;
        // Bounce on platforms
        if (p.bounces > 0) {
          for (const plat of platforms) {
            if (
              p.x >= plat.x &&
              p.x <= plat.x + plat.width &&
              p.y >= plat.y - 4 &&
              p.y <= plat.y + 4 &&
              p.vy > 0
            ) {
              p.y = plat.y - 4;
              p.vy = -p.vy * 0.4;
              p.vx *= 0.6;
              p.bounces--;
              break;
            }
          }
        }
      }
    }

    // Floating text update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  render(ctx, cameraY) {
    ctx.save();

    // Render particles
    for (const p of this.particles) {
      const screenY = p.y - cameraY;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;

      if (p.type === 'casing') {
        ctx.save();
        ctx.translate(p.x, screenY);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render floating texts
    for (const ft of this.floatingTexts) {
      const screenY = ft.y - cameraY;
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${ft.size}px Orbitron, sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, screenY);
    }

    ctx.restore();
  }
}
