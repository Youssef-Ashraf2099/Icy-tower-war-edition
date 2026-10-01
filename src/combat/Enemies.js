import { sounds } from '../audio/SoundEffects.js';
import { sprites } from '../assets/SpriteManager.js';

export class EnemyManager {
  constructor() {
    this.enemies = [];
    this.enemyBullets = [];
    this.boss = null;
    this.totalKills = 0;
  }

  reset() {
    this.enemies = [];
    this.enemyBullets = [];
    this.boss = null;
    this.totalKills = 0;
  }

  spawnForPlatform(platform) {
    if (platform.floor < 2 || platform.type === 'CHECKPOINT') return;

    const rand = Math.random();
    if (rand < 0.28) {
      // Garrison Trooper
      this.enemies.push({
        type: 'TROOPER',
        x: platform.x + platform.width / 2 - 16,
        y: platform.y - 50,
        width: 36,
        height: 50,
        hp: 40,
        maxHp: 40,
        vx: 45 * (Math.random() > 0.5 ? 1 : -1),
        platform,
        shootCooldown: 1.8 + Math.random() * 1.5,
        facing: 1
      });
    } else if (rand < 0.48) {
      // Aerial Seeker Drone
      const screenW = window.innerWidth || 1024;
      this.enemies.push({
        type: 'DRONE',
        x: Math.max(60, Math.min(screenW - 120, platform.x + (Math.random() * 160 - 80))),
        y: platform.y - 110 - Math.random() * 40,
        width: 46,
        height: 34,
        hp: 30,
        maxHp: 30,
        baseY: platform.y - 110,
        hoverTimer: Math.random() * Math.PI * 2,
        shootCooldown: 2.2 + Math.random() * 1.5,
        facing: 1
      });
    } else if (rand < 0.60 && platform.floor > 6) {
      // Riot Shield Enforcer
      this.enemies.push({
        type: 'SHIELD_ENFORCER',
        x: platform.x + platform.width / 2 - 18,
        y: platform.y - 52,
        width: 40,
        height: 52,
        hp: 80,
        maxHp: 80,
        vx: 28 * (Math.random() > 0.5 ? 1 : -1),
        platform,
        shootCooldown: 2.5 + Math.random() * 1.0,
        facing: 1
      });
    }
  }

  checkBossSpawn(floor, cameraY, screenW = window.innerWidth || 1024) {
    // Disabled as requested by user: will be reintroduced in a future update on designated checkpoint floors
    return;
  }

