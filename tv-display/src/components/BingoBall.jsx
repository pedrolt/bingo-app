import { getColumnLetter } from '../../../server/shared/constants.js';

const COLORS = {
  B: '#e63946',  // Rojo
  I: '#f4a261',  // Naranja
  N: '#2a9d8f',  // Verde
  G: '#264653',  // Azul oscuro
  O: '#9b5de5'   // Púrpura
};

export function BingoBall({ number, size = 'normal', marked = false }) {
  const letter = getColumnLetter(number);
  const color = COLORS[letter] || '#666';
  
  const sizeClass = size === 'large' ? 'ball-large' : 'ball-normal';

  return (
    <div 
      className={`bingo-ball ${sizeClass} ${marked ? 'marked' : ''}`}
      style={{ '--ball-color': color }}
    >
      <div className="ball-inner">
        <span className="ball-letter">{letter}</span>
        <span className="ball-number">{number}</span>
      </div>
    </div>
  );
}
