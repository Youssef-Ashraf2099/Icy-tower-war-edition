export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 900;

export const PHYSICS = {
  GRAVITY: 1400,
  RUN_ACCEL: 1600,
  MAX_RUN_SPEED: 460,
  GROUND_FRICTION: 0.84,
  ICE_FRICTION: 0.982,
  AIR_ACCEL_FACTOR: 0.65,
  BASE_JUMP_V: -540,
  SUPER_JUMP_FACTOR: 0.52, // Harold super jump: adds up to -240px/s based on |vx|
  WALL_BOUNCE_X_MULT: 1.15,
  WALL_BOUNCE_Y_BOOST: -90,
  STOMP_BOOST_V: -650,
  TERMINAL_VELOCITY: 1000,
  COYOTE_TIME: 0.12, // seconds
  JUMP_BUFFER_TIME: 0.12
};

export const PLATFORM_CONFIG = {
  STEP_HEIGHT: 85,
  MIN_WIDTH: 100,
  MAX_WIDTH: 220,
  CRUMBLE_TIME: 0.75, // seconds before crumbling platform collapses
  BOUNCE_PAD_BOOST: -950 // huge jump launching 5-7 floors
};

export const WEAPONS = {
  RIFLE: {
    id: 'RIFLE',
    name: 'COMM-RIFLE',
    damage: 22,
    fireRate: 0.13,
    recoil: 80,
    speed: 1300,
    burstCount: 1,
    ammo: Infinity,
    color: '#ffdd33',
    sound: 'rifle'
  },
  SHOTGUN: {
    id: 'SHOTGUN',
    name: 'TRENCHGUN',
    damage: 16,
    pellets: 5,
    spread: 0.24,
    fireRate: 0.42,
    recoil: 340, // strong upward thrust when fired downward!
    speed: 1100,
    ammo: 30,
    color: '#ff8833',
    sound: 'shotgun'
  },
  RPG: {
    id: 'RPG',
    name: 'MICRO-RPG',
    damage: 130,
    splashRadius: 95,
    fireRate: 0.75,
    recoil: 440, // massive rocket jump boost
    speed: 850,
    ammo: 10,
    color: '#ff3344',
    sound: 'rpg'
  },
  RAILGUN: {
    id: 'RAILGUN',
    name: 'PLASMA RAIL',
    damage: 160,
    pierce: true,
    fireRate: 0.6,
    recoil: 180,
    speed: 2500,
    ammo: 12,
    color: '#00f0ff',
    sound: 'railgun'
  }
};

export const COMBO_RANKS = [
  { minCount: 25, label: 'UNSTOPPABLE!', color: '#c084fc', pointsMultiplier: 6.0, badgeIndex: 6 },
  { minCount: 18, label: 'AIR SUPERIORITY!', color: '#00f0ff', pointsMultiplier: 4.5, badgeIndex: 5 },
  { minCount: 13, label: 'BRUTAL!', color: '#ff2a4b', pointsMultiplier: 3.5, badgeIndex: 4 },
  { minCount: 9, label: 'SUPER!', color: '#ff7700', pointsMultiplier: 2.8, badgeIndex: 3 },
  { minCount: 6, label: 'GREAT!', color: '#ffd000', pointsMultiplier: 2.2, badgeIndex: 2 },
  { minCount: 4, label: 'SWEET!', color: '#44d0ff', pointsMultiplier: 1.7, badgeIndex: 1 },
  { minCount: 2, label: 'GOOD!', color: '#cd7f32', pointsMultiplier: 1.3, badgeIndex: 0 }
];
