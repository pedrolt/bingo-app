/**
 * 🎴 CardGenerator
 * Genera cartones de Bingo 90 (estilo europeo)
 * 
 * Formato:
 * - 3 filas × 9 columnas
 * - 15 números por cartón (5 por fila)
 * - Columnas: 1-9, 10-19, 20-29, ..., 80-90
 */

import { BINGO_CONFIG } from '../../shared/constants.js';

/**
 * Genera un cartón de bingo 90 aleatorio
 * @returns {(number|null)[][]} Matriz 3x9 del cartón (null = casilla vacía)
 */
export function generateCard() {
  const { ROWS, COLS, NUMBERS_PER_ROW, COLUMNS } = BINGO_CONFIG;
  
  // Inicializar cartón vacío (3 filas x 9 columnas)
  const card = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  
  // Para cada columna, obtener números disponibles
  const columnNumbers = COLUMNS.map(col => {
    const numbers = [];
    for (let i = col.min; i <= col.max; i++) {
      numbers.push(i);
    }
    return shuffle(numbers);
  });
  
  // Determinar cuántos números van en cada columna (total 15, 5 por fila)
  // Cada columna puede tener 0, 1, 2 o 3 números
  const numbersPerColumn = distributeNumbersToColumns();
  
  // Colocar números en cada columna
  for (let col = 0; col < COLS; col++) {
    const count = numbersPerColumn[col];
    if (count === 0) continue;
    
    // Seleccionar qué filas tendrán números en esta columna
    const availableRows = [0, 1, 2];
    const selectedRows = shuffle(availableRows).slice(0, count).sort((a, b) => a - b);
    
    // Colocar números ordenados de menor a mayor de arriba a abajo
    const selectedNumbers = columnNumbers[col].slice(0, count).sort((a, b) => a - b);
    
    for (let i = 0; i < count; i++) {
      card[selectedRows[i]][col] = selectedNumbers[i];
    }
  }
  
  // Verificar y ajustar para que cada fila tenga exactamente 5 números
  for (let row = 0; row < ROWS; row++) {
    const numbersInRow = card[row].filter(n => n !== null).length;
    
    if (numbersInRow !== NUMBERS_PER_ROW) {
      // Regenerar si no cumple la regla
      return generateCard();
    }
  }
  
  return card;
}

/**
 * Distribuye 15 números entre 9 columnas asegurando 5 números por fila
 * @returns {number[]} Array con cantidad de números por columna
 */
function distributeNumbersToColumns() {
  // Necesitamos 15 números totales, distribuidos en 9 columnas
  // Cada fila debe tener exactamente 5 números
  // Intentamos una distribución válida
  
  let distribution;
  let attempts = 0;
  
  do {
    distribution = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let remaining = 15;
    
    // Distribuir aleatoriamente
    while (remaining > 0) {
      const col = Math.floor(Math.random() * 9);
      // Máximo 3 números por columna (una por fila)
      if (distribution[col] < 3) {
        distribution[col]++;
        remaining--;
      }
    }
    
    attempts++;
  } while (!isValidDistribution(distribution) && attempts < 100);
  
  return distribution;
}

/**
 * Verifica si una distribución permite 5 números por fila
 * @param {number[]} dist 
 * @returns {boolean}
 */
function isValidDistribution(dist) {
  // Verificar que hay al menos 5 columnas con números
  const columnsWithNumbers = dist.filter(n => n > 0).length;
  return columnsWithNumbers >= 5 && dist.reduce((a, b) => a + b, 0) === 15;
}

/**
 * Baraja un array (Fisher-Yates)
 * @param {any[]} array 
 * @returns {any[]}
 */
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Formatea un cartón para visualización en consola
 * @param {(number|null)[][]} card 
 * @returns {string}
 */
export function formatCardForConsole(card) {
  const separator = '+----+----+----+----+----+----+----+----+----+';
  
  let output = separator + '\n';
  
  for (const row of card) {
    const cells = row.map(n => {
      if (n === null) return '    ';
      return n.toString().padStart(2, ' ') + '  ';
    });
    output += '|' + cells.join('|') + '|\n';
    output += separator + '\n';
  }
  
  return output;
}
