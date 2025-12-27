import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export function WinnerScreen({ winner, onNewGame }) {
  useEffect(() => {
    // Lanzar confeti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#e63946', '#f4a261', '#2a9d8f', '#9b5de5']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#e63946', '#f4a261', '#2a9d8f', '#9b5de5']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="winner-screen">
      <motion.div
        className="winner-content"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
      >
        <h1 className="winner-title">🎉 ¡BINGO! 🎉</h1>
        
        <motion.div 
          className="winner-name"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          {winner?.name || 'Ganador'}
        </motion.div>
        
        <p className="winner-message">¡Felicidades!</p>

        <button className="btn-new-game" onClick={onNewGame}>
          🎮 Nueva Partida
        </button>
      </motion.div>
    </div>
  );
}
