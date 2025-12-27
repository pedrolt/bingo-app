import { motion } from 'framer-motion';

export function WinnerModal({ winner, isMe, onClose }) {
  const isBingo = winner.type === 'bingo';

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className={`modal-content ${isMe ? 'winner-me' : ''}`}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        {isMe ? (
          <>
            <div className="modal-emoji">🎉</div>
            <h2>¡FELICIDADES!</h2>
            <p className="modal-message">
              {isBingo ? '¡Has ganado el BINGO!' : '¡Has conseguido LÍNEA!'}
            </p>
          </>
        ) : (
          <>
            <div className="modal-emoji">{isBingo ? '🏆' : '📏'}</div>
            <h2>{isBingo ? '¡BINGO!' : '¡LÍNEA!'}</h2>
            <p className="modal-message">
              <strong>{winner.player.name}</strong> {isBingo ? 'ha ganado' : 'tiene línea'}
            </p>
          </>
        )}

        <button className="btn-modal-close" onClick={onClose}>
          {isBingo ? 'Nueva Partida' : 'Continuar'}
        </button>
      </motion.div>
    </motion.div>
  );
}
