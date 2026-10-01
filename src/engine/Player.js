import { CANVAS_WIDTH, PHYSICS, PLATFORM_CONFIG } from './Constants.js';
import { sounds } from '../audio/SoundEffects.js';
import { sprites } from '../assets/SpriteManager.js';

export class Player {
  constructor(screenWidth = window.innerWidth || 1024) {
    this.width = 38;
    this.height = 54;
    this.x = screenWidth / 2 - this.width / 2;
    this.y = 800 - this.height;
    this.vx = 0;
    this.vy = 0;

    this.isGrounded = true;
    this.currentPlatform = null;
    this.lastLandedFloor = 0;
    this.highestFloor = 0;

    this.facing = 1; // 1 = right, -1 = left
    this.aimAngle = 0;

    // Rigid body visual dynamics (tilt, squash & stretch)
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.tilt = 0.0;

    this.hp = 100;
    this.maxHp = 100;
    this.adrenaline = 0;
    this.maxAdrenaline = 100;
    this.isOverdrive = false;
    this.overdriveTimer = 0;

    this.isFastFalling = false;
    this.isShooting = false;
    this.shootTimer = 0;
    this.coyoteTimer = 0.2;
    this.jumpBufferTimer = 0;

    // Acrobatics & Wall States
    this.isFlipping = false;
    this.flipProgress = 0;
    this.isWallKicking = false;
    this.wallKickTimer = 0;
    this.wallKickDirection = 1;
    this.isWallSliding = false;
    this.wallSlideSide = 0;
    this.maxJumps = 2;
    this.jumpsLeft = 2;

    // Fluid juice trails & animation timing
    this.ghosts = [];
    this.ghostTimer = 0;
    this.runAnimTimer = 0;
    this.currentAction = 'IDLE';

    this.wallPadding = 44;
    this.jumpStartFloor = 0;
  }

  reset(screenWidth = window.innerWidth || 1024, startingFloor = 0) {
    this.x = screenWidth / 2 - this.width / 2;
    this.y = 800 - this.height;
    this.vx = 0;
    this.vy = 0;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.tilt = 0.0;
    this.isGrounded = true;
    this.currentPlatform = null;
    this.lastLandedFloor = startingFloor;
    this.highestFloor = startingFloor;
    this.reachedCheckpoint = null;
    this.hp = 100;
    this.adrenaline = startingFloor > 0 ? 50 : 0;
    this.isOverdrive = false;
    this.overdriveTimer = 0;
    this.isFastFalling = false;
    this.isShooting = false;
    this.shootTimer = 0;
    this.coyoteTimer = 0.2;
    this.jumpBufferTimer = 0;
    this.isFlipping = false;
    this.flipProgress = 0;
    this.isWallKicking = false;
    this.wallKickTimer = 0;
    this.wallKickDirection = 1;
    this.isWallSliding = false;
    this.wallSlideSide = 0;
    this.maxJumps = 2;
    this.jumpsLeft = 2;
    this.prevJumpKey = false;
    this.ghosts = [];
    this.ghostTimer = 0;
    this.runAnimTimer = 0;
    this.currentAction = 'IDLE';
    this.sprintMomentum = 0;
    this.runSprintTime = 0;
    this.lastRunDir = 0;
    this.lastMoveInput = 0;
  }

  handleInput(keys, mouse, dt) {
    let moveDir = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) moveDir -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveDir += 1;
    this.lastMoveInput = moveDir;

    const accel = PHYSICS.RUN_ACCEL * (this.isGrounded ? 1.0 : PHYSICS.AIR_ACCEL_FACTOR);
    if (moveDir !== 0) {
      this.vx += moveDir * accel * dt;
      if (Math.abs(this.vx) > PHYSICS.MAX_RUN_SPEED) {
        this.vx = Math.sign(this.vx) * PHYSICS.MAX_RUN_SPEED;
      }
    } else if (this.isGrounded) {
      const friction = (this.currentPlatform && this.currentPlatform.type === 'ICE') 
        ? PHYSICS.ICE_FRICTION 
        : PHYSICS.GROUND_FRICTION;
      this.vx *= Math.pow(friction, dt * 60);
      if (Math.abs(this.vx) < 5) this.vx = 0;
    }

