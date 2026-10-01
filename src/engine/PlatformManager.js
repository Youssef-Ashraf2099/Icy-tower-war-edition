import { PLATFORM_CONFIG } from './Constants.js';
import { sprites } from '../assets/SpriteManager.js';

export class PlatformManager {
  constructor() {
    this.platforms = [];
    this.highestFloorGenerated = 0;
    this.nextY = 800;
    this.lastHazardFloor = -99;
  }

  getScreenWidth() {
    return window.innerWidth || 1024;
  }

  reset(startFloor = 0) {
    this.platforms = [];
    this.highestFloorGenerated = startFloor;
    this.nextY = 800;
    this.lastHazardFloor = -99;

    const screenW = this.getScreenWidth();

    // Solid base staging floor (Floor 0 or Checkpoint Staging Deck)
    const isGroundBase = (startFloor === 0);
    this.platforms.push({
      floor: startFloor,
      x: isGroundBase ? 0 : 44,
      y: 800,
      width: isGroundBase ? screenW : (screenW - 88),
      height: 60,
      type: startFloor > 0 ? 'CHECKPOINT' : 'NORMAL',
      active: true,
      claimed: true,
      hasCrate: startFloor > 0 ? 'MEDKIT' : null,
      crateX: 160,
      crateY: 800 - 32,
      hasCrate2: startFloor > 0 ? (startFloor >= 100 ? 'RAILGUN' : 'RPG') : null,
      crate2X: screenW - 240,
      crate2Y: 800 - 32
    });

    // Generate initial 35 floors upwards
    this.generateUpTo(startFloor + 35);
  }

  generateUpTo(targetFloor) {
    const screenW = this.getScreenWidth();
    const towerWidth = Math.min(1100, screenW - 100);
    const towerLeft = (screenW - towerWidth) / 2;

    while (this.highestFloorGenerated < targetFloor) {
      this.highestFloorGenerated++;
      this.nextY -= PLATFORM_CONFIG.STEP_HEIGHT + (Math.random() * 12 - 6);

      const floor = this.highestFloorGenerated;

      // 1. Checkpoint Staging Deck every 50 floors (FL 50, 100, 150, ...)
      const isCheckpoint = (floor > 0 && floor % 50 === 0);
      if (isCheckpoint) {
        this.nextY -= 16; // Extra vertical clearance so FL 49 has ample jump space
      }
      if (floor % 50 === 1) {
        this.nextY -= 16; // Extra clearance above Checkpoint Deck
      }
      if (isCheckpoint) {
        const checkW = screenW - 88;
        const checkX = 44;
        this.platforms.push({
          floor,
          x: checkX,
          y: this.nextY,
          width: checkW,
          height: 52,
          type: 'CHECKPOINT',
          active: true,
          claimed: false,
          hasCrate: 'MEDKIT',
          crateX: checkX + 140,
          crateY: this.nextY - 32,
          hasCrate2: floor >= 100 ? 'RAILGUN' : 'RPG',
          crate2X: checkX + checkW - 200,
          crate2Y: this.nextY - 32
        });
        continue;
      }

      // Buffer zones right before and after checkpoints are always safe NORMAL platforms
      const isNearCheckpoint = (floor % 50 === 49 || floor % 50 === 1);

      // Platform width
      let width = Math.max(
        110,
        220 - Math.min(70, Math.floor(floor / 15) * 12) + (Math.random() * 30 - 15)
      );

      // Enforce: At least 4 safe floors between any HAZARD platforms
      const canBeHazard = !isNearCheckpoint && floor > 8 && (floor - this.lastHazardFloor) >= 4;

      // Decide platform type
      let type = 'NORMAL';
      const rand = Math.random();

      if (floor > 3 && !isNearCheckpoint) {
        if (rand < 0.14) {
          type = 'ICE';
        } else if (rand < 0.26) {
          type = 'CRUMBLING';
        } else if (rand < 0.35) {
          type = 'BOUNCE';
        } else if (canBeHazard && rand < 0.44) {
          type = 'HAZARD';
          this.lastHazardFloor = floor;
          width = Math.min(135, width); // Shorter width so player can jump past it
        }
      }

      const minX = Math.max(54, towerLeft + 20);
      const maxX = Math.min(screenW - width - 54, towerLeft + towerWidth - width - 20);

      // Step within jumpable reach of previous platform so player can always climb smoothly
      let x;
      const prevPlat = this.platforms.length > 0 ? this.platforms[this.platforms.length - 1] : null;
      if (prevPlat && prevPlat.floor > 0) {
        const delta = (Math.random() * 540 - 270);
        x = Math.max(minX, Math.min(maxX, prevPlat.x + delta));
      } else {
        x = minX + Math.random() * Math.max(20, maxX - minX);
      }

      // Tactical supply spawn: floating weapons, ammo supply crates, and medkits
      let hasCrate = null;
      if (type === 'NORMAL' && Math.random() < 0.28) {
        const roll = Math.random();
        if (roll < 0.30) {
          // Floating weapon: Shotgun
          hasCrate = 'SHOTGUN';
        } else if (roll < 0.52) {
          // Floating weapon: RPG
          hasCrate = 'RPG';
        } else if (roll < 0.68) {
          // Floating weapon: Railgun
          hasCrate = 'RAILGUN';
        } else if (roll < 0.86) {
          // Tactical Military Ammo Supply Crate Box!
          hasCrate = 'AMMO';
        } else {
          // Tactical Armor Repair Medkit Box!
          hasCrate = 'MEDKIT';
        }
      }

      this.platforms.push({
        floor,
        x,
        y: this.nextY,
        width,
        height: 24,
        type,
        active: true,
        hp: type === 'HAZARD' ? 40 : null,
        maxHp: type === 'HAZARD' ? 40 : null,
        isHazardDestroyed: false,
        crumbleTimer: null,
        hasCrate,
        crateX: x + width / 2 - 16,
        crateY: this.nextY - 30
      });
    }
  }

