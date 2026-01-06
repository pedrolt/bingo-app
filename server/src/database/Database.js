/**
 * 💾 Database Service
 * Persistencia con SQLite usando better-sqlite3
 * Con soporte para transacciones y reconexión de jugadores
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
    
    // Habilitar foreign keys
    this.db.pragma('foreign_keys = ON');
    
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

      -- Tabla de jugadores (con soporte para reconexión)
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        name TEXT NOT NULL,
        card TEXT NOT NULL,
        marked_numbers TEXT DEFAULT '[]',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        disconnected_at DATETIME,
        is_connected INTEGER DEFAULT 1,
        reconnect_token TEXT UNIQUE,
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
      CREATE INDEX IF NOT EXISTS idx_players_token ON players(reconnect_token);
      CREATE INDEX IF NOT EXISTS idx_winners_game ON winners(game_id);
      CREATE INDEX IF NOT EXISTS idx_games_state ON games(state);
    `);
    
    // Migrar tabla existente si falta columnas nuevas
    this._migratePlayersTable();
  }

  /**
   * Migra la tabla de jugadores para añadir columnas de reconexión
   * @private
   */
  _migratePlayersTable() {
    try {
      // Verificar si las columnas existen
      const tableInfo = this.db.prepare("PRAGMA table_info(players)").all();
      const columns = tableInfo.map(col => col.name);
      
      if (!columns.includes('disconnected_at')) {
        this.db.exec('ALTER TABLE players ADD COLUMN disconnected_at DATETIME');
      }
      if (!columns.includes('is_connected')) {
        this.db.exec('ALTER TABLE players ADD COLUMN is_connected INTEGER DEFAULT 1');
      }
      if (!columns.includes('reconnect_token')) {
        this.db.exec('ALTER TABLE players ADD COLUMN reconnect_token TEXT UNIQUE');
      }
    } catch (error) {
      // Las columnas ya existen o la tabla es nueva
    }
  }

  // ==========================================
  // TRANSACCIONES
  // ==========================================

  /**
   * Ejecuta una función dentro de una transacción
   * @param {Function} fn - Función a ejecutar
   * @returns {*} - Resultado de la función
   */
  transaction(fn) {
    return this.db.transaction(fn)();
  }

  /**
   * Crea una transacción reutilizable
   * @param {Function} fn - Función a ejecutar
   * @returns {Function} - Función transaccional
   */
  createTransaction(fn) {
    return this.db.transaction(fn);
  }

  // ==========================================
  // OPERACIONES DE PARTIDAS (CON TRANSACCIONES)
  // ==========================================

  /**
   * Guarda una nueva partida (transaccional)
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
   * Guarda partida y jugadores en una transacción
   * @param {object} game - Partida
   * @param {object[]} players - Jugadores
   */
  saveGameWithPlayers(game, players) {
    const saveGameStmt = this.db.prepare(`
      INSERT OR REPLACE INTO games (id, state, available_numbers, called_numbers, current_number, config, created_at, started_at, finished_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const savePlayerStmt = this.db.prepare(`
      INSERT OR REPLACE INTO players (id, game_id, name, card, marked_numbers, joined_at, is_connected, reconnect_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = this.db.transaction((game, players) => {
      saveGameStmt.run(
        game.id,
        game.state,
        JSON.stringify(game.availableNumbers),
        JSON.stringify(game.calledNumbers),
        game.currentNumber,
        JSON.stringify(game.config),
        game.createdAt.toISOString(),
        game.startedAt?.toISOString() || null,
        game.finishedAt?.toISOString() || null
      );
      
      for (const player of players) {
        savePlayerStmt.run(
          player.id,
          game.id,
          player.name,
          JSON.stringify(player.card),
          JSON.stringify(player.markedNumbers),
          player.joinedAt.toISOString(),
          player.isConnected ? 1 : 0,
          player.reconnectToken || null
        );
      }
    });
    
    transaction(game, players);
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
  // OPERACIONES DE JUGADORES (CON RECONEXIÓN)
  // ==========================================

  /**
   * Guarda un nuevo jugador con token de reconexión
   */
  savePlayer(player, gameId) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO players (id, game_id, name, card, marked_numbers, joined_at, is_connected, reconnect_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      player.id,
      gameId,
      player.name,
      JSON.stringify(player.card),
      JSON.stringify(player.markedNumbers),
      player.joinedAt.toISOString(),
      1, // is_connected
      player.reconnectToken || null
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
   * Marca un jugador como desconectado (NO lo elimina)
   * @param {string} playerId 
   * @returns {string|null} Token de reconexión
   */
  markPlayerDisconnected(playerId) {
    // Generar token de reconexión si no existe
    const token = this.generateReconnectToken();
    
    const stmt = this.db.prepare(`
      UPDATE players 
      SET is_connected = 0, 
          disconnected_at = datetime('now'),
          reconnect_token = COALESCE(reconnect_token, ?)
      WHERE id = ?
    `);
    stmt.run(token, playerId);
    
    // Obtener el token actual (puede ser uno existente)
    const player = this.getPlayer(playerId);
    return player?.reconnectToken || token;
  }

  /**
   * Marca un jugador como conectado
   * @param {string} playerId 
   */
  markPlayerConnected(playerId) {
    const stmt = this.db.prepare(`
      UPDATE players 
      SET is_connected = 1, 
          disconnected_at = NULL
      WHERE id = ?
    `);
    stmt.run(playerId);
  }

  /**
   * Actualiza el ID del socket de un jugador (para reconexión)
   * @param {string} oldPlayerId - ID anterior del socket
   * @param {string} newPlayerId - Nuevo ID del socket
   */
  updatePlayerId(oldPlayerId, newPlayerId) {
    const stmt = this.db.prepare(`
      UPDATE players SET id = ?, is_connected = 1, disconnected_at = NULL WHERE id = ?
    `);
    stmt.run(newPlayerId, oldPlayerId);
    
    // También actualizar referencias en winners si existen
    const updateWinners = this.db.prepare(`
      UPDATE winners SET player_id = ? WHERE player_id = ?
    `);
    updateWinners.run(newPlayerId, oldPlayerId);
  }

  /**
   * Busca un jugador por token de reconexión
   * @param {string} token 
   * @returns {object|null}
   */
  getPlayerByReconnectToken(token) {
    const stmt = this.db.prepare(`
      SELECT p.*, g.state as game_state 
      FROM players p
      JOIN games g ON p.game_id = g.id
      WHERE p.reconnect_token = ?
    `);
    const row = stmt.get(token);
    
    if (!row) return null;
    
    return {
      id: row.id,
      gameId: row.game_id,
      name: row.name,
      card: JSON.parse(row.card),
      markedNumbers: JSON.parse(row.marked_numbers),
      joinedAt: new Date(row.joined_at),
      isConnected: row.is_connected === 1,
      reconnectToken: row.reconnect_token,
      disconnectedAt: row.disconnected_at ? new Date(row.disconnected_at) : null,
      gameState: row.game_state
    };
  }

  /**
   * Busca un jugador por nombre en una partida específica
   * @param {string} gameId 
   * @param {string} playerName 
   * @returns {object|null}
   */
  getPlayerByNameInGame(gameId, playerName) {
    const stmt = this.db.prepare(`
      SELECT * FROM players 
      WHERE game_id = ? AND name = ? AND is_connected = 0
    `);
    const row = stmt.get(gameId, playerName);
    
    if (!row) return null;
    
    return {
      id: row.id,
      gameId: row.game_id,
      name: row.name,
      card: JSON.parse(row.card),
      markedNumbers: JSON.parse(row.marked_numbers),
      joinedAt: new Date(row.joined_at),
      isConnected: row.is_connected === 1,
      reconnectToken: row.reconnect_token,
      disconnectedAt: row.disconnected_at ? new Date(row.disconnected_at) : null
    };
  }

  /**
   * Genera un token único de reconexión
   * @returns {string}
   */
  generateReconnectToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
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
      joinedAt: new Date(row.joined_at),
      isConnected: row.is_connected === 1,
      reconnectToken: row.reconnect_token,
      disconnectedAt: row.disconnected_at ? new Date(row.disconnected_at) : null
    };
  }

  /**
   * Obtiene todos los jugadores de una partida (incluyendo desconectados)
   */
  getPlayersByGame(gameId, includeDisconnected = true) {
    const stmt = this.db.prepare(
      includeDisconnected 
        ? 'SELECT * FROM players WHERE game_id = ?'
        : 'SELECT * FROM players WHERE game_id = ? AND is_connected = 1'
    );
    return stmt.all(gameId).map(row => ({
      id: row.id,
      name: row.name,
      card: JSON.parse(row.card),
      markedNumbers: JSON.parse(row.marked_numbers),
      joinedAt: new Date(row.joined_at),
      isConnected: row.is_connected === 1,
      reconnectToken: row.reconnect_token,
      disconnectedAt: row.disconnected_at ? new Date(row.disconnected_at) : null
    }));
  }

  /**
   * Elimina un jugador permanentemente
   */
  deletePlayer(playerId) {
    const stmt = this.db.prepare('DELETE FROM players WHERE id = ?');
    stmt.run(playerId);
  }

  /**
   * Limpia jugadores desconectados después de X minutos
   * @param {number} minutesOld - Minutos desde la desconexión
   */
  cleanDisconnectedPlayers(minutesOld = 30) {
    const stmt = this.db.prepare(`
      DELETE FROM players 
      WHERE is_connected = 0 
      AND disconnected_at < datetime('now', '-' || ? || ' minutes')
    `);
    const result = stmt.run(minutesOld);
    if (result.changes > 0) {
      console.log(`🧹 Limpiados ${result.changes} jugadores desconectados`);
    }
    return result.changes;
  }

  // ==========================================
  // OPERACIONES DE GANADORES (CON TRANSACCIONES)
  // ==========================================

  /**
   * Registra un ganador (transaccional con actualización de partida)
   */
  saveWinner(gameId, playerId, playerName, prizeType) {
    const insertWinner = this.db.prepare(`
      INSERT INTO winners (game_id, player_id, player_name, prize_type)
      VALUES (?, ?, ?, ?)
    `);
    insertWinner.run(gameId, playerId, playerName, prizeType);
  }

  /**
   * Registra un ganador y actualiza el estado del juego en una transacción
   * @param {string} gameId 
   * @param {string} playerId 
   * @param {string} playerName 
   * @param {string} prizeType - 'line' o 'bingo'
   * @param {object} game - Estado del juego actualizado
   */
  saveWinnerWithGameUpdate(gameId, playerId, playerName, prizeType, game) {
    const transaction = this.db.transaction(() => {
      // Insertar ganador
      const insertWinner = this.db.prepare(`
        INSERT INTO winners (game_id, player_id, player_name, prize_type)
        VALUES (?, ?, ?, ?)
      `);
      insertWinner.run(gameId, playerId, playerName, prizeType);
      
      // Actualizar estado del juego
      const updateGame = this.db.prepare(`
        UPDATE games 
        SET state = ?, finished_at = ?
        WHERE id = ?
      `);
      updateGame.run(
        game.state,
        game.finishedAt?.toISOString() || null,
        gameId
      );
    });
    
    transaction();
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
