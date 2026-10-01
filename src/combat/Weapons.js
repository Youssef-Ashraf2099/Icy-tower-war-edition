import { WEAPONS } from '../engine/Constants.js';
import { sounds } from '../audio/SoundEffects.js';

export class WeaponManager {
  constructor() {
    this.currentWeapon = WEAPONS.RIFLE;
    this.ammo = Infinity;
    this.fireTimer = 0;
    this.projectiles = [];
    this.beams = [];
  }

  setWeapon(weaponKey) {
    const w = WEAPONS[weaponKey] || WEAPONS.RIFLE;
    this.currentWeapon = w;
    this.ammo = w.ammo;
    this.fireTimer = 0;
  }

  addAmmo(amount = 12) {
    if (this.currentWeapon.ammo === Infinity) {
      // Default rifle has infinite basic ammo, so picking up ammo grants tactical reserve boost
      return { replenished: false, current: Infinity, weaponId: 'RIFLE' };
    }
    const maxAmmoMap = {
      SHOTGUN: 48,
      RPG: 18,
      RAILGUN: 24
    };
    const maxCap = maxAmmoMap[this.currentWeapon.id] || 40;
    const prev = this.ammo;
    this.ammo = Math.min(maxCap, this.ammo + amount);
    return { replenished: true, added: this.ammo - prev, current: this.ammo, weaponId: this.currentWeapon.id };
  }

  canFire() {
    return this.fireTimer <= 0 && (this.ammo > 0 || this.currentWeapon.ammo === Infinity);
  }

  // Returns recoil impulse { rx, ry }
  shoot(playerX, playerY, aimAngle, particleSystem) {
    if (!this.canFire()) return { rx: 0, ry: 0 };

    this.fireTimer = this.currentWeapon.fireRate;
    if (this.currentWeapon.ammo !== Infinity) {
      this.ammo--;
      if (this.ammo <= 0) {
        // Fallback to default rifle when special ammo empties
        this.setWeapon('RIFLE');
      }
    }

    const cosA = Math.cos(aimAngle);
    const sinA = Math.sin(aimAngle);

    // Muzzle position near player weapon
    const muzzleX = playerX + cosA * 28;
    const muzzleY = playerY + sinA * 28;

    // Shell casing ejection & muzzle spark
    particleSystem.addShellCasing(playerX, playerY, aimAngle);
    particleSystem.addSparks(muzzleX, muzzleY, 4, '#ffdd33');

    // Play weapon sound
    sounds.playShoot(this.currentWeapon.id);

    // Spawn projectiles
    if (this.currentWeapon.id === 'SHOTGUN') {
      for (let i = 0; i < this.currentWeapon.pellets; i++) {
        const spreadAngle = aimAngle + (Math.random() - 0.5) * this.currentWeapon.spread;
        this.projectiles.push({
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(spreadAngle) * this.currentWeapon.speed,
          vy: Math.sin(spreadAngle) * this.currentWeapon.speed,
          radius: 3.5,
          damage: this.currentWeapon.damage,
          life: 0.5,
          color: this.currentWeapon.color,
          type: 'PELLET'
        });
      }
    } else if (this.currentWeapon.id === 'RPG') {
      this.projectiles.push({
        x: muzzleX,
        y: muzzleY,
        vx: cosA * this.currentWeapon.speed,
        vy: sinA * this.currentWeapon.speed,
        radius: 6,
        damage: this.currentWeapon.damage,
        splashRadius: this.currentWeapon.splashRadius,
        life: 2.0,
        color: this.currentWeapon.color,
        type: 'ROCKET'
      });
    } else if (this.currentWeapon.id === 'RAILGUN') {
      // Instant visual high-energy plasma beam
      const beamLength = 1400;
      const endX = muzzleX + cosA * beamLength;
      const endY = muzzleY + sinA * beamLength;
      this.beams.push({
        x1: muzzleX,
        y1: muzzleY,
        x2: endX,
        y2: endY,
        angle: aimAngle,
        damage: this.currentWeapon.damage,
        life: 0.25,
        maxLife: 0.25,
        color: this.currentWeapon.color,
        hasCollided: false,
        hitList: new Set()
      });

      // High-velocity piercing plasma projectile for guaranteed continuous hit registration
      this.projectiles.push({
        x: muzzleX,
        y: muzzleY,
        vx: cosA * this.currentWeapon.speed,
        vy: sinA * this.currentWeapon.speed,
        radius: 6,
        damage: this.currentWeapon.damage,
        life: 0.7,
        color: this.currentWeapon.color,
        type: 'PLASMA',
        pierce: true,
        hitList: new Set()
      });

      particleSystem.addScreenShake(6, 0.18);
    } else {
      // Standard rifle
      this.projectiles.push({
        x: muzzleX,
        y: muzzleY,
        vx: cosA * this.currentWeapon.speed,
        vy: sinA * this.currentWeapon.speed,
        radius: 4,
        damage: this.currentWeapon.damage,
        life: 1.2,
        color: this.currentWeapon.color,
        type: 'BULLET'
      });
    }

    // Calculate Recoil: Opposite vector of aim
    // Shooting down (sinA > 0) creates upward recoil (-sinA < 0)
    const rx = -cosA * (this.currentWeapon.recoil * 0.7);
    const ry = -sinA * this.currentWeapon.recoil;

    return { rx, ry };
  }

  update(dt, particleSystem) {
    if (this.fireTimer > 0) {
      this.fireTimer -= dt;
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Rocket smoke trail
      if (p.type === 'ROCKET' && Math.random() < 0.6) {
        particleSystem.particles.push({
          x: p.x - (p.vx * 0.02),
          y: p.y - (p.vy * 0.02),
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          color: '#94a3b8',
          size: 3 + Math.random() * 3,
          life: 0.35,
          maxLife: 0.35,
          gravity: -20,
          type: 'smoke'
        });
      }
    }

    // Update beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.beams.splice(i, 1);
      }
    }
  }

  render(ctx, cameraY) {
    ctx.save();

    // Render beams
    for (const b of this.beams) {
      const alpha = Math.max(0, b.life / b.maxLife);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 6 * alpha;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1 - cameraY);
      ctx.lineTo(b.x2, b.y2 - cameraY);
      ctx.stroke();

      // White core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * alpha;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1 - cameraY);
      ctx.lineTo(b.x2, b.y2 - cameraY);
      ctx.stroke();
    }

    // Render projectiles
    for (const p of this.projectiles) {
      const screenY = p.y - cameraY;

      if (p.type === 'PLASMA') {
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(p.x, screenY, p.radius * 1.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, screenY, p.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Plasma lightning trail
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p.x, screenY);
        ctx.lineTo(p.x - p.vx * 0.04, screenY - p.vy * 0.04);
        ctx.stroke();
        ctx.shadowBlur = 0;
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.arc(p.x, screenY, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Bullet trail
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.radius;
      ctx.beginPath();
      ctx.moveTo(p.x, screenY);
      ctx.lineTo(p.x - p.vx * 0.03, screenY - p.vy * 0.03);
      ctx.stroke();
    }

    ctx.restore();
  }
}
