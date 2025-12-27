/**
 * 🎴 CardGenerator
 * Genera cartones de Bingo aleatorios
 * 
 * Formato Bingo 75 (estándar americano):
 * - B: 1-15
 * - I: 16-30
 * - N: 31-45 (centro libre)
 * - G: 46-60
 * - O: 61-75
 */

import { BINGO_CONFIG } from '../../shared/constants.js';

/**
 * Genera un cartón de bingo aleatorio
 * @returns {number[][]} Matriz 5x5 del cartón
 */
export function generateCard() {
  const card = [];
  const columns = BINGO_CONFIG.COLUMNS;

  // Generar cada columna
  for (let col = 0; col < 5; col++) {
    const { min, max } = columns[col];
    const columnNumbers = getRandomNumbers(min, max, 5);
    
    // Añadir números a cada fila
    for (let row = 0; row < 5; row++) {
      if (!card[row]) card[row] = [];
      card[row][col] = columnNumbers[row];
    }
  }

  // Casilla central libre (posición [2][2])
  card[2][2] = 0; // 0 representa casilla libre

  return card;
}

/**
 * Obtiene n números aleatorios únicos en un rango
 * @param {number} min 
 * @param {number} max 
 * @param {number} count 
 * @returns {number[]}
 */
function getRandomNumbers(min, max, count) {
  const numbers = [];
  const available = [];
  
  for (let i = min; i <= max; i++) {
    available.push(i);
  }
  
  // Fisher-Yates shuffle parcial
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    numbers.push(available[randomIndex]);
    available.splice(randomIndex, 1);
  }
  
  return numbers.sort((a, b) => a - b);
}

/**
 * Formatea un cartón para visualización en consola
 * @param {number[][]} card 
 * @returns {string}
 */
export function formatCardForConsole(card) {
  const header = '  B    I    N    G    O';
  const separator = '+----+----+----+----+----+';
  
  let output = header + '\n' + separator + '\n';
  
  for (const row of card) {
    const cells = row.map(n => {
      if (n === 0) return ' ★  ';
      return n.toString().padStart(2, ' ') + '  ';
    });
    output += '|' + cells.join('|') + '|\n';
    output += separator + '\n';
  }
  
  return output;
}
