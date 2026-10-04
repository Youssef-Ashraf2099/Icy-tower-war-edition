class SoundEngine {
  constructor() {
    this.ctx = null;
    this.volume = parseFloat(localStorage.getItem('wartower_sfx_vol') || '0.8');
    this.muted = localStorage.getItem('wartower_sfx_muted') === 'true';
    this.enabled = !this.muted;
    this.masterGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      const currentTargetVol = (this.enabled && !this.muted) ? this.volume * 0.45 : 0;
      this.masterGain.gain.value = currentTargetVol;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('wartower_sfx_vol', this.volume.toString());
    if (this.masterGain && this.ctx && this.enabled && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.volume * 0.45, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.enabled = !this.muted;
    localStorage.setItem('wartower_sfx_muted', this.muted.toString());
    if (this.masterGain && this.ctx) {
      const target = (this.enabled && !this.muted) ? this.volume * 0.45 : 0;
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
    return !this.muted;
  }

  playJump(tier = 'normal') {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (tier === 'spring') {
      // Classic high-octane spring launch: resonant boing twang + rising harmonics
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(940, now + 0.28);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(340, now);
      osc2.frequency.exponentialRampToValueAtTime(1450, now + 0.24);
      gain2.gain.setValueAtTime(0.25, now);
      gain2.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now);
      osc2.stop(now + 0.26);

      gain.gain.setValueAtTime(0.42, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.32);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.33);
    } else if (tier === 'sprint' || tier === true) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.2);
      gain.gain.setValueAtTime(0.36, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.23);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.12);
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.13);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  }

  playWallKick() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playHeadStomp() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playShoot(weaponType) {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    if (weaponType === 'SHOTGUN') {
      // Heavy shotgun boom
      this.createNoiseBurst(0.28, 600, 80);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (weaponType === 'RPG') {
      // Rocket whoosh launch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(260, now + 0.2);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.28);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
      this.createNoiseBurst(0.18, 900, 300);
    } else if (weaponType === 'RAILGUN') {
      // Laser beam hum
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      // Standard rifle burst
      this.createNoiseBurst(0.08, 1800, 400);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.09);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  playExplosion(isLarge = false) {
    if (!this.enabled) return;
    this.init();
    const duration = isLarge ? 0.45 : 0.28;
    this.createNoiseBurst(duration, isLarge ? 400 : 800, 60);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isLarge ? 110 : 150, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + duration);
    gain.gain.setValueAtTime(isLarge ? 0.6 : 0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  playComboFanfare(tierIndex) {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const chordFrequencies = [
      [261.63, 329.63, 392.00], // C major (Good)
      [293.66, 369.99, 440.00], // D major (Sweet)
      [329.63, 415.30, 493.88], // E major (Great)
      [392.00, 493.88, 587.33], // G major (Super)
      [440.00, 554.37, 659.25], // A major (Brutal)
      [523.25, 659.25, 783.99], // High C (Air Superiority)
      [587.33, 739.99, 880.00, 1046.50] // D epic chord (Unstoppable)
    ];

    const notes = chordFrequencies[Math.min(tierIndex, chordFrequencies.length - 1)];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(0.25, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.04);
      osc.stop(now + 0.5);
    });
  }

  playCratePickup() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.05 + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.12);
    });
  }

  createNoiseBurst(duration, startFreq, endFreq) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const now = this.ctx.currentTime;
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.linearRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }
}

export const sounds = new SoundEngine();
