import { motion, AnimatePresence } from 'framer-motion';
import { BingoBall } from './BingoBall';
import { NumbersBoard } from './NumbersBoard';
import { getColumnLetter } from '../../../server/shared/constants.js';

export function GameBoard({ gameData, onCallNumber }) {
  const { currentNumber, calledNumbers = [] } = gameData || {};

  return (
    <div className="game-board">
      {/* Panel izquierdo: Bombo y bola actual */}
      <div className="left-panel">
        <div className="drum-container">
          <motion.div 
            className="drum"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="drum-inner">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="drum-ball" style={{ 
                  transform: `rotate(${i * 45}deg) translateY(-40px)` 
                }}>
                  ⚪
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {currentNumber && (
            <motion.div
              key={currentNumber}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <BingoBall number={currentNumber} size="large" />
            </motion.div>
          )}
        </AnimatePresence>

        <button className="btn-call" onClick={onCallNumber}>
          🎰 Sacar Número
        </button>

        <div className="numbers-called-count">
          Números cantados: {calledNumbers.length} / 75
        </div>
      </div>

      {/* Panel derecho: Tablero de números */}
      <div className="right-panel">
        <NumbersBoard calledNumbers={calledNumbers} />
      </div>
    </div>
  );
}
