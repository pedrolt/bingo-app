/**
 * 🎮 GameManager
 * Gestiona las partidas de Bingo activas
 */

import { v4 as uuidv4 } from 'uuid';
import { BingoGame } from './BingoGame.js';

export class GameManager {
  constructor() {
    /** @type {Map<string, BingoGame>} */
    this.games = new Map();
  }

  /**
   * Crea una nueva partida de Bingo
   * @param {object} options - Opciones de la partida
   * @returns {BingoGame}
   */
  createGame(options = {}) {
    const gameId = uuidv4().substring(0, 8).toUpperCase();
    const game = new BingoGame(gameId, options);
    this.games.set(gameId, game);
    console.log(`🎱 Nueva partida creada: ${gameId}`);
    return game;
  }

  /**
   * Obtiene una partida por su ID
   * @param {string} gameId 
   * @returns {BingoGame|undefined}
   */
  getGame(gameId) {
    return this.games.get(gameId);
  }

  /**
   * Elimina una partida
   * @param {string} gameId 
   */
  removeGame(gameId) {
    this.games.delete(gameId);
    console.log(`🗑️ Partida eliminada: ${gameId}`);
  }

  /**
   * Lista todas las partidas activas
   * @returns {Array}
   */
  listGames() {
    return Array.from(this.games.values()).map(game => game.getInfo());
  }
}
