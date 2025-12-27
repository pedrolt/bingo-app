import { motion } from 'framer-motion';

export function WaitingForStart({ playerName }) {
  return (
    <div className="waiting-screen">
      <motion.div 
        className="waiting-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>¡Hola, {playerName}!</h2>
        
        <motion.div 
          className="loader"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          🎱
        </motion.div>
        
        <p>Esperando a que comience la partida...</p>
        <p className="hint">Mira la pantalla principal</p>
      </motion.div>
    </div>
  );
}
