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
 * Configuración del Bingo 75 (estándar americano)
 */
export const BINGO_CONFIG = {
  MAX_NUMBERS: 75,
  COLUMNS: [
    { letter: 'B', min: 1, max: 15 },
    { letter: 'I', min: 16, max: 30 },
    { letter: 'N', min: 31, max: 45 },
    { letter: 'G', min: 46, max: 60 },
    { letter: 'O', min: 61, max: 75 }
  ],
  CARD_SIZE: 5,
  FREE_SPACE: true
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
  
  // Juego
  CALL_NUMBER: 'game:call-number',
  NUMBER_CALLED: 'game:number-called',
  MARK_NUMBER: 'game:mark-number',
  
  // Premios
  CLAIM_LINE: 'game:claim-line',
  CLAIM_BINGO: 'game:claim-bingo',
  LINE_WINNER: 'game:line-winner',
  BINGO_WINNER: 'game:bingo-winner'
};

/**
 * Obtiene la letra de columna para un número
 * @param {number} num 
 * @returns {string}
 */
export function getColumnLetter(num) {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
}
