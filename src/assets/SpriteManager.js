import { assets } from './AssetLoader.js';

export class SpriteManager {
  constructor() {
    this.ready = false;
  }

  init() {
    this.heroImg = assets.getImage('hero');
    this.heroModularImg = assets.getImage('heroModular');
    this.heroWallAcroImg = assets.getImage('heroWallAcro');
    this.heroAcrobaticsImg = assets.getImage('heroAcrobatics');
    this.weaponsHdImg = assets.getImage('weaponsHd');
    this.combatUiImg = assets.getImage('combatUi');
    this.platformsImg = assets.getImage('platforms');
    this.droneImg = assets.getImage('drone');
    this.soldierImg = assets.getImage('soldier');
    this.weaponsImg = assets.getImage('weapons');
    this.crateGreenImg = assets.getImage('crateGreen');
    this.crateGoldImg = assets.getImage('crateGold');
    this.crateRedImg = assets.getImage('crateRed');
    this.uiBadgesImg = assets.getImage('uiBadges');
    this.bossImg = assets.getImage('bossGunship');
    this.bgImg = assets.getImage('background');
    this.wallColumnImg = assets.getImage('wallColumn');
    this.pickupShotgunImg = assets.getImage('pickupShotgun');
    this.pickupRpgImg = assets.getImage('pickupRpg');
    this.pickupRailgunImg = assets.getImage('pickupRailgun');
    this.pickupRifleImg = assets.getImage('pickupRifle');
    this.crateAmmoImg = assets.getImage('crateAmmo');
    this.ready = true;
  }

  // Draw 3-piece modular platform using transparent high-res tileset
  drawPlatform(ctx, type, x, y, width, height, isHazardDestroyed = false) {
    if (!this.platformsImg) {
      ctx.fillStyle = type === 'ICE' ? '#38bdf8' : type === 'BOUNCE' ? '#10b981' : type === 'HAZARD' ? '#ef4444' : '#475569';
      ctx.fillRect(x, y, width, height);
      return;
    }

    let sy = 62;
    let sh = 135;
    if (type === 'ICE') { sy = 264; sh = 135; }
    else if (type === 'CRUMBLING') { sy = 458; sh = 115; }
    else if (type === 'BOUNCE') { sy = 652; sh = 130; }
    else if (type === 'HAZARD') { sy = 864; sh = 115; }

    const capW = 24;
    const centerW = Math.max(10, width - capW * 2);

    ctx.save();
    if (isHazardDestroyed) {
      ctx.filter = 'grayscale(100%) brightness(80%)';
      ctx.globalAlpha = 0.85;
    }

    // Left cap
    ctx.drawImage(this.platformsImg, 30, sy, 180, sh, x, y - 4, capW, height + 8);
    // Center tiled stretch
    ctx.drawImage(this.platformsImg, 240, sy, 520, sh, x + capW, y - 4, centerW, height + 8);
    // Right cap
    ctx.drawImage(this.platformsImg, 780, sy, 180, sh, x + width - capW, y - 4, capW, height + 8);

    ctx.restore();
  }

