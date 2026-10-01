// Processes an Image element into an offscreen canvas with background removal (transparent cutout)
export function removeCheckerboardBackground(sourceImg) {
  if (!sourceImg) return null;

  const canvas = document.createElement('canvas');
  canvas.width = sourceImg.naturalWidth || sourceImg.width;
  canvas.height = sourceImg.naturalHeight || sourceImg.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceImg, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Sample corner pixel for background color matching
  const cornerR = data[0];
  const cornerG = data[1];
  const cornerB = data[2];

  // Scan pixels and remove grey/slate/white backgrounds
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    const brightness = (r + g + b) / 3;
    const distToCorner = Math.hypot(r - cornerR, g - cornerG, b - cornerB);

    // 1. Match distance to sample corner background
    // 2. Or neutral grey in slate/checkerboard range (brightness 45 to 220, low saturation)
    // 3. Or deep black border margins (brightness < 16)
    if (distToCorner < 35 || (maxDiff < 24 && brightness > 50 && brightness < 235) || (brightness < 16 && maxDiff < 10)) {
      data[i + 3] = 0; // Transparent
    } else if (distToCorner < 48 || (maxDiff < 28 && brightness > 45 && brightness < 240)) {
      // Soft anti-aliased edge feathering
      const alphaFactor = Math.max(0, (48 - distToCorner) / 13);
      data[i + 3] = Math.floor(data[i + 3] * (1 - alphaFactor));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export class AssetLoader {
  constructor() {
    this.rawImages = {};
    this.processedImages = {};
    this.loaded = false;
  }

  async loadAll() {
    const manifest = {
      background: '/assets/background.jpg',
      bgSector1: '/assets/bg_sector1.jpg',
      bgSector2: '/assets/bg_sector2.jpg',
      bgSector3: '/assets/bg_sector3.jpg',
      bgSector4: '/assets/bg_sector4.jpg',
      bgSector5: '/assets/bg_sector5.jpg',
      hero: '/assets/hero_modular.png',
      heroModular: '/assets/hero_modular.png',
      heroWallAcro: '/assets/hero_wall_acro.png',
      heroAcrobatics: '/assets/hero_acrobatics.png',
      weaponsHd: '/assets/weapons_hd.png',
      combatUi: '/assets/combat_ui_hud.png',
      drone: '/assets/drone_enemy.png',
      soldier: '/assets/soldier_grunt.png',
      platforms: '/assets/platforms.png',
      weapons: '/assets/weapons.png',
      crateGreen: '/assets/crate_green.png',
      crateGold: '/assets/crate_gold.png',
      crateRed: '/assets/crate_red.png',
      uiBadges: '/assets/ui_badges.png',
      bossGunship: '/assets/boss_gunship.png',
      wallColumn: '/assets/wall_column.png',
      pickupShotgun: '/assets/pickup_shotgun.png',
      pickupRpg: '/assets/pickup_rpg.png',
      pickupRailgun: '/assets/pickup_railgun.png',
      pickupRifle: '/assets/pickup_rifle.png',
      crateAmmo: '/assets/crate_ammo.png'
    };

    const keys = Object.keys(manifest);
    const promises = keys.map(key => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = manifest[key];
        img.onload = () => {
          this.rawImages[key] = img;
          // PNG assets already have alpha channels processed
          this.processedImages[key] = img;
          resolve(true);
        };
        img.onerror = () => {
          // Fallback to JPG if PNG is missing
          const fallbackSrc = manifest[key].replace('.png', '.jpg');
          const fallbackImg = new Image();
          fallbackImg.src = fallbackSrc;
          fallbackImg.onload = () => {
            this.rawImages[key] = fallbackImg;
            if (key === 'background') {
              this.processedImages[key] = fallbackImg;
            } else {
              this.processedImages[key] = removeCheckerboardBackground(fallbackImg);
            }
            resolve(true);
          };
          fallbackImg.onerror = () => {
            console.warn(`[AssetLoader] Failed to load ${key}`);
            this.rawImages[key] = null;
            this.processedImages[key] = null;
            resolve(false);
          };
        };
      });
    });

    await Promise.all(promises);
    this.loaded = true;
    console.log('[AssetLoader] All assets loaded and transparency processed.');
  }

  getImage(key) {
    return this.processedImages[key] || this.rawImages[key] || null;
  }
}

export const assets = new AssetLoader();
