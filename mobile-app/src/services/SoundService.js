/* ==========================================
   🎵 Servicio de Efectos de Sonido - Mobile
   Versión simplificada para la app móvil
   ========================================== */

class SoundServiceClass {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.5; // Volumen más bajo para móvil
  }

  // Inicializar AudioContext (necesita interacción del usuario)
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // Crear oscilador básico
  createOscillator(type, frequency, duration, volume = this.volume) {
    if (!this.enabled || !this.audioContext) return null;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = type;
    osc.frequency.value = frequency;
    
    gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    return { osc, gain };
  }

  // Sonido al marcar un número
  playMarkNumber() {
    this.init();
    const { osc, gain } = this.createOscillator('sine', 800, 0.15) || {};
    if (!osc) return;

    osc.start();
    osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
    osc.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.05);
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  // Sonido cuando el número coincide con uno cantado
  playNumberMatch() {
    this.init();
    if (!this.enabled) return;

    const now = this.audioContext.currentTime;
    
    // Acorde alegre
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const { osc } = this.createOscillator('sine', freq, 0.3) || {};
      if (osc) {
        osc.start(now + i * 0.05);
        osc.stop(now + 0.3);
      }
    });
  }

  // Sonido de línea completada
  playLineWin() {
    this.init();
    if (!this.enabled) return;

    const now = this.audioContext.currentTime;
    const melody = [523.25, 587.33, 659.25, 783.99, 880];

    melody.forEach((freq, i) => {
      const { osc } = this.createOscillator('sine', freq, 0.2, this.volume * 0.8) || {};
      if (osc) {
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.2);
      }
    });
  }

  // Sonido de BINGO!!! 🎉
  playBingoWin() {
    this.init();
    if (!this.enabled) return;

    const now = this.audioContext.currentTime;
    
    // Fanfarria épica
    const fanfare = [
      { freq: 523.25, start: 0, duration: 0.15 },
      { freq: 523.25, start: 0.15, duration: 0.15 },
      { freq: 523.25, start: 0.3, duration: 0.15 },
      { freq: 659.25, start: 0.45, duration: 0.3 },
      { freq: 587.33, start: 0.75, duration: 0.15 },
      { freq: 659.25, start: 0.9, duration: 0.15 },
      { freq: 783.99, start: 1.05, duration: 0.4 },
    ];

    fanfare.forEach(note => {
      const { osc } = this.createOscillator('sine', note.freq, note.duration, this.volume) || {};
      if (osc) {
        osc.start(now + note.start);
        osc.stop(now + note.start + note.duration);
      }
    });
  }

  // Click genérico
  playClick() {
    this.init();
    const { osc } = this.createOscillator('sine', 600, 0.05, this.volume * 0.3) || {};
    if (osc) {
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.05);
    }
  }

  // Sonido de error
  playError() {
    this.init();
    if (!this.enabled) return;

    const now = this.audioContext.currentTime;
    
    const { osc } = this.createOscillator('sawtooth', 200, 0.3, this.volume * 0.3) || {};
    if (osc) {
      osc.start(now);
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(150, now + 0.15);
      osc.stop(now + 0.3);
    }
  }

  // Vibración táctil (para móviles)
  vibrate(pattern = [50]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // Marcar número con feedback táctil
  playMarkWithVibration() {
    this.playMarkNumber();
    this.vibrate([30]);
  }

  // Match con vibración más fuerte
  playMatchWithVibration() {
    this.playNumberMatch();
    this.vibrate([50, 30, 50]);
  }

  // Bingo con vibración épica
  playBingoWithVibration() {
    this.playBingoWin();
    this.vibrate([100, 50, 100, 50, 200]);
  }
}

export const SoundService = new SoundServiceClass();
