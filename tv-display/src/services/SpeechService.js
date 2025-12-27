/**
 * 🔊 SpeechService
 * Servicio de voz sintetizada para cantar números de bingo
 */

class SpeechService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.rate = 0.9;  // Velocidad de habla
    this.pitch = 1;   // Tono
    this.volume = 1;  // Volumen
    this.enabled = true;
    
    // Cargar voces cuando estén disponibles
    this.loadVoices();
    
    // En algunos navegadores las voces se cargan asíncronamente
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  /**
   * Carga las voces disponibles y selecciona una en español
   */
  loadVoices() {
    const voices = this.synth.getVoices();
    
    // Buscar voz en español (preferir es-ES)
    this.voice = voices.find(v => v.lang === 'es-ES') ||
                 voices.find(v => v.lang.startsWith('es')) ||
                 voices.find(v => v.lang === 'en-US') ||
                 voices[0];
    
    console.log('🔊 Voz seleccionada:', this.voice?.name);
  }

  /**
   * Obtiene las voces disponibles
   * @returns {SpeechSynthesisVoice[]}
   */
  getVoices() {
    return this.synth.getVoices();
  }

  /**
   * Cambia la voz activa
   * @param {string} voiceName 
   */
  setVoice(voiceName) {
    const voices = this.synth.getVoices();
    this.voice = voices.find(v => v.name === voiceName) || this.voice;
  }

  /**
   * Habilita o deshabilita la voz
   * @param {boolean} enabled 
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Configura la velocidad de habla
   * @param {number} rate - 0.1 a 10
   */
  setRate(rate) {
    this.rate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * Habla un texto
   * @param {string} text 
   * @returns {Promise<void>}
   */
  speak(text) {
    return new Promise((resolve, reject) => {
      if (!this.enabled) {
        resolve();
        return;
      }

      // Cancelar cualquier habla en curso
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.voice;
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.volume = this.volume;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      this.synth.speak(utterance);
    });
  }

  /**
   * Canta un número de bingo
   * @param {number} number 
   */
  async callNumber(number) {
    if (!this.enabled) return;

    // Pequeña pausa dramática antes de cantar
    await this.speak(`¡El ${number}!`);
  }

  /**
   * Anuncia el inicio de la partida
   */
  async announceGameStart() {
    if (!this.enabled) return;
    await this.speak('¡Comienza la partida de bingo! ¡Buena suerte a todos!');
  }

  /**
   * Anuncia un ganador de línea
   * @param {string} playerName 
   */
  async announceLineWinner(playerName) {
    if (!this.enabled) return;
    await this.speak(`¡Línea! ¡${playerName} tiene línea!`);
  }

  /**
   * Anuncia un ganador de bingo
   * @param {string} playerName 
   */
  async announceBingoWinner(playerName) {
    if (!this.enabled) return;
    await this.speak(`¡Bingo! ¡${playerName} ha cantado bingo! ¡Felicidades!`);
  }

  /**
   * Anuncia que un jugador se ha unido
   * @param {string} playerName 
   */
  async announcePlayerJoined(playerName) {
    if (!this.enabled) return;
    await this.speak(`${playerName} se ha unido a la partida`);
  }

  /**
   * Detiene cualquier habla en curso
   */
  stop() {
    this.synth.cancel();
  }
}

// Exportar instancia única (singleton)
export const speechService = new SpeechService();
