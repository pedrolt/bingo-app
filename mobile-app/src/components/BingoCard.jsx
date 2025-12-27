import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColumnLetter } from '../../../server/shared/constants.js';

const COLUMN_COLORS = {
  B: '#e63946',
  I: '#f4a261',
  N: '#2a9d8f',
  G: '#264653',
  O: '#9b5de5'
};

export function BingoCard({ card, calledNumbers, currentNumber, onMarkNumber, onClaimLine, onClaimBingo }) {
  const [markedNumbers, setMarkedNumbers] = useState(new Set([0])); // 0 = casilla libre

  const handleCellClick = (number) => {
    if (number === 0) return; // Casilla libre
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

  // Auto-marcar números cuando son cantados (opcional)
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
            style={{ '--number-color': COLUMN_COLORS[getColumnLetter(currentNumber)] }}
          >
            <span className="letter">{getColumnLetter(currentNumber)}</span>
            <span className="number">{currentNumber}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cartón */}
      <div className="bingo-card">
        <div className="card-header">
          {['B', 'I', 'N', 'G', 'O'].map(letter => (
            <div 
              key={letter} 
              className="header-cell"
              style={{ background: COLUMN_COLORS[letter] }}
            >
              {letter}
            </div>
          ))}
        </div>

        <div className="card-body">
          {card.map((row, rowIndex) => (
            <div key={rowIndex} className="card-row">
              {row.map((num, colIndex) => {
                const isCalled = calledNumbers.includes(num);
                const isMarked = markedNumbers.has(num);
                const isFreeSpace = num === 0;

                return (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    className={`card-cell ${isCalled ? 'called' : ''} ${isMarked ? 'marked' : ''} ${isFreeSpace ? 'free' : ''}`}
                    onClick={() => handleCellClick(num)}
                    whileTap={{ scale: 0.9 }}
                    animate={isCalled && !isMarked && !isFreeSpace ? { 
                      boxShadow: ['0 0 0 rgba(233, 69, 96, 0)', '0 0 20px rgba(233, 69, 96, 0.8)', '0 0 0 rgba(233, 69, 96, 0)']
                    } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {isFreeSpace ? '★' : num}
                    {isMarked && !isFreeSpace && (
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
