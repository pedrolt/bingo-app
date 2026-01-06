/**
 * 📋 Constantes compartidas
 * Definiciones comunes para servidor y clientes
 */

/**
 * Estados de la partida
 */
export const GAME_STATES = {
  WAITING: 'waiting',     // Esperando jugadores
  PLAYING: 'playing',     // En juego
  PAUSED: 'paused',       // Pausado
  FINISHED: 'finished'    // Finalizado
};

/**
 * Configuración del Bingo 90 (estándar europeo)
 * - 90 números (1-90)
 * - Cartones de 3 filas × 9 columnas
 * - 15 números por cartón (5 por fila)
 */
export const BINGO_CONFIG = {
  MAX_NUMBERS: 90,
  ROWS: 3,
  COLS: 9,
  NUMBERS_PER_ROW: 5,
  TOTAL_NUMBERS_PER_CARD: 15,
  // Tiempo máximo para reconexión (30 minutos)
  RECONNECT_TIMEOUT_MS: 30 * 60 * 1000,
  // Columnas: cada una cubre un rango de 10 números (excepto la última que tiene 11)
  COLUMNS: [
    { index: 0, min: 1, max: 9 },
    { index: 1, min: 10, max: 19 },
    { index: 2, min: 20, max: 29 },
    { index: 3, min: 30, max: 39 },
    { index: 4, min: 40, max: 49 },
    { index: 5, min: 50, max: 59 },
    { index: 6, min: 60, max: 69 },
    { index: 7, min: 70, max: 79 },
    { index: 8, min: 80, max: 90 }
  ]
};

/**
 * Eventos de Socket.io
 */
export const SOCKET_EVENTS = {
  // Partida
  CREATE_GAME: 'game:create',
  JOIN_GAME: 'game:join',
  START_GAME: 'game:start',
  GAME_STARTED: 'game:started',
  GAME_ENDED: 'game:ended',
  
  // Jugadores
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_DISCONNECTED: 'player:disconnected',
  PLAYER_RECONNECTED: 'player:reconnected',
  
  // Reconexión
  RECONNECT: 'game:reconnect',
  RECONNECT_SUCCESS: 'game:reconnect-success',
  RECONNECT_FAILED: 'game:reconnect-failed',
  
  // Juego
  CALL_NUMBER: 'game:call-number',
  NUMBER_CALLED: 'game:number-called',
  MARK_NUMBER: 'game:mark-number',
  
  // Modo automático
  AUTO_MODE_START: 'game:auto-start',
  AUTO_MODE_STOP: 'game:auto-stop',
  AUTO_MODE_CHANGED: 'game:auto-changed',
  AUTO_MODE_SET_INTERVAL: 'game:auto-interval',
  
  // Premios
  CLAIM_LINE: 'game:claim-line',
  CLAIM_BINGO: 'game:claim-bingo',
  LINE_WINNER: 'game:line-winner',
  BINGO_WINNER: 'game:bingo-winner'
};

/**
 * Obtiene el índice de columna para un número (Bingo 90)
 * @param {number} num 
 * @returns {number}
 */
export function getColumnIndex(num) {
  if (num >= 1 && num <= 9) return 0;
  if (num >= 10 && num <= 19) return 1;
  if (num >= 20 && num <= 29) return 2;
  if (num >= 30 && num <= 39) return 3;
  if (num >= 40 && num <= 49) return 4;
  if (num >= 50 && num <= 59) return 5;
  if (num >= 60 && num <= 69) return 6;
  if (num >= 70 && num <= 79) return 7;
  if (num >= 80 && num <= 90) return 8;
  return -1;
}
