/**
 * 🎵 SoundService
 * Servicio de efectos de sonido para el Bingo
 * Usa la Web Audio API para generar sonidos sintéticos
 */

class SoundServiceClass {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.5;
    this.initialized = false;
  }

  /**
   * Inicializa el contexto de audio (debe llamarse tras interacción del usuario)
   */
  init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('🎵 SoundService inicializado');
    } catch (e) {
      console.warn('🎵 Web Audio API no soportada:', e);
    }
  }

  /**
   * Habilita o deshabilita los sonidos
   * @param {boolean} enabled 
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Configura el volumen
   * @param {number} volume - 0 a 1
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Reproduce un tono simple
   * @param {number} frequency - Frecuencia en Hz
   * @param {number} duration - Duración en segundos
   * @param {string} type - Tipo de onda: 'sine', 'square', 'sawtooth', 'triangle'
   * @param {number} volume - Volumen opcional (0-1)
   */
  playTone(frequency, duration, type = 'sine', volume = null) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    const vol = (volume !== null ? volume : this.volume) * 0.3;
    gainNode.gain.setValueAtTime(vol, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Sonido de bombo girando / sacando bola
   */
  playDrumRoll() {
    if (!this.enabled) return;
    this.init();

    // Secuencia rápida de tonos simulando el bombo
    const notes = [200, 250, 200, 300, 200, 250, 350, 400];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.08, 'triangle', 0.3);
      }, i * 60);
    });
  }

  /**
   * Sonido al sacar un número
   */
  playNumberCalled() {
    if (!this.enabled) return;
    this.init();

    // Sonido de "ding" agradable
    this.playTone(880, 0.15, 'sine', 0.4);
    setTimeout(() => {
      this.playTone(1100, 0.2, 'sine', 0.3);
    }, 100);
  }

  /**
   * Sonido al marcar número en el cartón
   */
  playMarkNumber() {
    if (!this.enabled) return;
    this.init();

    // Click suave
    this.playTone(600, 0.05, 'square', 0.2);
  }

  /**
   * Sonido cuando un número del cartón es cantado
   */
  playNumberMatch() {
    if (!this.enabled) return;
    this.init();

    // Dos tonos ascendentes
    this.playTone(440, 0.1, 'sine', 0.3);
    setTimeout(() => {
      this.playTone(550, 0.15, 'sine', 0.3);
    }, 80);
  }

  /**
   * Sonido de línea ganada
   */
  playLineWin() {
    if (!this.enabled) return;
    this.init();

    // Fanfarria corta
    const melody = [523, 659, 784, 1047]; // Do-Mi-Sol-Do
    melody.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', 0.4);
      }, i * 150);
    });
  }

  /**
   * Sonido de BINGO ganado
   */
  playBingoWin() {
    if (!this.enabled) return;
    this.init();

    // Fanfarria épica
    const melody = [
      { freq: 523, delay: 0 },     // Do
      { freq: 659, delay: 150 },   // Mi
      { freq: 784, delay: 300 },   // Sol
      { freq: 1047, delay: 450 },  // Do alto
      { freq: 784, delay: 600 },   // Sol
      { freq: 1047, delay: 750 },  // Do alto
      { freq: 1319, delay: 900 },  // Mi alto
    ];

    melody.forEach(({ freq, delay }) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.5);
        this.playTone(freq * 0.5, 0.3, 'sine', 0.2); // Bajo
      }, delay);
    });
  }

  /**
   * Sonido de inicio de partida
   */
  playGameStart() {
    if (!this.enabled) return;
    this.init();

    // Tres tonos ascendentes
    const notes = [440, 554, 659];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'triangle', 0.4);
      }, i * 200);
    });
  }

  /**
   * Sonido de jugador uniéndose
   */
  playPlayerJoined() {
    if (!this.enabled) return;
    this.init();

    this.playTone(800, 0.1, 'sine', 0.2);
    setTimeout(() => {
      this.playTone(1000, 0.15, 'sine', 0.25);
    }, 100);
  }

  /**
   * Sonido de error / rechazo
   */
  playError() {
    if (!this.enabled) return;
    this.init();

    this.playTone(200, 0.2, 'square', 0.3);
    setTimeout(() => {
      this.playTone(150, 0.3, 'square', 0.25);
    }, 150);
  }

  /**
   * Sonido de cuenta regresiva
   */
  playCountdown() {
    if (!this.enabled) return;
    this.init();

    this.playTone(440, 0.1, 'sine', 0.3);
  }

  /**
   * Sonido de click de botón
   */
  playClick() {
    if (!this.enabled) return;
    this.init();

    this.playTone(1000, 0.03, 'square', 0.15);
  }
}

// Singleton
export const SoundService = new SoundServiceClass();
