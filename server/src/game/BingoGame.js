/**
 * 🎱 BingoGame
 * Representa una partida de Bingo
 */

import { v4 as uuidv4 } from 'uuid';
import { generateCard } from './CardGenerator.js';
import { GAME_STATES, BINGO_CONFIG } from '../../shared/constants.js';

export class BingoGame {
  /**
   * @param {string} id - ID único de la partida
   * @param {object} options - Opciones de configuración
   */
  constructor(id, options = {}) {
    this.id = id;
    this.state = GAME_STATES.WAITING;
    this.createdAt = new Date();
    
    // Configuración
    this.config = {
      maxNumbers: options.maxNumbers || BINGO_CONFIG.MAX_NUMBERS,
      autoMark: options.autoMark !== false,
      ...options
    };

    // Jugadores y cartones
    /** @type {Map<string, object>} */
    this.players = new Map();
    
    // Números
    this.availableNumbers = this._initializeNumbers();
    this.calledNumbers = [];
    this.currentNumber = null;
    
    // Ganadores
    this.winners = {
      line: null,
      bingo: null
    };
  }

  /**
   * Inicializa el array de números disponibles
   * @private
   */
  _initializeNumbers() {
    const numbers = [];
    for (let i = 1; i <= this.config.maxNumbers; i++) {
      numbers.push(i);
    }
    return this._shuffle(numbers);
  }

  /**
   * Baraja un array (Fisher-Yates)
   * @private
   */
  _shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Añade un jugador a la partida
   * @param {string} socketId - ID del socket
   * @param {string} name - Nombre del jugador
   * @returns {object} - Información del jugador
   */
  addPlayer(socketId, name) {
    const player = {
      id: socketId,
      name: name || `Jugador ${this.players.size + 1}`,
      card: generateCard(),
      markedNumbers: [],
      joinedAt: new Date()
    };
    
    this.players.set(socketId, player);
    console.log(`👤 Jugador "${player.name}" se unió a la partida ${this.id}`);
    return player;
  }

  /**
   * Elimina un jugador de la partida
   * @param {string} socketId 
   */
  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      console.log(`👤 Jugador "${player.name}" salió de la partida ${this.id}`);
      this.players.delete(socketId);
    }
  }

  /**
   * Inicia la partida
   */
  start() {
    if (this.state !== GAME_STATES.WAITING) {
      throw new Error('La partida ya ha comenzado');
    }
    this.state = GAME_STATES.PLAYING;
    console.log(`🎮 Partida ${this.id} iniciada`);
  }

  /**
   * Canta el siguiente número
   * @returns {number|null}
   */
  callNextNumber() {
    if (this.state !== GAME_STATES.PLAYING) {
      return null;
    }
    
    if (this.availableNumbers.length === 0) {
      this.state = GAME_STATES.FINISHED;
      return null;
    }

    this.currentNumber = this.availableNumbers.pop();
    this.calledNumbers.push(this.currentNumber);
    
    console.log(`🔢 Número cantado: ${this.currentNumber}`);
    return this.currentNumber;
  }

  /**
   * Marca un número en el cartón de un jugador
   * @param {string} playerId 
   * @param {number} number 
   */
  markNumber(playerId, number) {
    const player = this.players.get(playerId);
    if (!player) return false;

    if (!this.calledNumbers.includes(number)) {
      return false; // El número no ha sido cantado
    }

    if (!player.markedNumbers.includes(number)) {
      player.markedNumbers.push(number);
    }
    return true;
  }

  /**
   * Verifica si un jugador tiene línea
   * @param {string} playerId 
   * @returns {boolean}
   */
  checkLine(playerId) {
    const player = this.players.get(playerId);
    if (!player) return false;

    // Verificar cada fila del cartón
    for (const row of player.card) {
      const rowNumbers = row.filter(n => n !== 0); // Ignorar casilla libre
      const allMarked = rowNumbers.every(n => player.markedNumbers.includes(n));
      if (allMarked) return true;
    }
    return false;
  }

  /**
   * Verifica si un jugador tiene bingo completo
   * @param {string} playerId 
   * @returns {boolean}
   */
  checkBingo(playerId) {
    const player = this.players.get(playerId);
    if (!player) return false;

    // Todos los números del cartón (excepto 0) deben estar marcados
    for (const row of player.card) {
      for (const num of row) {
        if (num !== 0 && !player.markedNumbers.includes(num)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Obtiene información de la partida
   * @returns {object}
   */
  getInfo() {
    return {
      id: this.id,
      state: this.state,
      playersCount: this.players.size,
      calledNumbers: this.calledNumbers,
      currentNumber: this.currentNumber,
      remainingNumbers: this.availableNumbers.length,
      createdAt: this.createdAt
    };
  }

  /**
   * Obtiene el estado completo para la pantalla TV
   * @returns {object}
   */
  getTVState() {
    return {
      id: this.id,
      state: this.state,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name
      })),
      calledNumbers: this.calledNumbers,
      currentNumber: this.currentNumber,
      winners: this.winners
    };
  }
}