  update(dt, cameraY, player) {
    const currentTopFloor = Math.floor((-cameraY + 900) / PLATFORM_CONFIG.STEP_HEIGHT) + 25;
    if (currentTopFloor > this.highestFloorGenerated) {
      this.generateUpTo(currentTopFloor);
    }

    // Deactivate Floor 0 once player climbs far up into the tower
    if (player && (player.highestFloor - player.lastLandedFloor >= 8 || player.highestFloor >= 8)) {
      const floor0 = this.platforms.find(p => p.floor === 0);
      if (floor0 && floor0.active && player.highestFloor >= 8) {
        floor0.active = false;
      }
    }

    for (const plat of this.platforms) {
      if (plat.crumbleTimer !== null && plat.active) {
        plat.crumbleTimer -= dt;
        if (plat.crumbleTimer <= 0) {
          plat.active = false;
        }
      }
    }

    const cleanupY = cameraY + 1400;
    this.platforms = this.platforms.filter(p => p.y < cleanupY);
  }

  renderBunkerDeck(ctx, screenY, width, height) {
    const screenH = window.innerHeight || 900;
    const bunkerBottom = Math.max(screenY + 450, screenH + 150);

    // 1. Massive Blast Concrete & Armored Bunker Substructure
    const grad = ctx.createLinearGradient(0, screenY, 0, bunkerBottom);
    grad.addColorStop(0, '#1a2234');
    grad.addColorStop(0.12, '#111827');
    grad.addColorStop(0.45, '#0b0f17');
    grad.addColorStop(1, '#030508');
    ctx.fillStyle = grad;
    ctx.fillRect(0, screenY + 28, width, bunkerBottom - (screenY + 28));

    // Heavy Industrial Seismic Support Pillars
    const pillarWidth = 44;
    const pillarSpacing = 220;
    for (let px = 60; px < width - 60; px += pillarSpacing) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px, screenY + 28, pillarWidth, bunkerBottom - (screenY + 28));

      ctx.fillStyle = '#334155';
      ctx.fillRect(px, screenY + 28, 4, bunkerBottom - (screenY + 28));
      ctx.fillRect(px + pillarWidth - 4, screenY + 28, 4, bunkerBottom - (screenY + 28));

      // Rivets along pillar
      ctx.fillStyle = '#475569';
      for (let ry = screenY + 45; ry < Math.min(bunkerBottom, screenH + 50); ry += 40) {
        ctx.beginPath();
        ctx.arc(px + 8, ry, 2.5, 0, Math.PI * 2);
        ctx.arc(px + pillarWidth - 8, ry, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Diagonal cross-brace truss between pillars
      if (px + pillarSpacing < width - 60) {
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(px + pillarWidth, screenY + 35);
        ctx.lineTo(px + pillarSpacing, screenY + 160);
        ctx.moveTo(px + pillarWidth, screenY + 160);
        ctx.lineTo(px + pillarSpacing, screenY + 35);
        ctx.stroke();
      }
    }

    // Heavy Armor Plating Seams
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, screenY + 110);
    ctx.lineTo(width, screenY + 110);
    ctx.moveTo(0, screenY + 220);
    ctx.lineTo(width, screenY + 220);
    ctx.stroke();

