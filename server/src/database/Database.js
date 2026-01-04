/**
 * 💾 Database Service
 * Persistencia con SQLite usando better-sqlite3
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseService {
  constructor() {
    this.db = null;
  }

  /**
   * Inicializa la conexión a la base de datos
   * @param {string} dbPath - Ruta al archivo .db (opcional)
   */
  init(dbPath = null) {
    const defaultPath = path.join(__dirname, '../../data/bingo.db');
    this.db = new Database(dbPath || defaultPath);
    
    // Habilitar WAL mode para mejor rendimiento
    this.db.pragma('journal_mode = WAL');
    
    // Crear tablas si no existen
    this._createTables();
    
    console.log('💾 Base de datos SQLite inicializada');
  }

  /**
   * Crea las tablas necesarias
   * @private
   */
  _createTables() {
    this.db.exec(`
      -- Tabla de partidas
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        state TEXT DEFAULT 'waiting',
        available_numbers TEXT,
        called_numbers TEXT DEFAULT '[]',
        current_number INTEGER,
        config TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        finished_at DATETIME
      );

      -- Tabla de jugadores
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        name TEXT NOT NULL,
        card TEXT NOT NULL,
        marked_numbers TEXT DEFAULT '[]',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );

      -- Tabla de ganadores (historial)
      CREATE TABLE IF NOT EXISTS winners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        prize_type TEXT NOT NULL,
        won_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id)
      );

      -- Índices para mejor rendimiento
      CREATE INDEX IF NOT EXISTS idx_players_game ON players(game_id);
      CREATE INDEX IF NOT EXISTS idx_winners_game ON winners(game_id);
      CREATE INDEX IF NOT EXISTS idx_games_state ON games(state);
    `);
  }

  // ==========================================
  // OPERACIONES DE PARTIDAS
  // ==========================================

  /**
   * Guarda una nueva partida
   */
  saveGame(game) {
    const stmt = this.db.prepare(`
      INSERT INTO games (id, state, available_numbers, called_numbers, current_number, config, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      game.id,
      game.state,
      JSON.stringify(game.availableNumbers),
      JSON.stringify(game.calledNumbers),
      game.currentNumber,
      JSON.stringify(game.config),
      game.createdAt.toISOString()
    );
  }

  /**
   * Actualiza el estado de una partida
   */
  updateGame(game) {
    const stmt = this.db.prepare(`
      UPDATE games 
      SET state = ?, 
          available_numbers = ?, 
          called_numbers = ?, 
          current_number = ?,
          started_at = ?,
          finished_at = ?
      WHERE id = ?
    `);
    
    stmt.run(
      game.state,
      JSON.stringify(game.availableNumbers),
      JSON.stringify(game.calledNumbers),
      game.currentNumber,
      game.startedAt?.toISOString() || null,
      game.finishedAt?.toISOString() || null,
      game.id
    );
  }

  /**
   * Obtiene una partida por ID
   */
  getGame(gameId) {
    const stmt = this.db.prepare('SELECT * FROM games WHERE id = ?');
    const row = stmt.get(gameId);
    
    if (!row) return null;
    
    return {
      id: row.id,
      state: row.state,
      availableNumbers: JSON.parse(row.available_numbers),
      calledNumbers: JSON.parse(row.called_numbers),
      currentNumber: row.current_number,
      config: JSON.parse(row.config),
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : null,
      finishedAt: row.finished_at ? new Date(row.finished_at) : null
    };
  }

  /**
   * Obtiene partidas activas (no finalizadas)
   */
  getActiveGames() {
    const stmt = this.db.prepare(`
      SELECT * FROM games 
      WHERE state != 'finished' 
      ORDER BY created_at DESC
    `);
    return stmt.all().map(row => ({
      id: row.id,
      state: row.state,
      availableNumbers: JSON.parse(row.available_numbers),
      calledNumbers: JSON.parse(row.called_numbers),
      currentNumber: row.current_number,
      config: JSON.parse(row.config),
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * Elimina una partida y sus jugadores
   */
  deleteGame(gameId) {
    const stmt = this.db.prepare('DELETE FROM games WHERE id = ?');
    stmt.run(gameId);
  }

  // ==========================================
  // OPERACIONES DE JUGADORES
  // ==========================================

  /**
   * Guarda un nuevo jugador (o reemplaza si ya existe)
   */
  savePlayer(player, gameId) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO players (id, game_id, name, card, marked_numbers, joined_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      player.id,
      gameId,
      player.name,
      JSON.stringify(player.card),
      JSON.stringify(player.markedNumbers),
      player.joinedAt.toISOString()
    );
  }

  /**
   * Actualiza los números marcados de un jugador
   */
  updatePlayerMarkedNumbers(playerId, markedNumbers) {
    const stmt = this.db.prepare(`
      UPDATE players SET marked_numbers = ? WHERE id = ?
    `);
    stmt.run(JSON.stringify(markedNumbers), playerId);
  }

  /**
   * Obtiene un jugador por ID
   */
  getPlayer(playerId) {
    const stmt = this.db.prepare('SELECT * FROM players WHERE id = ?');
    const row = stmt.get(playerId);
    
    if (!row) return null;
    
    return {
      id: row.id,
      gameId: row.game_id,
      name: row.name,
      card: JSON.parse(row.card),
      markedNumbers: JSON.parse(row.marked_numbers),
      joinedAt: new Date(row.joined_at)
    };
  }

  /**
   * Obtiene todos los jugadores de una partida
   */
  getPlayersByGame(gameId) {
    const stmt = this.db.prepare('SELECT * FROM players WHERE game_id = ?');
    return stmt.all(gameId).map(row => ({
      id: row.id,
      name: row.name,
      card: JSON.parse(row.card),
      markedNumbers: JSON.parse(row.marked_numbers),
      joinedAt: new Date(row.joined_at)
    }));
  }

  /**
   * Elimina un jugador
   */
  deletePlayer(playerId) {
    const stmt = this.db.prepare('DELETE FROM players WHERE id = ?');
    stmt.run(playerId);
  }

  // ==========================================
  // OPERACIONES DE GANADORES
  // ==========================================

  /**
   * Registra un ganador
   */
  saveWinner(gameId, playerId, playerName, prizeType) {
    const stmt = this.db.prepare(`
      INSERT INTO winners (game_id, player_id, player_name, prize_type)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(gameId, playerId, playerName, prizeType);
  }

  /**
   * Obtiene ganadores de una partida
   */
  getWinnersByGame(gameId) {
    const stmt = this.db.prepare(`
      SELECT * FROM winners WHERE game_id = ? ORDER BY won_at
    `);
    return stmt.all(gameId);
  }

  /**
   * Obtiene historial de ganadores (últimas N partidas)
   */
  getWinnersHistory(limit = 50) {
    const stmt = this.db.prepare(`
      SELECT w.*, g.created_at as game_date
      FROM winners w
      JOIN games g ON w.game_id = g.id
      ORDER BY w.won_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Limpia partidas antiguas (más de X días)
   */
  cleanOldGames(daysOld = 7) {
    const stmt = this.db.prepare(`
      DELETE FROM games 
      WHERE created_at < datetime('now', '-' || ? || ' days')
      AND state = 'finished'
    `);
    const result = stmt.run(daysOld);
    console.log(`🧹 Limpiadas ${result.changes} partidas antiguas`);
    return result.changes;
  }

  /**
   * Obtiene estadísticas generales
   */
  getStats() {
    const totalGames = this.db.prepare('SELECT COUNT(*) as count FROM games').get();
    const activeGames = this.db.prepare("SELECT COUNT(*) as count FROM games WHERE state != 'finished'").get();
    const totalPlayers = this.db.prepare('SELECT COUNT(DISTINCT id) as count FROM players').get();
    const totalWinners = this.db.prepare('SELECT COUNT(*) as count FROM winners').get();
    
    return {
      totalGames: totalGames.count,
      activeGames: activeGames.count,
      totalPlayers: totalPlayers.count,
      totalWinners: totalWinners.count
    };
  }

  /**
   * Cierra la conexión
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('💾 Base de datos cerrada');
    }
  }
}

// Exportar instancia singleton
export const db = new DatabaseService();
