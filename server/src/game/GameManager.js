/**
 * 🎮 GameManager
 * Gestiona las partidas de Bingo activas con persistencia SQLite
 */

import { v4 as uuidv4 } from 'uuid';
import { BingoGame } from './BingoGame.js';
import { db } from '../database/Database.js';

export class GameManager {
  constructor() {
    /** @type {Map<string, BingoGame>} */
    this.games = new Map();
  }

  /**
   * Inicializa el GameManager y restaura partidas activas
   */
  async init() {
    // Inicializar base de datos
    db.init();
    
    // Restaurar partidas activas desde la BD
    const activeGames = db.getActiveGames();
    for (const gameData of activeGames) {
      const game = BingoGame.fromDatabase(gameData);
      
      // Restaurar jugadores
      const players = db.getPlayersByGame(gameData.id);
      for (const playerData of players) {
        game.restorePlayer(playerData);
      }
      
      // Restaurar ganadores
      const winners = db.getWinnersByGame(gameData.id);
      for (const winner of winners) {
        if (winner.prize_type === 'line') {
          game.winners.line = { id: winner.player_id, name: winner.player_name };
        } else if (winner.prize_type === 'bingo') {
          game.winners.bingo = { id: winner.player_id, name: winner.player_name };
        }
      }
      
      this.games.set(game.id, game);
      console.log(`🔄 Partida restaurada: ${game.id} (${game.players.size} jugadores)`);
    }
    
    console.log(`🎮 GameManager inicializado con ${this.games.size} partidas activas`);
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
    
    // Persistir en BD
    db.saveGame(game);
    
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
    db.deleteGame(gameId);
    console.log(`🗑️ Partida eliminada: ${gameId}`);
  }

  /**
   * Lista todas las partidas activas
   * @returns {Array}
   */
  listGames() {
    return Array.from(this.games.values()).map(game => game.getInfo());
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    return db.getStats();
  }

  /**
   * Limpia partidas antiguas
   */
  cleanOldGames(daysOld = 7) {
    return db.cleanOldGames(daysOld);
  }

  /**
   * Cierra conexiones
   */
  shutdown() {
    db.close();
  }
}