    // 2. Heavy Armored Deck Plate
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, screenY, width, 36);

    ctx.fillStyle = '#334155';
    ctx.fillRect(0, screenY, width, 4);

    // 3. Diagonal Caution Hazard Stripe Lip (Top 12px)
    const stripeWidth = 18;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, screenY, width, 12);
    ctx.clip();

    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(0, screenY, width, 12);

    ctx.fillStyle = '#0f172a';
    for (let sx = -20; sx < width + 30; sx += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(sx, screenY);
      ctx.lineTo(sx + stripeWidth, screenY);
      ctx.lineTo(sx + stripeWidth - 10, screenY + 12);
      ctx.lineTo(sx - 10, screenY + 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Heavy Industrial Foundation Anchor Gussets (Firmly lock left and right vertical fortress pillars into ground)
    const anchorW = 48;
    // Left anchor bracket
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, screenY - 8, anchorW, 44);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, screenY - 8, anchorW, 44);

    // Right anchor bracket
    ctx.fillRect(width - anchorW, screenY - 8, anchorW, 44);
    ctx.strokeRect(width - anchorW, screenY - 8, anchorW, 44);

    // Hazard corner stripes on foundation brackets
    ctx.fillStyle = '#ffaa00';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(6 + i * 14, screenY - 4, 6, 24);
      ctx.fillRect(width - anchorW + 6 + i * 14, screenY - 4, 6, 24);
    }

    // Heavy hex bolts on foundation
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(anchorW - 6, screenY + 4, 4, 4);
    ctx.fillRect(anchorW - 6, screenY + 20, 4, 4);
    ctx.fillRect(width - anchorW + 2, screenY + 4, 4, 4);
    ctx.fillRect(width - anchorW + 2, screenY + 20, 4, 4);

    // Neon Amber Lip Highlight
    ctx.fillStyle = '#ffd000';
    ctx.fillRect(0, screenY, width, 2);

    // 4. Pulsing Runway LED Beacons
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
    for (let bx = 90; bx < width - 80; bx += 140) {
      const isGreen = Math.floor(bx / 140) % 2 === 0;
      const beaconColor = isGreen ? '#00ff77' : '#00f0ff';

      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(bx - 8, screenY + 14, 16, 8);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 8, screenY + 14, 16, 8);

      ctx.fillStyle = beaconColor;
      ctx.shadowColor = beaconColor;
      ctx.shadowBlur = 10 * pulse;
      ctx.fillRect(bx - 5, screenY + 16, 10, 4);
      ctx.shadowBlur = 0;
    }

    // 5. Military Stenciled Typography
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.font = '900 13px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('► SECTOR 01 // AIRBORNE STAGING GROUND ◄', width / 2, screenY + 28);

    ctx.font = '700 11px Rajdhani, sans-serif';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
    ctx.textAlign = 'left';
    ctx.fillText('ELEVATION: BASE 0.00 M  |  STATUS: OPERATIONAL', 50, screenY + 28);

    ctx.fillStyle = 'rgba(255, 170, 0, 0.75)';
    ctx.textAlign = 'right';
    ctx.fillText('WAR TOWER // SUPER-JUMP LAUNCHPAD READY', width - 50, screenY + 28);
  }

  renderCheckpointDeck(ctx, p, screenY) {
    const width = p.width;
    const x = p.x;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);

    // 1. Sleek Armored Undercarriage (Compact 22px depth, leaving full clearance underneath for Floor 49!)
    const underH = 22;
    const grad = ctx.createLinearGradient(0, screenY + 36, 0, screenY + 36 + underH);
    grad.addColorStop(0, '#162238');
    grad.addColorStop(0.7, '#0e1726');
    grad.addColorStop(1, 'rgba(10, 15, 24, 0)');
    ctx.fillStyle = grad;

    // Angled beveled trapezoid undercarriage
    ctx.beginPath();
    ctx.moveTo(x, screenY + 36);
    ctx.lineTo(x + width, screenY + 36);
    ctx.lineTo(x + width - 28, screenY + 36 + underH);
    ctx.lineTo(x + 28, screenY + 36 + underH);
    ctx.closePath();
    ctx.fill();

    // Reinforced titanium rim & recessed cyan LED running strip
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 36, screenY + 36 + underH - 2);
    ctx.lineTo(x + width - 36, screenY + 36 + underH - 2);
    ctx.stroke();

    // Downward warning beacon markers (subtle small cyan projector lights)
    const markerSpacing = 160;
    for (let mx = x + 80; mx < x + width - 80; mx += markerSpacing) {
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6 * pulse;
      ctx.fillRect(mx - 4, screenY + 36 + underH - 3, 8, 3);
      ctx.shadowBlur = 0;
    }

    // 2. Heavy Armored Checkpoint Deck Surface
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, screenY, width, 36);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, screenY, width, 4);

    // 3. Neon Cyan Glowing Caution Stripe Lip (Top 12px)
    const stripeWidth = 16;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, screenY, width, 12);
    ctx.clip();

    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(x, screenY, width, 12);

    ctx.fillStyle = '#06101e';
    for (let sx = x - 20; sx < x + width + 30; sx += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(sx, screenY);
      ctx.lineTo(sx + stripeWidth, screenY);
      ctx.lineTo(sx + stripeWidth - 10, screenY + 12);
      ctx.lineTo(sx - 10, screenY + 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Top Neon Glow Strip
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14 * pulse;
    ctx.fillRect(x, screenY, width, 2);
    ctx.shadowBlur = 0;

    // 4. Pulsing Runway LED Beacons
    for (let bx = x + 70; bx < x + width - 60; bx += 130) {
      const beaconColor = (Math.floor(bx / 130) % 2 === 0) ? '#00f0ff' : '#00ff77';
      ctx.fillStyle = '#050a14';
      ctx.fillRect(bx - 8, screenY + 14, 16, 8);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 8, screenY + 14, 16, 8);

      ctx.fillStyle = beaconColor;
      ctx.shadowColor = beaconColor;
      ctx.shadowBlur = 12 * pulse;
      ctx.fillRect(bx - 5, screenY + 16, 10, 4);
      ctx.shadowBlur = 0;
    }

    // 5. Holographic Checkpoint Terminal Beacon (Center of Deck)
    const cx = x + width / 2;
    // Holo-projector base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 32, screenY - 8, 64, 8);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 32, screenY - 8, 64, 8);

    // Floating Holo Cone
    const holoGrad = ctx.createLinearGradient(0, screenY - 8, 0, screenY - 55);
    holoGrad.addColorStop(0, `rgba(0, 240, 255, ${0.45 * pulse})`);
    holoGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = holoGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 24, screenY - 8);
    ctx.lineTo(cx + 24, screenY - 8);
    ctx.lineTo(cx + 45, screenY - 55);
    ctx.lineTo(cx - 45, screenY - 55);
    ctx.closePath();
    ctx.fill();

    // Floating Hologram Text
    ctx.font = '900 13px Orbitron, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.textAlign = 'center';
    ctx.fillText(`★ CHECKPOINT: SECTOR 0${Math.floor(p.floor / 50)} (FL ${p.floor}) ★`, cx, screenY - 26);
    ctx.shadowBlur = 0;

    // 6. Military Stencils on Deck Face
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.font = '900 12px Orbitron, sans-serif';
    ctx.fillText(`► CHECKPOINT // STRATEGIC COMBAT DEPOT ◄`, cx, screenY + 28);

    ctx.font = '700 10px Rajdhani, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.fillText(`ELEVATION: FL-${p.floor}  |  STATUS: SECURED`, x + 30, screenY + 28);

    ctx.fillStyle = '#00ff77';
    ctx.textAlign = 'right';
    ctx.fillText(`ARMOR REPAIRED // SUPPLY CACHE READY`, x + width - 30, screenY + 28);
  }

  render(ctx, cameraY) {
    for (const p of this.platforms) {
      if (!p.active) continue;
      const screenY = p.y - cameraY;

      if (screenY < -80 || screenY > window.innerHeight + 100) continue;

      ctx.save();

      // Custom high-impact rendering for Floor 0 (Base Staging Bunker)
      if (p.floor === 0) {
        const fullW = ctx.canvas ? ctx.canvas.width : (window.innerWidth || 1024);
        this.renderBunkerDeck(ctx, screenY, fullW, p.height);
        ctx.restore();
        continue;
      }

      // Checkpoint Staging Deck
      if (p.type === 'CHECKPOINT') {
        this.renderCheckpointDeck(ctx, p, screenY);
        if (p.hasCrate) {
          const crateScreenY = p.crateY - cameraY;
          // Glowing tactical supply pedestal pad
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(p.crateX - 6, screenY - 4, 44, 5, 2);
          ctx.fill();
          ctx.stroke();

          // Floating holographic label
          ctx.font = '900 10px Orbitron, sans-serif';
          ctx.fillStyle = '#22c55e';
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 8;
          ctx.textAlign = 'center';
          ctx.fillText('MEDKIT', p.crateX + 16, crateScreenY - 6);
          ctx.shadowBlur = 0;

          sprites.drawCrate(ctx, p.hasCrate, p.crateX, crateScreenY);
        }
        if (p.hasCrate2) {
          const crate2ScreenY = p.crate2Y - cameraY;
          // Glowing tactical supply pedestal pad
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#ffaa00';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(p.crate2X - 6, screenY - 4, 44, 5, 2);
          ctx.fill();
          ctx.stroke();

          // Floating holographic label
          ctx.font = '900 10px Orbitron, sans-serif';
          ctx.fillStyle = '#ffaa00';
          ctx.shadowColor = '#ffaa00';
          ctx.shadowBlur = 8;
          ctx.textAlign = 'center';
          ctx.fillText(p.hasCrate2, p.crate2X + 16, crate2ScreenY - 6);
          ctx.shadowBlur = 0;

          sprites.drawCrate(ctx, p.hasCrate2, p.crate2X, crate2ScreenY);
        }
        ctx.restore();
        continue;
      }

      if (p.crumbleTimer !== null) {
        const flash = Math.sin(Date.now() * 0.04) > 0;
        ctx.globalAlpha = flash ? 0.35 : 0.9;
      }

      sprites.drawPlatform(ctx, p.type, p.x, screenY, p.width, p.height, p.isHazardDestroyed);

      // High-Visibility Neon Landing Surface Highlight Rail
      let rimColor = 'rgba(0, 240, 255, 0.75)';
      let glowColor = '#00f0ff';
      if (p.type === 'ICE') { rimColor = 'rgba(165, 243, 252, 0.9)'; glowColor = '#a5f3fc'; }
      else if (p.type === 'CRUMBLING') { rimColor = 'rgba(251, 191, 36, 0.9)'; glowColor = '#fbbf24'; }
      else if (p.type === 'BOUNCE') { rimColor = 'rgba(52, 211, 153, 0.95)'; glowColor = '#34d399'; }
      else if (p.type === 'HAZARD') { rimColor = 'rgba(248, 113, 113, 0.95)'; glowColor = '#f87171'; }

      ctx.strokeStyle = rimColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x + 3, screenY);
      ctx.lineTo(p.x + p.width - 3, screenY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Platform End-Cap LED locator beacons
      ctx.fillStyle = glowColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x + 2, screenY - 1, 4, 4);
      ctx.fillRect(p.x + p.width - 6, screenY - 1, 4, 4);
      ctx.shadowBlur = 0;

      // High-Visibility Tactical Floor Badge
      if (p.floor > 0) {
        const isCheckpointApproach = (p.floor % 50 === 49);
        const badgeW = isCheckpointApproach ? 72 : 46;
        const badgeH = 17;
        const badgeX = p.x + 6;
        const badgeY = screenY - 21;

        // Dark tactical backing
        ctx.fillStyle = 'rgba(10, 15, 28, 0.88)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
        ctx.fill();

        // Glowing border
        ctx.strokeStyle = isCheckpointApproach ? '#ffaa00' : 'rgba(0, 240, 255, 0.65)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // High-contrast text
        ctx.font = '900 10px Orbitron, sans-serif';
        ctx.fillStyle = isCheckpointApproach ? '#ffcc00' : '#ffffff';
        ctx.shadowColor = isCheckpointApproach ? '#ffaa00' : '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.textAlign = 'center';
        ctx.fillText(`FL ${p.floor}`, badgeX + (isCheckpointApproach ? 24 : badgeW / 2), badgeY + 12);

        if (isCheckpointApproach) {
          ctx.font = '700 8px Rajdhani, sans-serif';
          ctx.fillStyle = '#ffaa00';
          ctx.fillText('NEXT CP', badgeX + 53, badgeY + 12);
        }
        ctx.shadowBlur = 0;
      }

      // Spikes health bar if damaged
      if (p.type === 'HAZARD' && p.hp < p.maxHp && !p.isHazardDestroyed) {
        const barW = p.width * 0.7;
        const barX = p.x + (p.width - barW) / 2;
        const barY = screenY - 14;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(barX, barY, barW, 4);
        ctx.fillStyle = '#ff2a4b';
        ctx.fillRect(barX, barY, barW * (p.hp / p.maxHp), 4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, barY, barW, 4);
      }

      if (p.hasCrate) {
        const crateScreenY = p.crateY - cameraY;
        sprites.drawCrate(ctx, p.hasCrate, p.crateX, crateScreenY, p.floor);
      }

      ctx.restore();
    }
  }
}