  // Draw specific equipped weapon model with aim angle, recoil kick, and muzzle flash
  drawEquippedWeapon(ctx, weaponType, isFacingLeft, isShooting = false, recoil = 0) {
    if (!this.weaponsHdImg) return;

    let sx = 189, sy = 38, sw = 635, sh = 218;
    let targetW = 38, targetH = 14;
    let barrelTipX = 22, barrelTipY = 0;

    switch (weaponType) {
      case 'SHOTGUN':
        sx = 261; sy = 256; sw = 574; sh = 256;
        targetW = 36; targetH = 16;
        barrelTipX = 20; barrelTipY = -1;
        break;
      case 'RPG':
        sx = 105; sy = 512; sw = 813; sh = 256;
        targetW = 46; targetH = 15;
        barrelTipX = 26; barrelTipY = -2;
        break;
      case 'RAILGUN':
        sx = 136; sy = 768; sw = 753; sh = 225;
        targetW = 44; targetH = 14;
        barrelTipX = 24; barrelTipY = 0;
        break;
      case 'RIFLE':
      default:
        sx = 189; sy = 38; sw = 635; sh = 218;
        targetW = 38; targetH = 14;
        barrelTipX = 22; barrelTipY = 0;
        break;
    }

    ctx.save();
    // Kick back along gun barrel axis
    ctx.translate(-recoil * 6, 0);

    // Draw the weapon sprite
    ctx.drawImage(
      this.weaponsHdImg,
      sx, sy, sw, sh,
      -8, -targetH / 2,
      targetW, targetH
    );

    // Muzzle flash when firing
    if (isShooting) {
      const flashColor = weaponType === 'RAILGUN' ? '#00f0ff' : weaponType === 'RPG' ? '#ffaa00' : '#ffff44';
      ctx.fillStyle = flashColor;
      ctx.shadowColor = flashColor;
      ctx.shadowBlur = 16;

      ctx.beginPath();
      ctx.ellipse(barrelTipX, barrelTipY, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sharp directional muzzle spike
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(barrelTipX - 2, barrelTipY);
      ctx.lineTo(barrelTipX + 10, barrelTipY);
      ctx.stroke();

      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // Draw Hero Commando with Acrobatics, Rigged Aiming, Wall Dynamics, and Modular Weapon Holding
  drawHero(ctx, info) {
    const {
      action = 'IDLE',
      isFacingLeft = false,
      flipProgress = 0,
      aimAngle = 0,
      weaponType = 'RIFLE',
      isShooting = false,
      recoil = 0,
      wallKickFacing = 1,
      runAnimTimer = 0
    } = info;

    if (!this.heroModularImg && !this.heroImg) {
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-18, -27, 36, 54);
      return;
    }

    // 1. Acrobatic Wall Slide with Friction Sparks
    if (action === 'WALL_SLIDE' && this.heroWallAcroImg) {
      ctx.save();
      ctx.scale(isFacingLeft ? -1 : 1, 1);

      // WALL_ACTIONS_0: Commando gripping wall girder while sliding
      ctx.drawImage(this.heroWallAcroImg, 104, 30, 203, 264, -24, -28, 48, 56);

      // Glowing wall friction sparks spraying off the boots
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      const sparkY = 24 + Math.random() * 6;
      ctx.beginPath();
      ctx.arc(-14, sparkY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw equipped weapon held ready
      ctx.save();
      ctx.translate(-2, -8);
      ctx.rotate(0.35); // Aiming diagonally down-forward
      this.drawEquippedWeapon(ctx, weaponType, isFacingLeft, isShooting, recoil);
      ctx.restore();

      ctx.restore();
      return;
    }

    // 2. Acrobatic Wall Kick Rebound
    if (action === 'WALL_KICK' && this.heroWallAcroImg) {
      ctx.save();
      ctx.scale(wallKickFacing, 1);

      // WALL_ACTIONS_1: Commando jet boots kicking off wall girder
      ctx.drawImage(this.heroWallAcroImg, 379, 30, 286, 315, -26, -28, 52, 58);

      // Jet burst propulsion flare off the wall
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.ellipse(-20, 16, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw equipped weapon in hands
      ctx.save();
      ctx.translate(6, -6);
      ctx.rotate(-0.2);
      this.drawEquippedWeapon(ctx, weaponType, wallKickFacing < 0, isShooting, recoil);
      ctx.restore();

      ctx.restore();
      return;
    }

    // 3. Acrobatic 360° Somersault Flip (Super-Jump / High-Velocity Air Rebound)
    if (action === 'FLIP') {
      const sourceImg = this.heroModularImg || this.heroAcrobaticsImg;
      if (sourceImg) {
        ctx.save();
        ctx.scale(isFacingLeft ? -1 : 1, 1);
        ctx.rotate(flipProgress * Math.PI * 2 * (isFacingLeft ? -1 : 1));

        // Aerodynamic glowing cyan slipstream vortex ring
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2 * (flipProgress + 0.35));
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Choose flip tuck frame
        const flipFrames = [
          { sx: 36, sy: 553, sw: 215, sh: 179, w: 48, h: 44 },
          { sx: 302, sy: 537, sw: 190, sh: 180, w: 44, h: 48 },
          { sx: 532, sy: 537, sw: 221, sh: 210, w: 48, h: 48 },
          { sx: 793, sy: 517, sw: 190, sh: 232, w: 46, h: 52 }
        ];
        const fIdx = Math.min(3, Math.floor(flipProgress * 4));
        const f = flipFrames[fIdx];

        if (this.heroModularImg) {
          ctx.drawImage(this.heroModularImg, f.sx, f.sy, f.sw, f.sh, -f.w / 2, -f.h / 2, f.w, f.h);
        } else {
          ctx.drawImage(this.heroAcrobaticsImg, 56, 71, 208, 178, -24, -21, 48, 42);
        }

        // Equipped weapon held tight in tactical flip position
        ctx.save();
        ctx.translate(2, -2);
        this.drawEquippedWeapon(ctx, weaponType, false, isShooting, recoil);
        ctx.restore();

        ctx.restore();
        return;
      }
    }

    // 4. Supersonic Dive Stomp
    if (action === 'STOMP') {
      const sourceImg = this.heroWallAcroImg || this.heroAcrobaticsImg;
      if (sourceImg) {
        ctx.save();
        ctx.rotate(Math.PI / 2); // Downward aerodynamic dive
        if (this.heroWallAcroImg) {
          ctx.drawImage(this.heroWallAcroImg, 34, 789, 614, 216, -34, -18, 68, 36);
        } else {
          ctx.drawImage(this.heroAcrobaticsImg, 89, 722, 403, 200, -32, -18, 64, 36);
        }

        // Twin supersonic rocket trails streaming behind boots
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-32, -6);
        ctx.lineTo(-72, -6);
        ctx.moveTo(-32, 6);
        ctx.lineTo(-72, 6);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
        return;
      }
    }

    // 5. Rigged Grounded & Airborne Commando (Unarmed Base + Aim Tracking + Dynamic Weapon)
    if (this.heroModularImg) {
      // Calculate aim angle normalized in local facing coordinates
      const localAngle = isFacingLeft ? Math.PI - aimAngle : aimAngle;
      let normAngle = localAngle;
      while (normAngle > Math.PI) normAngle -= Math.PI * 2;
      while (normAngle < -Math.PI) normAngle += Math.PI * 2;

      // Dynamic torso rotational pitch (leans smoothly towards the crosshair)
      const torsoTilt = Math.max(-0.20, Math.min(0.20, normAngle * 0.28));

      // Select unarmed torso frame based on aim pitch
      // TORSOS_1: Aiming UP, TORSOS_2: Aiming DOWN, TORSOS_0: Level aim
      let torsoFrame = { sx: 61, sy: 286, sw: 139, sh: 184 }; // Level
      if (normAngle < -0.32) {
        torsoFrame = { sx: 312, sy: 286, sw: 139, sh: 184 }; // Aim UP
      } else if (normAngle > 0.32) {
        torsoFrame = { sx: 558, sy: 292, sw: 134, sh: 178 }; // Aim DOWN
      }

      // Select lower body leg frame
      let legFrame = { sx: 696, sy: 61, sw: 129, sh: 153 }; // Idle stance
      if (action === 'RUN') {
        const runCycle = [
          { sx: 25, sy: 61, sw: 165, sh: 159 },
          { sx: 205, sy: 61, sw: 118, sh: 159 },
          { sx: 363, sy: 61, sw: 129, sh: 158 },
          { sx: 532, sy: 61, sw: 118, sh: 159 }
        ];
        const fIdx = Math.floor((runAnimTimer || Date.now() / 110)) % 4;
        legFrame = runCycle[fIdx];
      } else if (action === 'STRAFE') {
        // Reversed tactical combat strafe (moonwalk combat stride while aiming forward)
        const strafeCycle = [
          { sx: 844, sy: 61, sw: 160, sh: 159 },
          { sx: 532, sy: 61, sw: 118, sh: 159 },
          { sx: 363, sy: 61, sw: 129, sh: 158 },
          { sx: 205, sy: 61, sw: 118, sh: 159 }
        ];
        const fIdx = Math.floor((runAnimTimer || Date.now() / 110)) % 4;
        legFrame = strafeCycle[fIdx];
      } else if (action === 'JUMP') {
        // Airborne jump reach
        legFrame = { sx: 793, sy: 517, sw: 190, sh: 232 };
      }

      ctx.save();
      ctx.scale(isFacingLeft ? -1 : 1, 1);

      // A. Draw Lower Body (Legs & Boots)
      ctx.drawImage(
        this.heroModularImg,
        legFrame.sx, legFrame.sy, legFrame.sw, legFrame.sh,
        -20, -6, 40, 36
      );

      // B. Draw Upper Body (Unarmed Torso & Helmet - Tilts dynamically with spine)
      ctx.save();
      ctx.translate(0, 2);
      ctx.rotate(torsoTilt);
      ctx.drawImage(
        this.heroModularImg,
        torsoFrame.sx, torsoFrame.sy, torsoFrame.sw, torsoFrame.sh,
        -18, -44, 36, 48
      );

      // C. Draw Rigged Shoulder, Glove & Equipped Weapon (ONLY 1 WEAPON - 360° Cursor Aim)
      // Shoulder pivot is mounted directly onto the tilted torso chest socket!
      const shoulderX = 0;
      const shoulderY = -22;
      ctx.save();
      ctx.translate(shoulderX, shoulderY);

      // Rotate arm & weapon directly along target line of sight
      ctx.rotate(normAngle - torsoTilt);

      // Tactical cybernetic glove & sleeve
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-6, -4, 12, 8, 3);
      ctx.fill();
      ctx.stroke();

      // Support fore-end grip arm
      ctx.drawImage(this.heroModularImg, 41, 788, 185, 189, -7, -6, 20, 16);

      // Dynamically render the equipped weapon in hands!
      this.drawEquippedWeapon(ctx, weaponType, isFacingLeft, isShooting, recoil);

      ctx.restore(); // shoulder
      ctx.restore(); // torso
      ctx.restore(); // facing
      return;
    }

    // Fallback: Legacy Monolithic Commando
    let sx = 45, sy = 35, sw = 160, sh = 215;
    let targetW = 48, targetH = 58;
    if (action === 'JUMP') {
      sx = 45; sy = 510; sw = 160; sh = 270;
      targetW = 46; targetH = 64;
    } else if (action === 'RUN' || action === 'STRAFE') {
      const runFrame = Math.floor(Date.now() / 110) % 4;
      sx = 35 + runFrame * 195;
      sy = 275; sw = 175; sh = 220;
      targetW = 50; targetH = 58;
    }

    ctx.save();
    ctx.scale(isFacingLeft ? -1 : 1, 1);
    ctx.drawImage(this.heroImg, sx, sy, sw, sh, -targetW / 2, -targetH / 2, targetW, targetH);
    ctx.restore();
  }

  // Draw High-Tech Sci-Fi Fortress Modular Wall Pillars along Left & Right Screen Edges
  drawFortressWalls(ctx, width, height, cameraY) {
    const wallW = 46;
    const tileH = 512;
    // Parallax scrolling gives an awesome sensation of height climb
    const scrollY = (cameraY * 0.42) % tileH;
    const startY = -scrollY - tileH;
    const endY = height + tileH;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);

    // A. Left Wall (Pillar with hazard girder and neon cyan conduit facing into arena)
    ctx.save();
    if (this.wallColumnImg) {
      for (let y = startY; y < endY; y += tileH) {
        ctx.drawImage(this.wallColumnImg, 0, y, wallW, tileH);
      }
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, wallW, height);
      ctx.fillStyle = '#ffaa00';
      for (let y = 0; y < height; y += 75) {
        ctx.fillRect(6, y, 6, 22);
      }
    }

