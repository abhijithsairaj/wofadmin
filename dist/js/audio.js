/**
 * WOF RUSH - Procedural Web Audio Sound Effects & Music Engine
 * Zero external audio files required - works 100% offline and instantly.
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.isMusicPlaying = false;
    this.musicInterval = null;
    this.bpm = 128;
    this.step = 0;
    this.turboMode = false;

    // Load saved mute setting
    try {
      const savedMute = localStorage.getItem('wof_rush_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch (e) {}
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('wof_rush_muted', this.isMuted);
    } catch (e) {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // --- SFX GENERATORS ---

  playCoin(pitchMod = 0) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Classic arcade coin chime: 987.77 Hz (B5) -> 1318.51 Hz (E6)
    const baseB = 987.77 * Math.pow(1.05, Math.min(pitchMod, 12));
    const baseE = 1318.51 * Math.pow(1.05, Math.min(pitchMod, 12));

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseB, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.09);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseE, now + 0.07);
    gain2.gain.setValueAtTime(0.3, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.3);
  }

  playScooterRev() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.25);
    osc.frequency.linearRampToValueAtTime(180, now + 0.45);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.52);
  }

  playCustomerCheer() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Cheerful high delivery completion ring
    [784, 1046.5, 1568].forEach((freq, idx) => {
      const st = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.3, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.38);
    });
  }

  playPickup(streak = 0) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Scale notes: C5, D5, E5, G5, A5, C6, D6, E6
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    const freq = pentatonic[Math.min(streak, pentatonic.length - 1)];

    // Bubble pop / marimba tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.9, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.03);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);

    // Subtle harmonic chime
    const harmonic = this.ctx.createOscillator();
    const hGain = this.ctx.createGain();
    harmonic.type = 'triangle';
    harmonic.frequency.setValueAtTime(freq * 2, now);
    hGain.gain.setValueAtTime(0.12, now);
    hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    harmonic.connect(hGain);
    hGain.connect(this.sfxGain);
    harmonic.start(now);
    harmonic.stop(now + 0.11);
  }

  playMealComplete() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Bright celebratory fanfare chord arpeggio: C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const startTime = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });

    // Shimmer burst
    this.createNoiseBurst(now + 0.25, 0.3, 0.2, 3500);
  }

  playJump() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  playSlide() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // White noise swoosh with low pass filter
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.25);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.26);
  }

  playLaneSwitch() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playNearMiss() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Fast wind whip
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.17);

    // High accent ding
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'triangle';
    bell.frequency.setValueAtTime(1400, now + 0.02);
    bellGain.gain.setValueAtTime(0.25, now + 0.02);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    bell.connect(bellGain);
    bellGain.connect(this.sfxGain);
    bell.start(now + 0.02);
    bell.stop(now + 0.26);
  }

  playHit() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Heavy bass thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);

    // Crash noise
    this.createNoiseBurst(now, 0.4, 0.35, 1200);
  }

  playShieldBreak() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Glass / forcefield shatter
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.33);

    this.createNoiseBurst(now, 0.35, 0.25, 4000);
  }

  playPowerup() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Rapid ascending shimmer
    [300, 450, 600, 750, 950, 1200].forEach((freq, idx) => {
      const startTime = now + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.16);
    });
  }

  playBurgerSmash() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Low crunch + pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);

    this.createNoiseBurst(now, 0.3, 0.2, 1800);
  }

  playDeliveryAlert() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Order bell ding - two cheerful rings
    [880, 1320].forEach((freq, i) => {
      const st = now + i * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.35, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.36);
    });
  }

  playDeliverySuccess() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Grand triumphant fanfare
    const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chord.forEach((freq, idx) => {
      const st = now + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.35, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.7);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.75);
    });
  }

  playGoldenFry() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Magical sparkle bells
    const sparkles = [1046.5, 1318.51, 1567.98, 2093.0, 2637.02];
    sparkles.forEach((freq, i) => {
      const st = now + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.3, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.45);
    });
  }

  createNoiseBurst(startTime, duration, volume, filterFreq) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + duration + 0.01);
  }

  // --- BACKGROUND MUSIC ENGINE ---
  // Energetic upbeat Coimbatore street arcade groove (128 BPM, kuthu/street fusion rhythm)

  startMusic() {
    if (this.isMusicPlaying) return;
    this.resume();
    this.isMusicPlaying = true;
    this.step = 0;

    const stepTime = (60 / this.bpm) / 4; // 16th notes
    let nextNoteTime = this.ctx ? this.ctx.currentTime + 0.1 : 0;

    this.musicInterval = setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying) return;
      const currentTime = this.ctx.currentTime;
      while (nextNoteTime < currentTime + 0.2) {
        this.playMusicStep(nextNoteTime, this.step);
        nextNoteTime += stepTime * (this.turboMode ? 0.8 : 1.0);
        this.step = (this.step + 1) % 64; // 4-bar loop
      }
    }, 50);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  setTurbo(enabled) {
    this.turboMode = enabled;
  }

  playMusicStep(time, step) {
    if (this.isMuted) return;

    // --- Kuthu / Street Drums ---
    // Kick drum on 1, 7, 9, 13 (syncopated street beat)
    const beat16 = step % 16;
    if (beat16 === 0 || beat16 === 6 || beat16 === 8 || beat16 === 12) {
      this.playSynthKick(time, beat16 === 0 ? 0.35 : 0.25);
    }

    // Snare / Rim tap on 4 and 12
    if (beat16 === 4 || beat16 === 12) {
      this.playSynthSnare(time, 0.2);
    }

    // Hi-hats on off-beats (8th notes and 16th syncopations)
    if (beat16 % 2 === 1 || beat16 === 14) {
      this.playSynthHat(time, 0.08);
    }

    // --- Bassline (Funky Minor Groove in D Minor / G Minor feel) ---
    // D2 = 73.42, F2 = 87.31, G2 = 98.00, A2 = 110.00, C3 = 130.81
    const bassNotes = [
      73.42, 73.42, null, 73.42,  87.31, null, 98.00, 73.42,
      73.42, 73.42, 110.0, null,  98.00, 87.31, 73.42, null,
      98.00, 98.00, null, 98.00,  110.0, null, 130.81, 98.00,
      87.31, 87.31, null, 98.00,  73.42, 65.41, 73.42, null
    ];
    const bassFreq = bassNotes[step % 32];
    if (bassFreq) {
      this.playSynthBass(time, bassFreq, 0.12);
    }

    // --- Lead Synth Arpeggio / Chime ---
    // D4 = 293.66, F4 = 349.23, G4 = 392.00, A4 = 440.00, C5 = 523.25, D5 = 587.33
    const leadPattern = [
      null, 587.33, null, 440.00,  null, 523.25, null, 392.00,
      349.23, null, 392.00, null,  440.00, null, 587.33, null,
      null, 659.25, null, 523.25,  null, 587.33, null, 440.00,
      392.00, null, 440.00, null,  523.25, null, 587.33, null
    ];
    const leadFreq = leadPattern[step % 32];
    if (leadFreq && (step % 2 === 0 || this.turboMode)) {
      this.playSynthLead(time, leadFreq, 0.08);
    }
  }

  playSynthKick(time, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.1);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.19);
  }

  playSynthSnare(time, vol) {
    this.createNoiseBurst(time, 0.12, vol, 2500);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    gain.gain.setValueAtTime(vol * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  playSynthHat(time, vol) {
    this.createNoiseBurst(time, 0.04, vol, 7000);
  }

  playSynthBass(time, freq, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.turboMode ? 800 : 450, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.18);
  }

  playSynthLead(time, freq, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }
}

// Global instance
window.audioManager = new AudioManager();
