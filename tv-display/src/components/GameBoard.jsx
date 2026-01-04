import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BingoBall } from './BingoBall';
import { NumbersBoard } from './NumbersBoard';

export function GameBoard({ gameData, onCallNumber, autoMode, onStartAuto, onStopAuto, onSetInterval, lineWinner }) {
  const { currentNumber, calledNumbers = [] } = gameData || {};
  const [intervalValue, setIntervalValue] = useState(autoMode?.interval || 5000);

  const handleIntervalChange = (e) => {
    const value = parseInt(e.target.value);
    setIntervalValue(value);
  };

  const handleStartAuto = () => {
    onStartAuto?.(intervalValue);
  };

  return (
    <div className="game-board">
      {/* Banner de ganador de línea */}
      <AnimatePresence>
        {lineWinner && (
          <motion.div
            className="line-winner-banner"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
          >
            <span className="line-icon">📏</span>
            <span className="line-text">¡LÍNEA!</span>
            <span className="line-player">{lineWinner.name}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel izquierdo: Bombo y bola actual */}
      <div className="left-panel">
        <div className="drum-container">
          <motion.div 
            className="drum"
            animate={{ rotate: autoMode?.enabled ? [0, 360] : 0 }}
            transition={{ duration: 2, repeat: autoMode?.enabled ? Infinity : 0, ease: "linear" }}
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

        {/* Botones de control */}
        <div className="controls-container">
          {!autoMode?.enabled ? (
            <>
              <button className="btn-call" onClick={onCallNumber}>
                🎰 Sacar Número
              </button>
              
              <div className="auto-mode-controls">
                <div className="interval-selector">
                  <label>⏱️ Intervalo:</label>
                  <select value={intervalValue} onChange={handleIntervalChange}>
                    <option value={2000}>2 seg</option>
                    <option value={3000}>3 seg</option>
                    <option value={5000}>5 seg</option>
                    <option value={7000}>7 seg</option>
                    <option value={10000}>10 seg</option>
                    <option value={15000}>15 seg</option>
                  </select>
                </div>
                <button className="btn-auto-start" onClick={handleStartAuto}>
                  🤖 Modo Automático
                </button>
              </div>
            </>
          ) : (
            <button className="btn-auto-stop" onClick={onStopAuto}>
              ⏹️ Detener Automático
            </button>
          )}
        </div>

        {autoMode?.enabled && (
          <motion.div 
            className="auto-indicator"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            🤖 Modo automático activo ({autoMode.interval / 1000}s)
          </motion.div>
        )}

        <div className="numbers-called-count">
          Números cantados: {calledNumbers.length} / 90
        </div>
      </div>

      {/* Panel derecho: Tablero de números */}
      <div className="right-panel">
        <NumbersBoard calledNumbers={calledNumbers} />
      </div>
    </div>
  );
}