    // Fast-fall stomp
    if ((keys['KeyS'] || keys['ArrowDown']) && !this.isGrounded) {
      this.isFastFalling = true;
      this.vy = Math.max(this.vy, 580);
    } else {
      this.isFastFalling = false;
    }

    // Jump Buffering with Edge-Trigger Detection (prevents holding Space from eating double jump)
    const jumpKey = !!(keys['KeyW'] || keys['ArrowUp'] || keys['Space']);
    this.jumpJustPressed = jumpKey && !this.prevJumpKey;
    this.prevJumpKey = jumpKey;

    if (this.jumpJustPressed) {
      this.jumpBufferTimer = PHYSICS.JUMP_BUFFER_TIME;
    }

    // Overdrive Trigger
    if ((keys['ShiftLeft'] || mouse.rightDown) && this.adrenaline >= 100 && !this.isOverdrive) {
      this.activateOverdrive();
    }
  }

  activateOverdrive() {
    this.isOverdrive = true;
    this.overdriveTimer = 3.5;
    this.adrenaline = 0;
    sounds.playComboFanfare(5);
  }

  applyRecoil(rx, ry) {
    this.vx += rx;
    this.vy += ry;
    this.isShooting = true;
    this.shootTimer = 0.16;
  }

  update(dt, platforms, cameraY, particleSystem, comboManager, screenWidth = window.innerWidth || 1024) {
    // Smooth rigid body spring recovery (squash & stretch)
    this.scaleX += (1.0 - this.scaleX) * 14 * dt;
    this.scaleY += (1.0 - this.scaleY) * 14 * dt;

    // Body lean tilt based on momentum
    const targetTilt = Math.max(-0.24, Math.min(0.24, this.vx * 0.0006));
    this.tilt += (targetTilt - this.tilt) * 16 * dt;

    if (this.shootTimer > 0) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) this.isShooting = false;
    }

    if (this.isOverdrive) {
      this.overdriveTimer -= dt;
      if (this.overdriveTimer <= 0) {
        this.isOverdrive = false;
      }
    }

    // Acrobatics timers
    if (this.isFlipping) {
      this.flipProgress += dt * 3.6;
      if (this.flipProgress >= 1) {
        this.isFlipping = false;
        this.flipProgress = 0;
      }
    }
    if (this.wallKickTimer > 0) {
      this.wallKickTimer -= dt;
      if (this.wallKickTimer <= 0) {
        this.isWallKicking = false;
      }
    }

    if (this.isGrounded) {
      this.coyoteTimer = PHYSICS.COYOTE_TIME;
      this.isFlipping = false;
      this.flipProgress = 0;
      this.isWallKicking = false;
      this.jumpsLeft = 2; // Reset full double jump on ground contact
    } else {
      this.coyoteTimer -= dt;
    }
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // Execute Jump (Ground Jump & Mid-Air Double Jump)
    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0) {
        // Ground Jump / Ledge Grace Jump
        this.performJump(particleSystem);
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.jumpJustPressed = false;
        this.jumpsLeft = 1; // 1 air jump remaining
      } else if (!this.isGrounded && this.jumpsLeft > 0 && !this.isWallSliding && this.jumpJustPressed) {
        // Mid-Air Double Jump: ONLY fires on a fresh keypress while in the air!
        this.performDoubleJump(particleSystem);
        this.jumpBufferTimer = 0;
        this.jumpJustPressed = false;
        this.jumpsLeft = 0;
      }
    }

    // Gravity
    this.vy += PHYSICS.GRAVITY * dt;
    if (this.vy > PHYSICS.TERMINAL_VELOCITY) {
      this.vy = PHYSICS.TERMINAL_VELOCITY;
    }

    // Movement integration
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Icy Tower Sprint Momentum Accumulation
    const moveDir = this.lastMoveInput || 0;
    if (this.isGrounded) {
      if (moveDir !== 0 && Math.sign(this.vx) === moveDir && Math.abs(this.vx) > 70) {
        if (this.lastRunDir === moveDir) {
          this.runSprintTime += dt;
        } else {
          this.runSprintTime = dt * 0.5;
          this.lastRunDir = moveDir;
        }
        // Sprint momentum charges from 0 to 1 over ~0.32s of continuous sprint
        this.sprintMomentum = Math.min(1.0, this.runSprintTime / 0.32);
      } else {
        this.runSprintTime = 0;
        this.sprintMomentum = Math.max(0, this.sprintMomentum - dt * 4.2);
      }

      // High-momentum ground sprint thruster sparks
      if (this.sprintMomentum > 0.35 && Math.random() < this.sprintMomentum * 0.8) {
        const sparkColor = this.sprintMomentum > 0.7 ? '#00f0ff' : '#ffaa00';
        const footX = this.vx > 0 ? this.x + 4 : this.x + this.width - 4;
        particleSystem.addSparks(footX, this.y + this.height - 2, 2, sparkColor);
      }
    } else {
      // In air, decay momentum gradually so wall kicks or bounce pads can leverage momentum
      this.sprintMomentum = Math.max(0, this.sprintMomentum - dt * 0.6);
    }

    // Track running animation progress smoothly proportional to movement
    if (this.isGrounded && Math.abs(this.vx) > 10) {
      this.runAnimTimer += Math.abs(this.vx) * dt * 0.022;
    }

    // Fortress Steel Wall Interaction & Acrobatics (Wall Slide, Wall Jump & Ricochet)
    const minX = this.wallPadding;
    const maxX = screenWidth - this.wallPadding - this.width;

    const touchingLeftWall = this.x <= minX;
    const touchingRightWall = this.x >= maxX;

    if (touchingLeftWall) {
      this.x = minX;
    } else if (touchingRightWall) {
      this.x = maxX;
    }

    if (!this.isGrounded && (touchingLeftWall || touchingRightWall)) {
      const wallDir = touchingLeftWall ? 1 : -1;
      const sparkX = touchingLeftWall ? minX : maxX + this.width;

      // 1. Wall Jump Rebound Kick if Jump buffer is active
      if (this.jumpBufferTimer > 0) {
        this.vx = wallDir * 460;
        this.vy = -640;
        this.scaleX = 0.75;
        this.scaleY = 1.35;
        this.isWallKicking = true;
        this.sprintMomentum = 1.25; // Wall kicks supercharge spring launch!
        this.wallKickTimer = 0.28;
        this.wallKickDirection = wallDir;
        this.isFlipping = true;
        this.flipProgress = 0;
        this.isWallSliding = false;
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.jumpJustPressed = false;
        this.jumpsLeft = 1; // Can double jump after wall kick!
        sounds.playWallKick();
        particleSystem.addSparks(sparkX, this.y + this.height / 2, 22, '#00f0ff');
        particleSystem.addScreenShake(6, 0.18);
      } else if (this.vy > 0) {
        // 2. Wall Slide: Boots grip wall girder, friction slows fall gracefully!
        this.isWallSliding = true;
        this.wallSlideSide = wallDir;
        this.vy = Math.min(this.vy, 140);
        if (Math.random() < 0.4) {
          particleSystem.addSparks(sparkX, this.y + this.height - 6, 2, '#00f0ff');
        }
      } else {
        this.isWallSliding = false;
      }

      // 3. High-velocity wall ricochet
      if (Math.abs(this.vx) > 110 && !this.isWallKicking) {
        this.vx = -this.vx * PHYSICS.WALL_BOUNCE_X_MULT;
        this.vy += PHYSICS.WALL_BOUNCE_Y_BOOST;
        this.scaleX = 0.8;
        this.scaleY = 1.25;
        this.isWallKicking = true;
        this.sprintMomentum = 1.15; // Wall bounce charges spring launch!
        this.wallKickTimer = 0.24;
        this.wallKickDirection = wallDir;
        this.isFlipping = true;
        this.flipProgress = 0;
        sounds.playWallKick();
        particleSystem.addSparks(sparkX, this.y + this.height / 2, 16, '#00f0ff');
      }
    } else {
      this.isWallSliding = false;
    }

    // Update Speed Ghost Afterimages (smooth chaotic motion trails)
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      this.ghosts[i].alpha -= dt * 3.4;
      if (this.ghosts[i].alpha <= 0) {
        this.ghosts.splice(i, 1);
      }
    }

    const isHighVelocity = Math.abs(this.vx) > 200 || Math.abs(this.vy) > 380;
    if (isHighVelocity || this.isFlipping || this.isWallKicking || this.isWallSliding || this.isOverdrive) {
      this.ghostTimer -= dt;
      if (this.ghostTimer <= 0) {
        this.ghostTimer = 0.045;
        const isFacingLeft = Math.cos(this.aimAngle) < 0;
        this.ghosts.push({
          x: this.x,
          y: this.y,
          tilt: this.tilt,
          scaleX: this.scaleX,
          scaleY: this.scaleY,
          action: this.currentAction || 'IDLE',
          isFacingLeft,
          flipProgress: this.flipProgress,
          aimAngle: this.aimAngle,
          wallKickFacing: this.wallKickDirection,
          alpha: 0.5
        });
      }
    }

    // Platform Collisions (Robust swept detection)
    let landed = false;
    if (this.vy >= 0) {
      for (const plat of platforms) {
        if (!plat.active) continue;

        const prevY = this.y - this.vy * dt;
        if (
          this.x + this.width > plat.x &&
          this.x < plat.x + plat.width &&
          prevY + this.height <= plat.y + 18 &&
          this.y + this.height >= plat.y
        ) {
          // Landing impact squash
          if (!this.isGrounded) {
            this.scaleY = 0.80;
            this.scaleX = 1.22;
          }

          this.y = plat.y - this.height;
          this.vy = 0;
          landed = true;
          this.isGrounded = true;
          this.currentPlatform = plat;

          if (plat.type === 'HAZARD') {
            this.takeDamage(15, particleSystem);
            // Emergency upward recoil bounce off spikes so player is never trapped
            this.vy = -480;
            this.isGrounded = false;
            sounds.playWallKick();
            break;
          }

          if (plat.type === 'BOUNCE') {
            this.vy = PLATFORM_CONFIG.BOUNCE_PAD_BOOST;
            this.isGrounded = false;
            this.jumpsLeft = 1; // Can double jump after bounce pad launch!
            this.scaleY = 1.35;
            this.scaleX = 0.75;
            sounds.playJump(true);
            particleSystem.addSparks(this.x + this.width / 2, plat.y, 16, '#10b981');
            break;
          }

          if (plat.type === 'CHECKPOINT') {
            if (!plat.claimed) {
              plat.claimed = true;
              this.hp = Math.min(this.maxHp, this.hp + 50);
              this.adrenaline = 100;
              this.reachedCheckpoint = plat.floor;
              sounds.playComboFanfare(6);
              particleSystem.addSparks(this.x + this.width / 2, plat.y, 28, '#00f0ff');
              particleSystem.addFloatingText(this.x + this.width / 2, plat.y - 30, `CHECKPOINT FL-${plat.floor} SECURED!`, '#00f0ff', 24);
            }
          }

          if (plat.type === 'CRUMBLING' && plat.crumbleTimer === null) {
            plat.crumbleTimer = PLATFORM_CONFIG.CRUMBLE_TIME;
          }

          if (plat.floor > this.lastLandedFloor) {
            const skipped = plat.floor - this.jumpStartFloor;
            if (skipped >= 2) {
              comboManager.addCombo(skipped, false);
            }
            this.lastLandedFloor = plat.floor;
            this.highestFloor = Math.max(this.highestFloor, plat.floor);
          }

          break;
        }
      }
    }

    if (!landed && this.isGrounded) {
      this.isGrounded = false;
      this.currentPlatform = null;
    }
  }

  performJump(particleSystem) {
    this.isGrounded = false;
    this.currentPlatform = null;
    this.jumpStartFloor = this.lastLandedFloor;

    const momentum = this.sprintMomentum;
    let jumpV = -520;
    let tier = 'normal';

    if (momentum >= 0.65) {
      // Tier 3: HYPER SPRING JUMP (Icy Tower iconic spring launch! Clears 4 to 6 floors!)
      tier = 'spring';
      const factor = Math.min(1.0, (momentum - 0.65) / 0.35);
      jumpV = -960 - (factor * 180);
      if (this.isOverdrive) jumpV *= 1.2;

      this.scaleY = 1.55;
      this.scaleX = 0.62;
      this.isFlipping = true;
      this.flipProgress = 0;

      sounds.playJump('spring');
      particleSystem.addScreenShake(5, 0.16);
      particleSystem.addSparks(this.x + this.width / 2, this.y + this.height, 30, '#00f0ff');

      const shout = momentum > 1.0 ? 'HYPER SPRING!' : 'SPRING JUMP!';
      particleSystem.addFloatingText(this.x + this.width / 2, this.y - 22, shout, '#00f0ff', 18);
    } else if (momentum >= 0.25) {
      // Tier 2: SPRINT JUMP (Solid running jump, clears 2 to 3 floors!)
      tier = 'sprint';
      const factor = (momentum - 0.25) / 0.40;
      jumpV = -720 - (factor * 150);
      if (this.isOverdrive) jumpV *= 1.15;

      this.scaleY = 1.34;
      this.scaleX = 0.76;
      if (Math.abs(this.vx) > 160) {
        this.isFlipping = true;
        this.flipProgress = 0;
      }

      sounds.playJump('sprint');
      particleSystem.addSparks(this.x + this.width / 2, this.y + this.height, 14, '#ffaa00');
    } else {
      // Tier 1: STANDING / TACTICAL JUMP (Precise single-floor jump)
      jumpV = -520;
      this.scaleY = 1.18;
      this.scaleX = 0.88;
      sounds.playJump('normal');
      particleSystem.addSparks(this.x + this.width / 2, this.y + this.height, 6, '#ffffff');
    }

    this.vy = jumpV;
  }

  performDoubleJump(particleSystem) {
    // Powerful upward launch canceling any downward fall velocity
    this.vy = -560;
    if (this.isOverdrive) {
      this.vy = -700;
    }
    this.isGrounded = false;

    // Acrobatic mid-air spin somersault
    this.isFlipping = true;
    this.flipProgress = 0;

    // Rigid body stretch on double jump
    this.scaleY = 1.45;
    this.scaleX = 0.72;

    sounds.playJump(true);

    // Cyan double-jump shockwave ring & jet blast beneath boots
    particleSystem.addSparks(
      this.x + this.width / 2,
      this.y + this.height - 2,
      22,
      '#00f0ff'
    );
    particleSystem.addFloatingText(this.x + this.width / 2, this.y - 20, 'DOUBLE JUMP!', '#00f0ff', 16);
    particleSystem.addScreenShake(3, 0.12);

    // Immediate ghost afterimages
    const isFacingLeft = Math.cos(this.aimAngle) < 0;
    for (let g = 0; g < 2; g++) {
      this.ghosts.push({
        x: this.x + (Math.random() * 8 - 4),
        y: this.y + (g * 10),
        tilt: this.tilt,
        scaleX: this.scaleX,
        scaleY: this.scaleY,
        action: 'FLIP',
        isFacingLeft,
        flipProgress: 0.1 * g,
        aimAngle: this.aimAngle,
        wallKickFacing: this.wallKickDirection,
        alpha: 0.75 - g * 0.2
      });
    }
  }

  stompRebound(particleSystem) {
    this.vy = PHYSICS.STOMP_BOOST_V;
    this.isGrounded = false;
    this.currentPlatform = null;
    this.scaleY = 1.4;
    this.scaleX = 0.7;
    sounds.playHeadStomp();
    particleSystem.addSparks(this.x + this.width / 2, this.y + this.height, 14, '#ffb700');
    particleSystem.addScreenShake(6, 0.2);
  }

  takeDamage(amt, particleSystem) {
    this.hp = Math.max(0, this.hp - amt);
    this.scaleX = 1.2;
    this.scaleY = 0.8;
    particleSystem.addScreenShake(8, 0.25);
    particleSystem.addSparks(this.x + this.width / 2, this.y + this.height / 2, 12, '#ff2a4b');
  }

  render(ctx, cameraY, activeWeapon = 'RIFLE') {
    // Dynamic Facing: Character strictly faces towards mouse cursor!
    const isFacingLeft = Math.cos(this.aimAngle) < 0;

    // Movement direction relative to aim (forward sprint vs backward tactical strafe)
    const isMovingForward = (isFacingLeft && this.vx < -25) || (!isFacingLeft && this.vx > 25);
    const isStrafing = (isFacingLeft && this.vx > 25) || (!isFacingLeft && this.vx < -25);

    let action = 'IDLE';
    if (this.isFastFalling) {
      action = 'STOMP';
    } else if (this.isWallSliding) {
      action = 'WALL_SLIDE';
    } else if (this.isWallKicking) {
      action = 'WALL_KICK';
    } else if (this.isFlipping) {
      action = 'FLIP';
    } else if (!this.isGrounded) {
      action = 'JUMP';
    } else if (isStrafing) {
      action = 'STRAFE';
    } else if (isMovingForward) {
      action = 'RUN';
    }
    this.currentAction = action;

    // 1. Render Speed Ghost Afterimages (chaotic high-speed motion blur)
    for (const g of this.ghosts) {
      ctx.save();
      const gAlpha = Math.max(0, Math.min(1, g.alpha * (this.isOverdrive ? 0.65 : 0.35)));
      ctx.globalAlpha = gAlpha;
      const gScreenY = g.y - cameraY;
      ctx.translate(g.x + this.width / 2, gScreenY + this.height / 2);
      ctx.rotate(g.tilt);
      ctx.scale(g.scaleX, g.scaleY);

      sprites.drawHero(ctx, {
        action: g.action,
        isFacingLeft: g.isFacingLeft,
        flipProgress: g.flipProgress,
        aimAngle: g.aimAngle,
        weaponType: activeWeapon,
        isShooting: false,
        recoil: 0,
        wallKickFacing: g.wallKickFacing,
        runAnimTimer: this.runAnimTimer
      });
      ctx.restore();
    }

    // 2. Render Main Commando Hero
    const screenY = this.y - cameraY;
    ctx.save();
    ctx.translate(this.x + this.width / 2, screenY + this.height / 2);

    // Apply Rigid Body Lean and Squash & Stretch
    ctx.rotate(this.tilt);
    ctx.scale(this.scaleX, this.scaleY);

    if (this.isOverdrive) {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;
    }

    // Draw Commando Sprite via SpriteManager with acrobatic frames, dynamic aim, and equipped weapon
    sprites.drawHero(ctx, {
      action,
      isFacingLeft,
      flipProgress: this.flipProgress,
      aimAngle: this.aimAngle,
      weaponType: activeWeapon,
      isShooting: this.isShooting,
      recoil: Math.max(0, this.shootTimer / 0.16),
      wallKickFacing: this.wallKickDirection,
      runAnimTimer: this.runAnimTimer
    });

    ctx.restore();

    // 3. Render Sprint Momentum Spring Gauge below boots when charging
    if (this.isGrounded && this.sprintMomentum > 0.15) {
      ctx.save();
      const meterW = 34;
      const meterH = 3.5;
      const meterX = this.x + this.width / 2 - meterW / 2;
      const meterY = screenY + this.height + 4;
      const fillW = Math.min(meterW, meterW * (this.sprintMomentum / 1.0));
      const isSpringReady = this.sprintMomentum >= 0.65;

      // Dark background frame
      ctx.fillStyle = 'rgba(10, 15, 25, 0.75)';
      ctx.fillRect(meterX - 1, meterY - 1, meterW + 2, meterH + 2);
      ctx.strokeStyle = isSpringReady ? '#00f0ff' : 'rgba(255, 170, 0, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(meterX - 1, meterY - 1, meterW + 2, meterH + 2);

      // Gradient Fill
      ctx.fillStyle = isSpringReady ? '#00f0ff' : '#ffaa00';
      if (isSpringReady) {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
      }
      ctx.fillRect(meterX, meterY, fillW, meterH);

      // Micro status badge when spring ready
      if (isSpringReady) {
        ctx.font = '900 8px Orbitron, sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'center';
        ctx.fillText('⚡SPRING', this.x + this.width / 2, meterY + 12);
      }
      ctx.restore();
    }
  }
}
