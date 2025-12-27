import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColumnIndex } from '../../../server/shared/constants.js';

// Colores para las 9 columnas del Bingo 90
const COLUMN_COLORS = [
  '#e63946',  // 1-9
  '#f4a261',  // 10-19
  '#2a9d8f',  // 20-29
  '#264653',  // 30-39
  '#9b5de5',  // 40-49
  '#00b4d8',  // 50-59
  '#e76f51',  // 60-69
  '#06d6a0',  // 70-79
  '#ffd166'   // 80-90
];

export function BingoCard({ card, calledNumbers, currentNumber, onMarkNumber, onClaimLine, onClaimBingo }) {
  const [markedNumbers, setMarkedNumbers] = useState(new Set());

  const handleCellClick = (number) => {
    if (number === null) return; // Casilla vacía
    if (!calledNumbers.includes(number)) return; // Número no cantado

    setMarkedNumbers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(number)) {
        newSet.delete(number);
      } else {
        newSet.add(number);
        onMarkNumber(number);
      }
      return newSet;
    });
  };

  // Vibrar cuando sale un número que está en mi cartón
  useEffect(() => {
    if (currentNumber && card) {
      // Verificar si el número está en mi cartón
      for (const row of card) {
        if (row.includes(currentNumber)) {
          // Vibrar más fuerte si el número está en mi cartón
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          break;
        }
      }
    }
  }, [currentNumber, card]);

  const getNumberColor = (num) => {
    if (num === null) return '#666';
    const colIndex = getColumnIndex(num);
    return COLUMN_COLORS[colIndex] || '#666';
  };

  return (
    <div className="card-screen">
      {/* Número actual */}
      <AnimatePresence mode="wait">
        {currentNumber && (
          <motion.div
            key={currentNumber}
            className="current-number"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{ '--number-color': getNumberColor(currentNumber) }}
          >
            <span className="number">{currentNumber}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cartón Bingo 90: 3 filas x 9 columnas */}
      <div className="bingo-card bingo-card-90">
        <div className="card-body">
          {card.map((row, rowIndex) => (
            <div key={rowIndex} className="card-row">
              {row.map((num, colIndex) => {
                const isCalled = num !== null && calledNumbers.includes(num);
                const isMarked = num !== null && markedNumbers.has(num);
                const isEmpty = num === null;

                return (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    className={`card-cell ${isCalled ? 'called' : ''} ${isMarked ? 'marked' : ''} ${isEmpty ? 'empty' : ''}`}
                    onClick={() => handleCellClick(num)}
                    whileTap={!isEmpty ? { scale: 0.9 } : {}}
                    animate={isCalled && !isMarked ? { 
                      boxShadow: ['0 0 0 rgba(233, 69, 96, 0)', '0 0 15px rgba(233, 69, 96, 0.8)', '0 0 0 rgba(233, 69, 96, 0)']
                    } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {num !== null ? num : ''}
                    {isMarked && (
                      <motion.div 
                        className="mark"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Botones de reclamar */}
      <div className="claim-buttons">
        <button className="btn-claim btn-line" onClick={onClaimLine}>
          📏 ¡LÍNEA!
        </button>
        <button className="btn-claim btn-bingo" onClick={onClaimBingo}>
          🎉 ¡BINGO!
        </button>
      </div>

      {/* Contador */}
      <div className="numbers-count">
        Números cantados: {calledNumbers.length}
      </div>
    </div>
  );
}