  update(dt, player, particleSystem, cameraY, screenW = window.innerWidth || 1024) {
    const px = player.x;
    const py = player.y;

    // Update Boss
    if (this.boss) {
      const b = this.boss;
      b.y += (cameraY + 180 - b.y) * 2 * dt;
      b.strafeTimer += dt * 1.3;
      b.x = (screenW / 2) + Math.sin(b.strafeTimer) * (screenW * 0.32);

      // Gatling fire
      b.gatlingTimer -= dt;
      if (b.gatlingTimer <= 0) {
        b.gatlingTimer = 0.22;
        const angle = Math.atan2(py - b.y, px - b.x);
        this.enemyBullets.push({
          x: b.x + (Math.random() * 40 - 20),
          y: b.y + 35,
          vx: Math.cos(angle) * 460,
          vy: Math.sin(angle) * 460,
          radius: 4.5,
          damage: 12,
          color: '#ff2a4b'
        });
      }

      // Missile salvo
      b.missileTimer -= dt;
      if (b.missileTimer <= 0) {
        b.missileTimer = 3.8;
        for (let i = -1; i <= 1; i += 2) {
          const missileAngle = Math.atan2(py - b.y, px - (b.x + i * 50));
          this.enemyBullets.push({
            x: b.x + i * 50,
            y: b.y + 25,
            vx: Math.cos(missileAngle) * 290,
            vy: Math.sin(missileAngle) * 290,
            radius: 6,
            damage: 26,
            color: '#ff9500'
          });
        }
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Only cull enemies that have fallen far below the camera into the abyss
      if (e.y > cameraY + 1400) {
        this.enemies.splice(i, 1);
        continue;
      }

      if (e.shootFlash && e.shootFlash > 0) e.shootFlash -= dt;
      if (e.shieldFlash && e.shieldFlash > 0) e.shieldFlash -= dt;

      if (e.type === 'TROOPER' || e.type === 'SHIELD_ENFORCER') {
        // Reverse at platform edges
        if (e.x <= e.platform.x + 6) {
          e.x = e.platform.x + 6;
          e.vx = Math.abs(e.vx);
        } else if (e.x + e.width >= e.platform.x + e.platform.width - 6) {
          e.x = e.platform.x + e.platform.width - 6 - e.width;
          e.vx = -Math.abs(e.vx);
        }

        e.x += e.vx * dt;

        // Dynamic angle calculation to player
        const dx = px - (e.x + e.width / 2);
        const dy = py - (e.y + 18);
        const dist = Math.hypot(dx, dy);
        e.aimAngle = Math.atan2(dy, dx);
        e.playerDist = dist;

        // When player is within line of sight (< 480px), face and aim at player!
        const inCombatRange = dist < 480 && Math.abs(py - e.y) < 280;
        if (inCombatRange) {
          e.facing = dx >= 0 ? 1 : -1;
          e.isAiming = true;
        } else {
          e.isAiming = false;
          e.facing = e.vx >= 0 ? 1 : -1;
        }

        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0 && inCombatRange) {
          e.shootCooldown = 2.2 + Math.random() * 1.4;
          e.facing = dx >= 0 ? 1 : -1;
          e.shootFlash = 0.22;
          sounds.playShoot('RIFLE');

          const muzzleX = e.x + e.width / 2 + Math.cos(e.aimAngle) * 22;
          const muzzleY = e.y + 18 + Math.sin(e.aimAngle) * 22;

          this.enemyBullets.push({
            x: muzzleX,
            y: muzzleY,
            vx: Math.cos(e.aimAngle) * 410,
            vy: Math.sin(e.aimAngle) * 410,
            radius: 4,
            damage: 10,
            color: '#ff3344'
          });
          particleSystem.addSparks(muzzleX, muzzleY, 8, '#ff3344');
          particleSystem.addShellCasing(e.x + e.width / 2, e.y + 16, e.aimAngle);
        }
      } else if (e.type === 'DRONE') {
        e.hoverTimer += dt * 3;
        e.y = e.baseY + Math.sin(e.hoverTimer) * 20;

        const driftVx = (px - e.x) * 0.45;
        e.x += driftVx * dt;

        // Dynamic aim angle from drone center to player
        const droneDx = px - (e.x + e.width / 2);
        const droneDy = py - (e.y + e.height / 2);
        const droneDist = Math.hypot(droneDx, droneDy);
        e.aimAngle = Math.atan2(droneDy, droneDx);
        e.playerDist = droneDist;

        // Face towards player when engaging, bank with drift
        e.facing = droneDx >= 0 ? 1 : -1;
        e.bankAngle = Math.max(-0.25, Math.min(0.25, driftVx * 0.0035));

        if (e.recoilAngle) {
          e.recoilAngle += (0 - e.recoilAngle) * 8 * dt;
        }

        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0 && droneDist < 520 && Math.abs(droneDy) < 380) {
          e.shootCooldown = 2.5 + Math.random() * 1.5;
          e.facing = droneDx >= 0 ? 1 : -1;
          e.shootFlash = 0.25;
          e.recoilAngle = -e.facing * 0.18; // drone banks back from weapon impulse!
          sounds.playShoot('RIFLE');

          const turretMuzzleX = e.x + e.width / 2 + Math.cos(e.aimAngle) * 16;
          const turretMuzzleY = e.y + e.height / 2 + 8 + Math.sin(e.aimAngle) * 16;

          this.enemyBullets.push({
            x: turretMuzzleX,
            y: turretMuzzleY,
            vx: Math.cos(e.aimAngle) * 360,
            vy: Math.sin(e.aimAngle) * 360,
            radius: 4.8,
            damage: 14,
            color: '#ff2a4b'
          });
          particleSystem.addSparks(turretMuzzleX, turretMuzzleY, 6, '#00f0ff');
        }
      }
    }

    // Update Enemy Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.y > cameraY + 1000 || b.y < cameraY - 100 || b.x < 0 || b.x > screenW) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  render(ctx, cameraY) {
    ctx.save();

    // Render Boss
    if (this.boss) {
      const b = this.boss;
      const screenY = b.y - cameraY;
      sprites.drawBoss(ctx, b, screenY);

      // Boss HP Bar
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(b.x - 70, screenY - b.height / 2 - 20, 140, 10);
      ctx.fillStyle = '#ff2a4b';
      ctx.fillRect(b.x - 70, screenY - b.height / 2 - 20, 140 * (b.hp / b.maxHp), 10);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x - 70, screenY - b.height / 2 - 20, 140, 10);
    }

    // Render Enemies
    for (const e of this.enemies) {
      const screenY = e.y - cameraY;

      if (e.type === 'DRONE') {
        sprites.drawDrone(ctx, e, screenY);
      } else {
        sprites.drawSoldier(ctx, e, screenY);
      }

      // Mini Health Bar
      if (e.hp < e.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(e.x, screenY - 10, e.width, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x, screenY - 10, e.width * (e.hp / e.maxHp), 5);
      }
    }

    // Render Enemy Bullets
    for (const b of this.enemyBullets) {
      const screenY = b.y - cameraY;
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.x, screenY, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
