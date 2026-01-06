/**
 * 🎱 BingoGame
 * Representa una partida de Bingo con persistencia y reconexión
 */

import { v4 as uuidv4 } from 'uuid';
import { generateCard } from './CardGenerator.js';
import { GAME_STATES, BINGO_CONFIG } from '../../shared/constants.js';
import { db } from '../database/Database.js';

export class BingoGame {
  /**
   * @param {string} id - ID único de la partida
   * @param {object} options - Opciones de configuración
   */
  constructor(id, options = {}) {
    this.id = id;
    this.state = GAME_STATES.WAITING;
    this.createdAt = new Date();
    this.startedAt = null;
    this.finishedAt = null;
    
    // Configuración
    this.config = {
      maxNumbers: options.maxNumbers || BINGO_CONFIG.MAX_NUMBERS,
      autoMark: options.autoMark !== false,
      reconnectTimeout: options.reconnectTimeout || BINGO_CONFIG.RECONNECT_TIMEOUT_MS,
      ...options
    };

    // Jugadores y cartones
    /** @type {Map<string, object>} */
    this.players = new Map();
    
    // Jugadores desconectados (mapa temporal para reconexión rápida)
    /** @type {Map<string, object>} */
    this.disconnectedPlayers = new Map();
    
    // Números
    this.availableNumbers = this._initializeNumbers();
    this.calledNumbers = [];
    this.currentNumber = null;
    
    // Ganadores
    this.winners = {
      line: null,
      bingo: null
    };

    // Modo automático
    this.autoMode = {
      enabled: false,
      interval: 5000, // 5 segundos por defecto
      timerId: null
    };
  }

  /**
   * Crea una instancia desde datos de la base de datos
   * @param {object} data - Datos de la BD
   * @returns {BingoGame}
   */
  static fromDatabase(data) {
    const game = new BingoGame(data.id, data.config);
    game.state = data.state;
    game.availableNumbers = data.availableNumbers;
    game.calledNumbers = data.calledNumbers;
    game.currentNumber = data.currentNumber;
    game.createdAt = data.createdAt;
    game.startedAt = data.startedAt;
    game.finishedAt = data.finishedAt;
    return game;
  }

  /**
   * Restaura un jugador desde la base de datos
   * @param {object} playerData - Datos del jugador
   */
  restorePlayer(playerData) {
    const player = {
      id: playerData.id,
      name: playerData.name,
      card: playerData.card,
      markedNumbers: playerData.markedNumbers,
      joinedAt: playerData.joinedAt,
      isConnected: playerData.isConnected !== false,
      reconnectToken: playerData.reconnectToken || null
    };
    
    if (player.isConnected) {
      this.players.set(playerData.id, player);
    } else {
      // Jugador desconectado - guardarlo para posible reconexión
      this.disconnectedPlayers.set(playerData.id, player);
    }
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
   * Genera un token de reconexión único
   * @private
   */
  _generateReconnectToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }

  /**
   * Añade un jugador a la partida
   * @param {string} socketId - ID del socket
   * @param {string} name - Nombre del jugador
   * @returns {object} - Información del jugador
   */
  addPlayer(socketId, name) {
    const reconnectToken = this._generateReconnectToken();
    
    const player = {
      id: socketId,
      name: name || `Jugador ${this.players.size + 1}`,
      card: generateCard(),
      markedNumbers: [],
      joinedAt: new Date(),
      isConnected: true,
      reconnectToken
    };
    
    this.players.set(socketId, player);
    
    // Persistir jugador en BD con token de reconexión
    db.savePlayer(player, this.id);
    
    console.log(`👤 Jugador "${player.name}" se unió a la partida ${this.id}`);
    return player;
  }

  /**
   * Marca un jugador como desconectado (NO lo elimina)
   * Permite reconexión posterior
   * @param {string} socketId 
   * @returns {object|null} - Datos del jugador desconectado
   */
  disconnectPlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return null;