    // Glowing Neon Cyan Running Strip along Left Wall Interior Edge
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8 * pulse;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallW - 2, 0);
    ctx.lineTo(wallW - 2, height);
    ctx.stroke();

    // Strobe Marker LED Beacons on Left Wall
    for (let by = (-(cameraY * 0.42) % 180); by < height + 180; by += 180) {
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 10 * pulse;
      ctx.fillRect(wallW - 5, by - 4, 4, 8);
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // B. Right Wall (Horizontally Mirrored so hazard girder and conduit face inwards)
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);

    if (this.wallColumnImg) {
      for (let y = startY; y < endY; y += tileH) {
        ctx.drawImage(this.wallColumnImg, 0, y, wallW, tileH);
      }
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, wallW, height);
      ctx.fillStyle = '#ffaa00';
      for (let y = 0; y < height; y += 75) {
        ctx.fillRect(6, y, 6, 22);
      }
    }

    // Glowing Neon Cyan Running Strip along Right Wall Interior Edge
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8 * pulse;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallW - 2, 0);
    ctx.lineTo(wallW - 2, height);
    ctx.stroke();

    // Strobe Marker LED Beacons on Right Wall
    for (let by = (-(cameraY * 0.42) % 180); by < height + 180; by += 180) {
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 10 * pulse;
      ctx.fillRect(wallW - 5, by - 4, 4, 8);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Draw Enemy Drone with animated thrusters, dynamic player tracking optic sensor, and aiming turret
  drawDrone(ctx, drone, screenY) {
    if (!this.droneImg) {
      ctx.fillStyle = '#ff2a4b';
      ctx.beginPath();
      ctx.ellipse(drone.x + drone.width / 2, screenY + drone.height / 2, drone.width / 2, drone.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const hoverFrame = Math.floor(Date.now() / 140) % 5;
    const sx = 10 + hoverFrame * 165;
    const sy = 40;
    const sw = 155;
    const sh = 105;

    // Calculate local aim angle
    let localAimAngle = drone.aimAngle || 0;
    if (drone.facing < 0) {
      localAimAngle = Math.PI - localAimAngle;
    }
    while (localAimAngle > Math.PI) localAimAngle -= Math.PI * 2;
    while (localAimAngle < -Math.PI) localAimAngle += Math.PI * 2;
    const clampedAngle = Math.max(-0.8, Math.min(0.8, localAimAngle));

    ctx.save();
    ctx.translate(drone.x + drone.width / 2, screenY + drone.height / 2);

    // Dynamic banking tilt when drifting horizontally, plus recoil kick
    ctx.rotate((drone.bankAngle || 0) + (drone.recoilAngle || 0));
    ctx.scale(drone.facing, 1);

    // Twin Animated Jet Thruster Flames underneath engines
    const thrusterFlameH = 7 + Math.sin(Date.now() * 0.035 + drone.x) * 4;
    const flameGrad = ctx.createLinearGradient(0, drone.height / 2 - 4, 0, drone.height / 2 + thrusterFlameH);
    flameGrad.addColorStop(0, '#00f0ff');
    flameGrad.addColorStop(0.5, '#0088ff');
    flameGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = flameGrad;

    // Left and right thruster plumes
    ctx.beginPath();
    ctx.ellipse(-12, drone.height / 2 + thrusterFlameH / 2, 3, thrusterFlameH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, drone.height / 2 + thrusterFlameH / 2, 3, thrusterFlameH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic Targeting Laser Sight when tracking and preparing to fire
    if (drone.shootCooldown < 0.8 && drone.shootCooldown > 0) {
      const laserAlpha = Math.min(1.0, (0.8 - drone.shootCooldown) / 0.4);
      const pulseLaser = 0.7 + 0.3 * Math.sin(Date.now() * 0.02);
      ctx.save();
      ctx.translate(14, 4);
      ctx.rotate(clampedAngle);
      ctx.strokeStyle = `rgba(255, 42, 75, ${laserAlpha * pulseLaser})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ff2a4b';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(240, 0);
      ctx.stroke();

      // Blinking targeting reticle dot at end of laser
      ctx.fillStyle = '#ff2a4b';
      ctx.beginPath();
      ctx.arc(240, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Drone Main Chassis
    ctx.drawImage(this.droneImg, sx, sy, sw, sh, -drone.width / 2 - 4, -drone.height / 2 - 4, drone.width + 8, drone.height + 8);

    // Dynamic Cybernetic Optic Sensor (glowing red eye tracking player inside the visor)
    const eyeOffsetX = Math.cos(clampedAngle) * 4;
    const eyeOffsetY = Math.sin(clampedAngle) * 3;
    ctx.fillStyle = '#ff1a3b';
    ctx.shadowColor = '#ff1a3b';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(4 + eyeOffsetX, -2 + eyeOffsetY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4 + eyeOffsetX + 1, -2 + eyeOffsetY, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Rotatable Under-Slung Dual Plasma Turret Cannons
    ctx.save();
    ctx.translate(6, 8);
    ctx.rotate(clampedAngle);
    // Draw turret barrel
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -3, 14, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, -1, 12, 2);

    // Muzzle flash when firing bullet
    if (drone.shootFlash && drone.shootFlash > 0) {
      ctx.fillStyle = '#ff3344';
      ctx.shadowColor = '#ff2a4b';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(16, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(15, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    ctx.restore();
  }

  // Draw Patrol Soldier / Shield Enforcer with dynamic aim tracking, targeting laser, and recoil animation
  drawSoldier(ctx, soldier, screenY) {
    if (!this.soldierImg) {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(soldier.x, screenY, soldier.width, soldier.height);
      return;
    }

    let sx = 40, sy = 30, sw = 135, sh = 145;
    if (soldier.type === 'SHIELD_ENFORCER') {
      sx = 30; sy = 510; sw = 170; sh = 160;
    } else {
      const walkFrame = Math.floor(Date.now() / 150) % 5;
      sx = 35 + walkFrame * 165;
      sy = 30;
    }

    // Calculate local aim angle
    let localAimAngle = soldier.aimAngle || 0;
    if (soldier.facing < 0) {
      localAimAngle = Math.PI - localAimAngle;
    }
    while (localAimAngle > Math.PI) localAimAngle -= Math.PI * 2;
    while (localAimAngle < -Math.PI) localAimAngle += Math.PI * 2;
    // Natural human aiming arc (-55° to +55°)
    const clampedAngle = Math.max(-0.95, Math.min(0.95, localAimAngle));

    ctx.save();
    ctx.translate(soldier.x + soldier.width / 2, screenY + soldier.height / 2);
    ctx.scale(soldier.facing, 1);

    // Recoil kickback along aim angle when firing
    const recoilKick = (soldier.shootFlash && soldier.shootFlash > 0) ? 4.5 : 0;
    ctx.translate(-Math.cos(clampedAngle) * recoilKick, -Math.sin(clampedAngle) * recoilKick * 0.4);

    // Dynamic Targeting Laser Sight when aiming at Harold prior to firing
    if (soldier.shootCooldown < 0.7 && soldier.shootCooldown > 0 && Math.abs(clampedAngle) < 1.0) {
      const laserAlpha = Math.min(1.0, (0.7 - soldier.shootCooldown) / 0.35);
      const pulseLaser = 0.7 + 0.3 * Math.sin(Date.now() * 0.025);
      ctx.save();
      ctx.translate(14, -2);
      ctx.rotate(clampedAngle);
      ctx.strokeStyle = `rgba(255, 50, 68, ${laserAlpha * pulseLaser})`;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#ff2a4b';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(260, 0);
      ctx.stroke();

      // Blinking red lock-on target pip
      ctx.fillStyle = '#ff3344';
      ctx.beginPath();
      ctx.arc(260, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Base Soldier Body (Clean handcrafted pixel art with authentic weapon and riot shield)
    ctx.drawImage(this.soldierImg, sx, sy, sw, sh, -soldier.width / 2 - 4, -soldier.height / 2 - 4, soldier.width + 8, soldier.height + 8);

    // Natural muzzle flash when firing bullet from weapon tip
    if (soldier.shootFlash && soldier.shootFlash > 0) {
      ctx.fillStyle = '#ff3344';
      ctx.shadowColor = '#ff2a4b';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(soldier.width / 2 + 6, 2, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(soldier.width / 2 + 2, 2);
      ctx.lineTo(soldier.width / 2 + 12, 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // Draw Floating Weapon Pickup Model (Shotgun, RPG, Railgun, Rifle) with Holographic Pedestal & Badge
  drawFloatingWeaponPickup(ctx, weaponId, x, y, floor = 0) {
    const bobY = y + Math.sin(Date.now() * 0.0035 + floor * 1.2) * 5;
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.006 + floor);

    let img = this.pickupShotgunImg;
    let label = 'CQB-8 SHOTGUN';
    let glowColor = '#00f0ff';
    let badgeColor = '#00f0ff';
    let targetW = 54;
    let targetH = 23;

    if (weaponId === 'RPG') {
      img = this.pickupRpgImg;
      label = 'AT-4 ROCKET';
      glowColor = '#ff6600';
      badgeColor = '#ffaa00';
      targetW = 56;
      targetH = 24;
    } else if (weaponId === 'RAILGUN') {
      img = this.pickupRailgunImg;
      label = 'PARTICLE RAILGUN';
      glowColor = '#00f0ff';
      badgeColor = '#38bdf8';
      targetW = 58;
      targetH = 22;
    } else if (weaponId === 'RIFLE') {
      img = this.pickupRifleImg;
      label = 'COMM-RIFLE';
      glowColor = '#00f0ff';
      badgeColor = '#00f0ff';
      targetW = 54;
      targetH = 24;
    }

    ctx.save();

    // 1. Holographic Pedestal on platform surface
    const pedX = x + 16;
    const pedY = y + 26;
    ctx.fillStyle = '#0b1120';
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10 * pulse;
    ctx.beginPath();
    ctx.ellipse(pedX, pedY, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Upward Hologram Projection Cone
    const holoGrad = ctx.createLinearGradient(0, pedY, 0, bobY);
    holoGrad.addColorStop(0, `rgba(0, 240, 255, ${0.35 * pulse})`);
    holoGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = holoGrad;
    ctx.beginPath();
    ctx.moveTo(pedX - 16, pedY);
    ctx.lineTo(pedX + 16, pedY);
    ctx.lineTo(pedX + targetW / 2, bobY);
    ctx.lineTo(pedX - targetW / 2, bobY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Floating Weapon Model
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    if (img) {
      ctx.drawImage(img, pedX - targetW / 2, bobY - targetH / 2, targetW, targetH);
    } else {
      ctx.fillStyle = glowColor;
      ctx.fillRect(pedX - targetW / 2, bobY - targetH / 2, targetW, targetH);
    }
    ctx.shadowBlur = 0;

    // 4. Floating Tactical Weapon Name Badge
    const badgeW = label.length * 7 + 16;
    const badgeH = 15;
    const badgeY = bobY - targetH / 2 - 14;

    ctx.fillStyle = 'rgba(10, 15, 28, 0.88)';
    ctx.beginPath();
    ctx.roundRect(pedX - badgeW / 2, badgeY, badgeW, badgeH, 3);
    ctx.fill();

    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '900 9px Orbitron, sans-serif';
    ctx.fillStyle = badgeColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.fillText(label, pedX, badgeY + 11);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // Draw Tactical Military Ammo Supply Crate
  drawAmmoCrate(ctx, x, y) {
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.005);
    ctx.save();

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 26, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ammo Crate Sprite
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 10 * pulse;
    if (this.crateAmmoImg) {
      ctx.drawImage(this.crateAmmoImg, x - 2, y, 40, 30);
    } else {
      ctx.fillStyle = '#1e3a1e';
      ctx.fillRect(x, y, 36, 26);
    }
    ctx.shadowBlur = 0;

    // Floating Stenciled Label Badge
    const badgeY = y - 12;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(x - 6, badgeY, 48, 14, 3);
    ctx.fill();

    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '900 8.5px Orbitron, sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.fillText('AMMO CACHE', x + 18, badgeY + 10);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // Draw Tactical Medical Armor Crate
  drawMedkitCrate(ctx, x, y) {
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.005);
    ctx.save();

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 24, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 12 * pulse;
    if (this.crateGreenImg) {
      ctx.drawImage(this.crateGreenImg, x, y, 36, 26);
    } else {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x, y, 36, 26);
    }
    ctx.shadowBlur = 0;

    // Floating Stenciled Label Badge
    const badgeY = y - 12;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(x - 6, badgeY, 48, 14, 3);
    ctx.fill();

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '900 8.5px Orbitron, sans-serif';
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.fillText('+40 ARMOR', x + 18, badgeY + 10);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // Draw Supply Crate or Floating Weapon Item based on item type
  drawCrate(ctx, type, x, y, floor = 0) {
    if (type === 'AMMO' || type === 'AMMO_BOX') {
      this.drawAmmoCrate(ctx, x, y);
    } else if (type === 'MEDKIT') {
      this.drawMedkitCrate(ctx, x, y);
    } else if (type === 'SHOTGUN' || type === 'RPG' || type === 'RAILGUN' || type === 'RIFLE') {
      this.drawFloatingWeaponPickup(ctx, type, x, y, floor);
    } else {
      this.drawAmmoCrate(ctx, x, y);
    }
  }

  // Draw Boss Gunship
  drawBoss(ctx, boss, screenY) {
    if (!this.bossImg) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(boss.x - boss.width / 2, screenY - boss.height / 2, boss.width, boss.height);
      return;
    }

    const rotorFrame = Math.floor(Date.now() / 80) % 4;
    const sx = 20 + rotorFrame * 245;
    const sy = 40;
    const sw = 230;
    const sh = 130;

    ctx.save();
    ctx.drawImage(this.bossImg, sx, sy, sw, sh, boss.x - boss.width / 2, screenY - boss.height / 2, boss.width, boss.height);
    ctx.restore();
  }
}

export const sprites = new SpriteManager();
