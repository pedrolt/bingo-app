import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { WaitingRoom } from './components/WaitingRoom';
import { GameBoard } from './components/GameBoard';
import { WinnerScreen } from './components/WinnerScreen';

function App() {
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, finished
  const [gameData, setGameData] = useState(null);
  
  const { socket, connected, gameId, createGame, startGame, callNumber } = useSocket({
    onGameCreated: (data) => {
      setGameData(data);
    },
    onGameStarted: () => {
      setGameState('playing');
    },
    onNumberCalled: (data) => {
      setGameData(prev => ({
        ...prev,
        currentNumber: data.number,
        calledNumbers: data.calledNumbers
      }));
    },
    onBingoWinner: (data) => {
      setGameState('finished');
      setGameData(prev => ({ ...prev, winner: data.player }));
    },
    onPlayerJoined: (data) => {
      setGameData(prev => ({
        ...prev,
        playersCount: data.playersCount
      }));
    }
  });

  return (
    <div className="app">
      {gameState === 'waiting' && (
        <WaitingRoom
          connected={connected}
          gameId={gameId}
          gameData={gameData}
          onCreateGame={createGame}
          onStartGame={startGame}
        />
      )}
      
      {gameState === 'playing' && (
        <GameBoard
          gameData={gameData}
          onCallNumber={callNumber}
        />
      )}
      
      {gameState === 'finished' && (
        <WinnerScreen
          winner={gameData?.winner}
          onNewGame={() => {
            setGameState('waiting');
            setGameData(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
