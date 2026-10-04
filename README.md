# 🗼 WAR TOWER: Airborne Assault
### *Icy Tower: War Edition*

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural_Web_Audio-ff007f.svg)](src/audio/MusicEngine.js)
[![Tauri](https://img.shields.io/badge/Tauri-v2.0-24C8D8.svg?logo=tauri&logoColor=white)](https://tauri.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A high-octane vertical platformer that fuses the frantic momentum physics and combo chains of retro **Icy Tower** with 360° aerial combat, procedural Darksynth soundtracks, interactive multi-sector living backgrounds, and arcade post-processing visual effects.

---

## 🎮 Overview

In **WAR TOWER: Airborne Assault**, you deploy as **Commander Harold Vanguard**, an elite airborne operative tasked with ascending the monolithic **Sector Fortress**. 

A cataclysmic **rising molten thermal fluid** surges from below, demanding relentless upward ascent. Hostile patrol garrisons, aerial seeker drones, riot shield enforcers, and colossal checkpoint superweapons stand in your path. Chain sprint-boosted super-jumps, double-jumps, wall-kicks, and aerial crush stomps while aiming and firing your arsenal with 360° mouse tracking!

---

## ⚡ Key Features

### 🏃 Momentum-Based Platforming & Acrobatics
- **Sprint Momentum Acceleration**: Building horizontal velocity directly scales the power of your jumps.
- **Super-Jumps & Double-Jumps**: Launch hundreds of meters upward into the stratosphere with mid-air somersault flips.
- **Wall-Kicking & Sliding**: Rebound off high-tech citadel wall pillars to chain endless vertical combos.
- **Aerial Crush Stomp**: Slam directly downward onto hostile units to crush them and trigger an instant high-velocity trampoline rebound.
- **Weapon Recoil Jumping**: Fire downward with heavy ordinance (Shotguns, RPGs) to propel yourself upward across large gaps.

### 🔫 360° Dynamic Ballistic Arsenal
- **Commando Assault Rifle (RF)**: Rapid-fire automatic ballistic weapon with infinite supply and pinpoint tracer fire.
- **Tactical Combat Shotgun (SG)**: Multi-pellet heavy spread with devastating close-quarters burst damage and high recoil boost.
- **High-Explosive RPG Launcher (RPG)**: Armor-piercing rocket propelled grenades with area-of-effect blast radii and refractive shockwaves.
- **High-Energy Plasma Railgun (RG)**: Long-range piercing energy beam that vaporizes defensive hazard laser spikes and hostile lines.
- **Supply Drop Caches**: Collect weapon pickups, ammo crates, and armor nanite medkits across platforms.

### 🌆 5 Interactive Living Sector Environments
Seamless ascension across 5 distinct parallax atmospheric decks with procedural weather and dynamic lighting:
1. **Sector 01: Airborne Staging Ground (FL 0–49)** — Dark industrial citadel footings, active blast furnaces, rising volcanic embers, and patrol troopers.
2. **Sector 02: Citadel Shaft (FL 50–99)** — Internal fortress decks with localized electrical lightning storms and structural girders.
3. **Sector 03: Atmospheric Spires (FL 100–149)** — High-altitude spires piercing dense storm clouds with neon cityscapes far below.
4. **Sector 04: Orbital Apex Ring (FL 150–199)** — Exosphere transit elevator under low atmospheric pressure and cosmic defense arrays.
5. **Sector 05: Deep Space Defense (FL 200+)** — Orbit apex starfields with celestial auroras and zero-g satellite platforms.

### 🎵 Procedural Synthwave Soundtrack Engine
- **100% Web Audio Synthesizer**: Self-contained procedural Darksynth music engine with zero external audio assets, zero loading latency, and zero CORS issues.
- **Multi-Track Instrumentation**: Heavy 808-style pitch-bent kicks, crisp snare, metallic 16th-note hi-hats, crash cymbals, rolling sawtooth basslines, cybernetic arpeggios, atmospheric polyphonic pads, and lead melodies.
- **Adaptive Chord Progressions**: Sector-tailored 4-bar chord progressions in D Minor / Cyberpunk modal keys that shift as elevation increases.
- **Dynamic State Engine**: Automatically responds to game states (`MENU`, `PLAYING`, `BOSS`, `GAMEOVER`).
- **Bullet-Time Filter Sweep**: Activating Adrenaline Overdrive sweeps a low-pass resonant filter down to 420 Hz for a deep underwater hyper-focus sensation.
- **Combo-Responsive Unmuting**: Lead melodies dynamically activate as your floor combo chain exceeds x5.

### 🎆 Cinematic Arcade Post-Processing Pipeline
- **Dynamic Chromatic Aberration**: Dual-channel RGB split (`drop-shadow` chromatic offset) triggered on player damage, rocket explosions, and boss deaths.
- **Refractive Shockwave Rings**: Screen-space expanding shockwave rings rendered over explosions, crush stomps, double-jumps, and mission launch.
- **Speed Warp Streaks**: Aerodynamic warp lines radiating from screen center during supersonic sprint launches and super-jumps.
- **Adrenaline Hyper-Focus Matrix**: Cyan peripheral focus tunnel and digital telemetry scan grid during bullet-time.
- **Critical Health Heartbeat Alarm**: Dual-pulse systolic/diastolic crimson vignette that pulses whenever HP drops below 35.
- **Retro CRT Phosphor Scanlines**: Authentic arcade CRT scanline overlay with instant toggle.

### 🛡️ Checkpoint System & Sector Superweapons
- **Fast Deploy Checkpoints**: Reaching elevation milestones (FL-50, FL-100, etc.) permanent unlocks fast deployment from the main menu and debriefing screen.
- **Sector Boss Battles**:
  - **Sector 01**: *Apex Gunship: Valkyrie-9* (Missile barrages & twin gatling fire).
  - **Sector 02**: *Cyber Dreadnought: Titan-Core* (Heavy armor & high-velocity salvos).
  - **Sector 03**: *Orbital Sentinel: Stratos-X* (High-altitude ace drone swarms).
  - **Sector 04**: *Station Overlord: Exosphere-1* (Supreme command orbital defense flagship).
- **Campaign Story Transmissions**: Secured sector cutscenes with comms transmissions and full armor restoration upon boss destruction.

---

## ⌨️ Controls & Keybindings

| Key / Input | Action | Tactical Combat Tip |
| :--- | :--- | :--- |
| **A / D** or **Left / Right** | Sprint Horizontally | Build horizontal speed to increase jump launch height |
| **W** or **Space** or **Up** | Super-Jump | Jump higher from sprint; wall-kick off fortress walls |
| **W (x2)** or **Space (x2)** | Double-Jump | Acrobatic mid-air somersault burst to reach distant platforms |
| **Mouse Cursor** | 360° Dynamic Aim | Real-time crosshair tracking with target distance lock |
| **Left Click** | Fire Active Weapon | Aim downward to propel yourself upward with weapon recoil |
| **S** or **Down** | Aerial Crush Stomp | Slam enemy heads to crush them and reset jump momentum |
| **Right Click** | Adrenaline Overdrive | Trigger bullet-time slow motion when adrenaline gauge is 100% |
| **P** or **ESC** or **⚙ Button** | Settings & Briefing | Pause combat anytime to adjust audio, graphics, or controls |

---

## 🛠️ Technology Stack

- **Core**: HTML5 Canvas (60 FPS fixed-timestep physics simulation loop)
- **Styling**: Vanilla CSS3 with Cyberpunk Design System (glassmorphism, custom typography, cyber hex buttons)
- **Audio**: Web Audio API (`AudioContext`, procedural oscillators, gain nodes, biquad filters, convolvers)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/)
- **Desktop Application Shell**: [Tauri v2](https://tauri.app/) (Rust-powered lightweight desktop distribution)

---

## 📦 Getting Started & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.x or higher recommended)
- `npm` (packaged with Node.js)
- *(Optional for Desktop App)* [Rust & Cargo](https://www.rust-lang.org/) for building with Tauri.

### 1. Clone the Repository
```bash
git clone https://github.com/Youssef-Ashraf2099/Icy-tower-war-edition.git
cd Icy-tower-war-edition
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```
Open your browser and navigate to the local URL (typically `http://localhost:5173`).

### 4. Build for Production
To compile the minified, production-ready static bundle into the `dist/` directory:
```bash
npm run build
```

### 5. Preview Production Build
To preview the compiled production distribution locally:
```bash
npm run preview
```
Open your browser at `http://localhost:4173` to test the production bundle.

### 6. Build Desktop Native App (Tauri)
To package the game as a native desktop binary (Windows `.exe` / `.msi`, macOS `.app`, Linux `.deb`):
```bash
npm run tauri build
```

---

## 📂 Project Architecture

```
Icy-tower-war-edition/
├── index.html                   # Master entry HTML, HUD overlays, modals, and settings
├── package.json                 # Project dependencies, scripts, and metadata
├── vite.config.js               # Vite bundler configuration
├── public/                      # Static assets served at root
│   ├── assets/                  # Hero commando sprites, weapons, backgrounds, concept art
│   ├── favicon.ico              # Browser favicon
│   └── ...
├── src/
│   ├── main.js                  # Application entry point, UI bindings, and fixed timestep loop
│   ├── style.css                # Curated cyber design system, HUD panels, CRT, and animations
│   ├── assets/
│   │   ├── AssetLoader.js       # Asynchronous image asset preloading pipeline
│   │   └── SpriteManager.js     # Procedural wall pillars, platforms, and character sprite rendering
│   ├── audio/
│   │   ├── MusicEngine.js       # Multi-track procedural Web Audio Darksynth generator
│   │   └── SoundEffects.js      # Procedural sound FX (shots, explosions, jumps, stomps, crates)
│   ├── combat/
│   │   ├── Enemies.js           # Garrison troopers, drones, shield enforcers, and sector bosses
│   │   └── Weapons.js           # Ballistic projectiles, plasma rail beams, ammo, and recoil
│   ├── engine/
│   │   ├── Constants.js         # Physics constants, platform configurations, and layer depths
│   │   ├── Game.js              # Master game coordinator (state, collisions, loop, camera)
│   │   ├── PlatformManager.js   # Procedural vertical platform generation, hazards, and crates
│   │   └── Player.js            # Commando kinematics, acrobatics, tilt, ghosts, and health
│   └── juice/
│       ├── ComboManager.js      # Combo counters, timeout decay, rank grading (D to S+), and scores
│       ├── InteractiveBackground.js # 5-sector parallax SVG/Canvas backgrounds with weather FX
│       ├── ParticleSystem.js    # Spark emitters, shell casings, floating damage text, screen shake
│       └── PostProcessing.js    # Chromatic aberration, shockwave rings, speed warps, CRT, vignettes
└── src-tauri/                   # Rust Tauri native desktop backend configuration
```

---

## ⚙️ Settings & Customization

The game includes a dedicated in-game **Tactical Settings & Operations Briefing** modal accessible from the main menu, by pressing `[P]` or `[ESC]`, or by clicking the `⚙` HUD icon.

### Configurable Preferences
- **Synthesizer Music Volume**: Granular slider (0%–100%) with independent mute toggle.
- **Combat Sound FX Volume**: Granular slider (0%–100%) with independent mute toggle.
- **Retro CRT Scanlines**: Toggle arcade phosphor scanlines on/off.
- **Chromatic Aberration (RGB Shift)**: Toggle heavy impact chromatic aberration.
- **Explosion Shockwave Refraction**: Toggle expanding screen-space shockwave rings.
- **Screen Shake Multiplier**: Selectable intensity (`0.5x`, `1.0x (Default)`, `1.5x Intense`).

All user preferences, unlocked checkpoints, high floors, and high scores are automatically persisted in `localStorage`:
- `wartower_highscore`: Player's all-time record score.
- `wartower_highfloor`: Player's peak ascended floor.
- `wartower_checkpoint`: Highest reached checkpoint floor (`50`, `100`, `150`, etc.).
- `wartower_music_vol` / `wartower_music_muted`: Music volume level and state.
- `wartower_sfx_vol` / `wartower_sfx_muted`: Sound FX volume level and state.
- `wartower_fx_crt`: CRT scanline overlay toggle state.
- `wartower_fx_chromatic`: Chromatic aberration toggle state.
- `wartower_fx_shockwaves`: Shockwave rendering toggle state.
- `wartower_fx_shake`: Screen shake intensity scalar.

---

## 🏆 Scoring & Combo Ranks

Chaining platform landings before the combo meter expires awards massive multiplier bonuses:

| Combo Count | Rank Badge | Military Title | Rank Color |
| :---: | :---: | :--- | :--- |
| **0 - 2** | `D` | RECON SCOUT | Bronze (`#cd7f32`) |
| **3 - 5** | `C` | SHOCK TROOPER | Silver (`#94a3b8`) |
| **6 - 9** | `B` | COMBAT SPECIALIST | Gold (`#ffd700`) |
| **10 - 14** | `A` | CYBER COMMANDO | Crimson (`#ff2a4b`) |
| **15 - 24** | `S` | VANGUARD ACE | Cyan (`#00f0ff`) |
| **25+** | `S+` | WAR TOWER APEX | Neon Lime (`#00ff77`) |

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🎖️ Acknowledgements

- Inspired by the iconic mechanics of **Icy Tower** by Free Lunch Design.
- Procedural audio synthesis inspired by classic cyberpunk synthwave and 80s darksynth aesthetics.
- Developed with pride for the **War Tower** community.
