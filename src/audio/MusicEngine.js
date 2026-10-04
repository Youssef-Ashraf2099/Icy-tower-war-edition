// High-Octane Cyberpunk Synthwave Music Engine
// Procedural multi-track Darksynth soundtrack generator powered by Web Audio API.
// 100% self-contained, zero external files, precision scheduled with sample-accurate lookahead,
// and dynamically reactive to Game State, Sectors, Boss Encounters, Combos, and Adrenaline Overdrive.

import { sounds } from './SoundEffects.js';

export class MusicEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.filterNode = null;
    this.convolver = null;
    this.compressor = null;

    // State & Settings
    this.enabled = true;
    this.volume = parseFloat(localStorage.getItem('wartower_music_vol') || '0.65');
    this.muted = localStorage.getItem('wartower_music_muted') === 'true';
    if (this.muted) this.enabled = false;

    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'BOSS' | 'GAMEOVER'
    this.sector = 1;     // 1 to 5
    this.comboCount = 0;
    this.isOverdrive = false;

    // Sequencer Timing
    this.bpm = 132;
    this.step = 0;        // 16th note step index (0 to 63 = 4 bars)
    this.lookahead = 30;  // ms between schedule loops
    this.scheduleAheadTime = 0.12; // seconds to schedule ahead
    this.nextStepTime = 0;
    this.timerId = null;
    this.initialized = false;

    // Musical Chords & Scales (D Minor / Cyberpunk Darksynth Key)
    // Notes in Hz: D2=73.42, F2=87.31, G2=98.00, A2=110.00, Bb2=116.54, C3=130.81, D3=146.83, F3=174.61, G3=196.00, A3=220.00, Bb3=233.08, C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00
    this.scales = {
      // 4-Bar Chord Progressions per Sector
      1: {
        // Sector 1: Dm -> Bb -> C -> Am (Classic Heavy Darksynth)
        chords: [
          { root: 73.42, arp: [146.83, 174.61, 220.00, 293.66, 349.23, 440.00] }, // Dm
          { root: 58.27, arp: [116.54, 146.83, 174.61, 233.08, 293.66, 349.23] }, // Bb
          { root: 65.41, arp: [130.81, 164.81, 196.00, 261.63, 329.63, 392.00] }, // C
          { root: 55.00, arp: [110.00, 130.81, 164.81, 220.00, 261.63, 329.63] }  // Am
        ],
        leadMelody: [
          { step: 0, note: 293.66, len: 4 }, { step: 4, note: 349.23, len: 4 }, { step: 8, note: 440.00, len: 6 },
          { step: 16, note: 466.16, len: 4 }, { step: 20, note: 440.00, len: 4 }, { step: 24, note: 349.23, len: 8 },
          { step: 32, note: 392.00, len: 4 }, { step: 36, note: 440.00, len: 4 }, { step: 40, note: 523.25, len: 6 },
          { step: 48, note: 440.00, len: 4 }, { step: 52, note: 349.23, len: 4 }, { step: 56, note: 293.66, len: 8 }
        ]
      },
      2: {
        // Sector 2: Storm Deck (Dm -> Gm -> Bb -> A7)
        chords: [
          { root: 73.42, arp: [146.83, 174.61, 220.00, 293.66, 349.23] }, // Dm
          { root: 49.00, arp: [98.00, 116.54, 146.83, 196.00, 233.08] },   // Gm
          { root: 58.27, arp: [116.54, 146.83, 174.61, 233.08, 293.66] }, // Bb
          { root: 55.00, arp: [110.00, 138.59, 164.81, 220.00, 277.18] }  // A maj
        ],
        leadMelody: [
          { step: 0, note: 440.00, len: 4 }, { step: 4, note: 392.00, len: 4 }, { step: 8, note: 349.23, len: 4 }, { step: 12, note: 293.66, len: 4 },
          { step: 16, note: 392.00, len: 4 }, { step: 20, note: 440.00, len: 4 }, { step: 24, note: 466.16, len: 6 },
          { step: 32, note: 466.16, len: 4 }, { step: 36, note: 440.00, len: 4 }, { step: 40, note: 349.23, len: 4 }, { step: 44, note: 293.66, len: 4 },
          { step: 48, note: 277.18, len: 6 }, { step: 54, note: 293.66, len: 2 }, { step: 56, note: 440.00, len: 8 }
        ]
      },
      3: {
        // Sector 3: Atmospheric Mega-Spires (F -> C -> Dm -> Bb)
        chords: [
          { root: 87.31, arp: [174.61, 220.00, 261.63, 349.23, 440.00] }, // F
          { root: 65.41, arp: [130.81, 164.81, 196.00, 261.63, 329.63] }, // C
          { root: 73.42, arp: [146.83, 174.61, 220.00, 293.66, 349.23] }, // Dm
          { root: 58.27, arp: [116.54, 146.83, 174.61, 233.08, 293.66] }  // Bb
        ],
        leadMelody: [
          { step: 0, note: 349.23, len: 6 }, { step: 8, note: 440.00, len: 4 }, { step: 12, note: 523.25, len: 4 },
          { step: 16, note: 523.25, len: 6 }, { step: 24, note: 440.00, len: 4 }, { step: 28, note: 392.00, len: 4 },
          { step: 32, note: 440.00, len: 8 }, { step: 40, note: 349.23, len: 4 }, { step: 44, note: 293.66, len: 4 },
          { step: 48, note: 293.66, len: 4 }, { step: 52, note: 349.23, len: 4 }, { step: 56, note: 392.00, len: 6 }
        ]
      },
      4: {
        // Sector 4: Orbital Space Elevator (Cm -> Ab -> Eb -> Bb)
        chords: [
          { root: 65.41, arp: [130.81, 155.56, 196.00, 261.63, 311.13] }, // Cm
          { root: 51.91, arp: [103.83, 130.81, 155.56, 207.65, 261.63] }, // Ab
          { root: 77.78, arp: [155.56, 196.00, 233.08, 311.13, 392.00] }, // Eb
          { root: 58.27, arp: [116.54, 146.83, 174.61, 233.08, 293.66] }  // Bb
        ],
        leadMelody: [
          { step: 0, note: 523.25, len: 8 }, { step: 8, note: 466.16, len: 4 }, { step: 12, note: 392.00, len: 4 },
          { step: 16, note: 415.30, len: 8 }, { step: 24, note: 392.00, len: 4 }, { step: 28, note: 311.13, len: 4 },
          { step: 32, note: 392.00, len: 6 }, { step: 40, note: 311.13, len: 4 }, { step: 44, note: 261.63, len: 4 },
          { step: 48, note: 233.08, len: 4 }, { step: 52, note: 261.63, len: 4 }, { step: 56, note: 392.00, len: 8 }
        ]
      },
      5: {
        // Sector 5: Deep Space Defense (Ebm -> B -> Db -> Bbm)
        chords: [
          { root: 77.78, arp: [155.56, 185.00, 233.08, 311.13, 369.99] }, // Ebm
          { root: 61.74, arp: [123.47, 155.56, 185.00, 246.94, 311.13] }, // B
          { root: 69.30, arp: [138.59, 174.61, 207.65, 277.18, 349.23] }, // Db
          { root: 58.27, arp: [116.54, 138.59, 174.61, 233.08, 277.18] }  // Bbm
        ],
        leadMelody: [
          { step: 0, note: 622.25, len: 6 }, { step: 6, note: 554.37, len: 4 }, { step: 10, note: 466.16, len: 6 },
          { step: 16, note: 493.88, len: 6 }, { step: 22, note: 466.16, len: 4 }, { step: 26, note: 369.99, len: 6 },
          { step: 32, note: 554.37, len: 6 }, { step: 38, note: 493.88, len: 4 }, { step: 42, note: 415.30, len: 6 },
          { step: 48, note: 466.16, len: 8 }, { step: 56, note: 622.25, len: 8 }
        ]
      }
    };

    // User gesture unlocking hook
    this.setupGestureUnlock();
  }

  setupGestureUnlock() {
    const unlock = () => {
      this.init();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    window.addEventListener('touchstart', unlock, { once: false });
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      // Use existing audio context from sound engine or instantiate new AudioContext
      sounds.init();
      this.ctx = sounds.ctx || new (window.AudioContext || window.webkitAudioContext)();

      // Master Output Graph
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.08, this.ctx.currentTime);

      // Low-pass filter for Adrenaline / Bullet-time & Ambient effects
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(18000, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      const currentTargetVol = (this.enabled && !this.muted) ? this.volume * 0.42 : 0;
      this.masterGain.gain.setValueAtTime(currentTargetVol, this.ctx.currentTime);

      // Wire nodes: Synthesizers -> Filter -> Compressor -> Master Gain -> Destination
      this.filterNode.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.initialized = true;
      this.nextStepTime = this.ctx.currentTime + 0.05;

      // Start the lookahead scheduler loop
      this.startScheduler();
    } catch (e) {
      console.warn('[MusicEngine] AudioContext init error:', e);
    }
  }

  startScheduler() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.scheduler();
    }, this.lookahead);
  }

  scheduler() {
    if (!this.initialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') return;

    // Schedule audio notes ahead of time for jitter-free sequencing
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.step, this.nextStepTime);
      this.advanceStep();
    }
  }

  advanceStep() {
    // 16th note duration = (60 / bpm) / 4 seconds
    const secondsPer16th = (60.0 / this.bpm) / 4.0;
    this.nextStepTime += secondsPer16th;
    this.step = (this.step + 1) % 64; // 64 steps = 4 bars (16 steps per bar)
  }

  // --- Track Sequencer: Schedules sounds for the current 16th note step ---
  scheduleStep(step, time) {
    if (!this.enabled || this.muted) return;

    const bar = Math.floor(step / 16); // 0, 1, 2, 3
    const stepInBar = step % 16;       // 0 to 15
    const beat = Math.floor(stepInBar / 4); // 0, 1, 2, 3
    const sub = stepInBar % 4;         // 0, 1, 2, 3

    const secData = this.scales[this.sector] || this.scales[1];
    const chord = secData.chords[bar] || secData.chords[0];

    // ==========================================
    // 1. DRUMS & PERCUSSION
    // ==========================================
    if (this.state !== 'GAMEOVER') {
      const isBoss = this.state === 'BOSS';

      // A. Kick Drum
      // Menu: Beat 0 & 2 | Combat: Four-on-the-Floor (beats 0, 1, 2, 3) | Boss: Driving Double-Kick
      let playKick = false;
      if (this.state === 'MENU') {
        playKick = (sub === 0 && (beat === 0 || beat === 2));
      } else if (isBoss) {
        // Fast intense beat with syncopated 16th kicks
        playKick = (sub === 0) || (sub === 2 && (stepInBar === 6 || stepInBar === 14));
      } else {
        // Four on the floor + extra driving kick on high combo
        playKick = (sub === 0) || (this.comboCount >= 6 && stepInBar === 14);
      }
      if (playKick) {
        this.synthKick(time, isBoss ? 1.15 : 1.0);
      }

      // B. Snare
      // Backbeat on Beats 1 and 3 (i.e. steps 4 and 12 in bar)
      let playSnare = false;
      if (this.state === 'MENU') {
        playSnare = (stepInBar === 8 && bar % 2 === 1); // Slow half-time snare
      } else {
        playSnare = (stepInBar === 4 || stepInBar === 12);
        // Snare roll before bar 4 ends
        if (bar === 3 && stepInBar >= 12 && isBoss) {
          playSnare = true;
        }
      }
      if (playSnare) {
        this.synthSnare(time, isBoss ? 1.1 : 0.95);
      }

      // C. Hi-Hats (16th-note electro pulse)
      if (this.state !== 'MENU') {
        const isOffbeat = (sub === 2);
        const isOpen = isOffbeat && (this.comboCount >= 4 || isBoss);
        const hatVol = isOffbeat ? 0.35 : 0.18;
        this.synthHiHat(time, isOpen, hatVol);
      }

      // D. Crash Cymbal on Bar 0 start
      if (step === 0 && this.state !== 'MENU') {
        this.synthCrash(time, 0.45);
      }
    }

    // ==========================================
    // 2. SYNTH BASSLINE (Pulsing 16th Darksynth Rolling Bass)
    // ==========================================
    if (this.state !== 'GAMEOVER') {
      const rootFreq = chord.root;
      let bassFreq = rootFreq;

      if (this.state === 'MENU') {
        // Ambient long pulsing drone
        if (stepInBar === 0 || stepInBar === 8) {
          this.synthBass(time, rootFreq, (60.0 / this.bpm) * 0.9, 0.45, 'triangle');
        }
      } else {
        // Driving Rolling 16th-Note Bass (Root and Octave bounce)
        // Alternating octave patterns: 0=root, 1=octave, 2=root, 3=octave
        const octaveMult = (sub === 1 || sub === 3) ? 2.0 : 1.0;
        bassFreq = rootFreq * octaveMult;

        // Minor variation on last step of bar
        if (stepInBar === 15) bassFreq = rootFreq * 1.5; // Fifth note pickup

        const bassLength = (60.0 / this.bpm) / 4.0 * 0.82;
        const isDistorted = (this.state === 'BOSS' || this.comboCount >= 9);
        this.synthBass(time, bassFreq, bassLength, isDistorted ? 0.6 : 0.48, isDistorted ? 'sawtooth' : 'sawtooth');
      }
    }

    // ==========================================
    // 3. CYBERPUNK ARPEGGIATOR (16th Note Melodic Stream)
    // ==========================================
    if (this.state !== 'GAMEOVER') {
      const arpNotes = chord.arp || [220, 261, 329];
      const arpIndex = (step * 2) % arpNotes.length;
      const arpFreq = arpNotes[arpIndex];
      const arpLength = (60.0 / this.bpm) / 4.0 * 0.55;

      const arpGain = this.state === 'MENU' ? 0.15 : (this.comboCount >= 6 ? 0.32 : 0.22);
      this.synthArp(time, arpFreq, arpLength, arpGain);
    }

    // ==========================================
    // 4. RETRO SYNTH PAD / STRINGS (Warm Polyphonic Chords)
    // ==========================================
    if (stepInBar === 0) {
      const padLength = (60.0 / this.bpm) * 3.8; // Holds for entire bar
      const padNotes = [chord.root * 2, chord.arp[1] || chord.root * 2.4, chord.arp[2] || chord.root * 3];
      this.synthPad(time, padNotes, padLength, this.state === 'MENU' ? 0.35 : 0.22);
    }

    // ==========================================
    // 5. SCI-FI MELODIC LEAD (Activated in combat & combo streaks)
    // ==========================================
    if (this.state !== 'MENU' && this.state !== 'GAMEOVER' && secData.leadMelody) {
      // Find if lead note triggers on this step
      const leadEvent = secData.leadMelody.find(m => m.step === step);
      if (leadEvent) {
        const leadLen = (60.0 / this.bpm) / 4.0 * leadEvent.len * 0.9;
        const leadGain = (this.comboCount >= 4 || this.state === 'BOSS') ? 0.38 : 0.26;
        this.synthLead(time, leadEvent.note, leadLen, leadGain);
      }
    }
  }

  // --- SYNTHESIZER VOICE ENGINES ---

  // 1. Kick Drum
  synthKick(time, velocity = 1.0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Pitch drops rapidly from 160Hz to 42Hz for punchy thud
    osc.frequency.setValueAtTime(165, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

    gain.gain.setValueAtTime(0.85 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    osc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  // 2. Electro Snare
  synthSnare(time, velocity = 1.0) {
    // A. Tone body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.1);
    oscGain.gain.setValueAtTime(0.4 * velocity, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(oscGain);
    oscGain.connect(this.filterNode);
    osc.start(time);
    osc.stop(time + 0.13);

    // B. Noise snap
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1800, time);
    noiseFilter.Q.setValueAtTime(1.8, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55 * velocity, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.17);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.filterNode);

    noise.start(time);
    noise.stop(time + 0.18);
  }

  // 3. Metallic Hi-Hat
  synthHiHat(time, isOpen = false, vol = 0.2) {
    const duration = isOpen ? 0.22 : 0.05;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    noise.start(time);
    noise.stop(time + duration);
  }

  // 4. Crash Cymbal
  synthCrash(time, vol = 0.4) {
    const duration = 1.4;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    noise.start(time);
    noise.stop(time + duration);
  }

  // 5. Rolling Sawtooth Bass
  synthBass(time, freq, duration, vol = 0.5, oscType = 'sawtooth') {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = oscType;
    osc.frequency.setValueAtTime(freq, time);

    // Filter Envelope (Snappy low-pass sweep)
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 6.5, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.8, time + duration);
    filter.Q.setValueAtTime(4.0, time);

    // Amp Envelope
    gain.gain.setValueAtTime(vol, time);
    gain.gain.linearRampToValueAtTime(vol * 0.75, time + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  // 6. Cyberpunk Arpeggio Voice
  synthArp(time, freq, duration, vol = 0.25) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, time);
    filter.Q.setValueAtTime(2.0, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  // 7. Warm Atmospheric Polyphonic Pad
  synthPad(time, notes, duration, vol = 0.25) {
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      // Subtle detune for rich analog chorus warmth
      osc.frequency.setValueAtTime(freq + (idx === 1 ? 0.75 : -0.75), time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.frequency.exponentialRampToValueAtTime(900, time + duration);

      // Soft swell attack and smooth release
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol / notes.length, time + 0.4);
      gain.gain.setValueAtTime(vol / notes.length, time + duration - 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.filterNode);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  // 8. Soaring Retro Sci-Fi Lead Synth
  synthLead(time, freq, duration, vol = 0.3) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.003, time); // Chorus shimmer

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3800, time);
    filter.Q.setValueAtTime(3.0, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.setValueAtTime(vol * 0.9, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  // --- REACTIVE STATE DISPATCHERS ---

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;

    if (!this.initialized) return;

    if (newState === 'MENU') {
      this.bpm = 112;
    } else if (newState === 'BOSS') {
      this.bpm = 146;
      this.synthCrash(this.ctx.currentTime + 0.05, 0.6);
    } else if (newState === 'PLAYING') {
      this.bpm = 134;
    } else if (newState === 'GAMEOVER') {
      this.bpm = 100;
    }
  }

  setSector(sectorNum) {
    const s = Math.max(1, Math.min(5, Math.floor(sectorNum) || 1));
    this.sector = s;
  }

  setCombo(comboCount) {
    this.comboCount = comboCount || 0;
  }

  setAdrenaline(isOverdrive) {
    if (this.isOverdrive === isOverdrive || !this.initialized || !this.filterNode) return;
    this.isOverdrive = isOverdrive;

    const now = this.ctx.currentTime;
    if (isOverdrive) {
      // Bullet-Time: Dramatic low-pass filter cutoff sweep down to 420Hz (deep underwater sensation)
      this.filterNode.frequency.cancelScheduledValues(now);
      this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, now);
      this.filterNode.frequency.exponentialRampToValueAtTime(420, now + 0.15);
      this.filterNode.Q.setValueAtTime(4.5, now);
    } else {
      // Restore crisp full-frequency response
      this.filterNode.frequency.cancelScheduledValues(now);
      this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, now);
      this.filterNode.frequency.exponentialRampToValueAtTime(18000, now + 0.25);
      this.filterNode.Q.setValueAtTime(1.5, now);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('wartower_music_vol', this.volume.toString());
    if (this.masterGain && this.ctx && this.enabled && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.volume * 0.42, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.enabled = !this.muted;
    localStorage.setItem('wartower_music_muted', this.muted.toString());

    if (this.masterGain && this.ctx) {
      const target = (this.enabled && !this.muted) ? this.volume * 0.42 : 0;
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
    return !this.muted;
  }
}

export const music = new MusicEngine();
