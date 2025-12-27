import { BINGO_CONFIG } from '../../../server/shared/constants.js';

export function NumbersBoard({ calledNumbers = [] }) {
  const columns = BINGO_CONFIG.COLUMNS;

  return (
    <div className="numbers-board">
      <div className="board-header">
        {columns.map(col => (
          <div key={col.letter} className={`header-cell header-${col.letter}`}>
            {col.letter}
          </div>
        ))}
      </div>
      
      <div className="board-body">
        {columns.map(col => (
          <div key={col.letter} className="board-column">
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
