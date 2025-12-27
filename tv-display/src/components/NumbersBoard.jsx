import { BINGO_CONFIG } from '../../../server/shared/constants.js';

export function NumbersBoard({ calledNumbers = [] }) {
  // Bingo 90: 9 columnas con rangos de 10 números cada una
  const columns = BINGO_CONFIG.COLUMNS;

  return (
    <div className="numbers-board">
      <div className="board-header">
        {columns.map((col, i) => (
          <div key={i} className={`header-cell header-col-${i}`}>
            {col.min}-{col.max}
          </div>
        ))}
      </div>
      
      <div className="board-body">
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="board-column">
            {Array.from({ length: col.max - col.min + 1 }, (_, i) => {
              const num = col.min + i;
              const isCalled = calledNumbers.includes(num);
              return (
                <div 
                  key={num} 
                  className={`board-cell ${isCalled ? 'called' : ''}`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