    player.isConnected = false;
    player.disconnectedAt = new Date();
    
    // Mover a lista de desconectados
    this.disconnectedPlayers.set(socketId, player);
    this.players.delete(socketId);
    
    // Marcar como desconectado en BD (genera token si no existe)
    const token = db.markPlayerDisconnected(socketId);
    if (token && !player.reconnectToken) {
      player.reconnectToken = token;
    }
    
    console.log(`📴 Jugador "${player.name}" desconectado de la partida ${this.id} (puede reconectarse)`);
    return player;
  }

  /**
   * Reconecta un jugador usando su token
   * @param {string} reconnectToken - Token de reconexión
   * @param {string} newSocketId - Nuevo ID del socket
   * @returns {object|null} - Datos del jugador reconectado
   */
  reconnectPlayerByToken(reconnectToken, newSocketId) {
    // Buscar en jugadores desconectados locales
    for (const [oldId, player] of this.disconnectedPlayers) {
      if (player.reconnectToken === reconnectToken) {
        return this._performReconnection(oldId, newSocketId, player);
      }
    }
    
    // Buscar en base de datos
    const playerData = db.getPlayerByReconnectToken(reconnectToken);
    if (playerData && playerData.gameId === this.id) {
      return this._performReconnection(playerData.id, newSocketId, playerData);
    }
    
    return null;
  }

  /**
   * Reconecta un jugador por nombre (fallback)
   * @param {string} playerName - Nombre del jugador
   * @param {string} newSocketId - Nuevo ID del socket
   * @returns {object|null} - Datos del jugador reconectado
   */
  reconnectPlayerByName(playerName, newSocketId) {
    // Buscar en jugadores desconectados locales
    for (const [oldId, player] of this.disconnectedPlayers) {
      if (player.name.toLowerCase() === playerName.toLowerCase()) {
        return this._performReconnection(oldId, newSocketId, player);
      }
    }
    
    // Buscar en base de datos
    const playerData = db.getPlayerByNameInGame(this.id, playerName);
    if (playerData) {
      return this._performReconnection(playerData.id, newSocketId, playerData);
    }
    
    return null;
  }

  /**
   * Realiza la reconexión de un jugador
   * @private
   */
  _performReconnection(oldSocketId, newSocketId, playerData) {
    // Actualizar ID del jugador
    const player = {
      ...playerData,
      id: newSocketId,
      isConnected: true,
      disconnectedAt: null
    };
    
    // Actualizar en memoria
    this.disconnectedPlayers.delete(oldSocketId);
    this.players.set(newSocketId, player);
    
    // Actualizar en base de datos
    db.updatePlayerId(oldSocketId, newSocketId);
    db.markPlayerConnected(newSocketId);
    
    console.log(`🔄 Jugador "${player.name}" reconectado a la partida ${this.id}`);
    return player;
  }

  /**
   * Elimina un jugador de la partida permanentemente
   * @param {string} socketId 
   */
  removePlayer(socketId) {
    const player = this.players.get(socketId) || this.disconnectedPlayers.get(socketId);
    if (player) {
      console.log(`👤 Jugador "${player.name}" eliminado de la partida ${this.id}`);
      this.players.delete(socketId);
      this.disconnectedPlayers.delete(socketId);
      
      // Eliminar de BD permanentemente
      db.deletePlayer(socketId);
    }
  }

  /**
   * Obtiene el número total de jugadores (conectados + desconectados)
   */
  getTotalPlayersCount() {
    return this.players.size + this.disconnectedPlayers.size;
  }

  /**
   * Obtiene el número de jugadores conectados
   */
  getConnectedPlayersCount() {
    return this.players.size;
  }

  /**
   * Inicia la partida
   */
  start() {
    if (this.state !== GAME_STATES.WAITING) {
      throw new Error('La partida ya ha comenzado');
    }
    this.state = GAME_STATES.PLAYING;
    this.startedAt = new Date();
    
    // Persistir cambio de estado
    db.updateGame(this);
    
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
      this.finishedAt = new Date();
      db.updateGame(this);
      return null;
    }

    this.currentNumber = this.availableNumbers.pop();
    this.calledNumbers.push(this.currentNumber);
    
    // Persistir estado del juego
    db.updateGame(this);
    
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
      
      // Persistir números marcados
      db.updatePlayerMarkedNumbers(playerId, player.markedNumbers);
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

    // Verificar cada fila del cartón (Bingo 90: 5 números por fila)
    for (const row of player.card) {
      const rowNumbers = row.filter(n => n !== null); // Ignorar casillas vacías
      const allMarked = rowNumbers.every(n => player.markedNumbers.includes(n));
      if (allMarked && rowNumbers.length === 5) return true;
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

    // Todos los números del cartón (15 números) deben estar marcados
    for (const row of player.card) {
      for (const num of row) {
        if (num !== null && !player.markedNumbers.includes(num)) {
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
      disconnectedCount: this.disconnectedPlayers.size,
      totalPlayers: this.getTotalPlayersCount(),
      calledNumbers: this.calledNumbers,
      currentNumber: this.currentNumber,
      remainingNumbers: this.availableNumbers.length,
      createdAt: this.createdAt,
      autoMode: {
        enabled: this.autoMode.enabled,
        interval: this.autoMode.interval
      }
    };
  }

  /**
   * Obtiene el estado completo para la pantalla TV
   * @returns {object}
   */
  getTVState() {
    // Incluir jugadores conectados y desconectados
    const connectedPlayers = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      isConnected: true
    }));
    
    const disconnectedPlayers = Array.from(this.disconnectedPlayers.values()).map(p => ({
      id: p.id,
      name: p.name,
      isConnected: false
    }));
    
    return {
      id: this.id,
      state: this.state,
      players: [...connectedPlayers, ...disconnectedPlayers],
      calledNumbers: this.calledNumbers,
      currentNumber: this.currentNumber,
      winners: this.winners,
      autoMode: {
        enabled: this.autoMode.enabled,
        interval: this.autoMode.interval
      }
    };
  }

  // ==========================================
  // MODO AUTOMÁTICO
  // ==========================================

  /**
   * Activa el modo automático
   * @param {number} interval - Intervalo en milisegundos
   * @param {function} onNumberCalled - Callback cuando se canta un número
   */
  startAutoMode(interval, onNumberCalled) {
    if (this.state !== GAME_STATES.PLAYING) {
      return false;
    }

    this.autoMode.enabled = true;
    this.autoMode.interval = interval || this.autoMode.interval;

    // Limpiar timer anterior si existe
    if (this.autoMode.timerId) {
      clearInterval(this.autoMode.timerId);
    }

    // Crear nuevo timer
    this.autoMode.timerId = setInterval(() => {
      if (this.state !== GAME_STATES.PLAYING || !this.autoMode.enabled) {
        this.stopAutoMode();
        return;
      }

      const number = this.callNextNumber();
      if (number === null) {
        this.stopAutoMode();
        return;
      }

      if (onNumberCalled) {
        onNumberCalled(number, this.calledNumbers);
      }
    }, this.autoMode.interval);

    console.log(`🤖 Modo automático activado: ${this.autoMode.interval}ms`);
    return true;
  }

  /**
   * Desactiva el modo automático
   */
  stopAutoMode() {
    this.autoMode.enabled = false;
    
    if (this.autoMode.timerId) {
      clearInterval(this.autoMode.timerId);
      this.autoMode.timerId = null;
    }

    console.log(`🤖 Modo automático desactivado`);
    return true;
  }

  /**
   * Cambia el intervalo del modo automático
   * @param {number} interval - Nuevo intervalo en ms
   */
  setAutoInterval(interval) {
    this.autoMode.interval = Math.max(2000, Math.min(30000, interval)); // Entre 2s y 30s
    return this.autoMode.interval;
  }
}
