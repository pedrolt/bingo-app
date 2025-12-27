import { getColumnIndex } from '../../../server/shared/constants.js';

// Colores para las 9 columnas del Bingo 90
const COLORS = [
  '#e63946',  // 1-9: Rojo
  '#f4a261',  // 10-19: Naranja
  '#2a9d8f',  // 20-29: Verde
  '#264653',  // 30-39: Azul oscuro
  '#9b5de5',  // 40-49: Púrpura
  '#00b4d8',  // 50-59: Azul claro
  '#e76f51',  // 60-69: Coral
  '#06d6a0',  // 70-79: Verde menta
  '#ffd166'   // 80-90: Amarillo
];

export function BingoBall({ number, size = 'normal', marked = false }) {
  const colIndex = getColumnIndex(number);
  const color = COLORS[colIndex] || '#666';
  
  const sizeClass = size === 'large' ? 'ball-large' : 'ball-normal';

  return (
    <div 
      className={`bingo-ball ${sizeClass} ${marked ? 'marked' : ''}`}
      style={{ '--ball-color': color }}
    >
      <div className="ball-inner">
        <span className="ball-number">{number}</span>
      </div>
    </div>
  );
}
