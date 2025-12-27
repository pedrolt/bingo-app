import { useState, useEffect } from 'react';
import { usePlayerSocket } from './hooks/usePlayerSocket';
import { JoinGame } from './components/JoinGame';
import { WaitingForStart } from './components/WaitingForStart';
import { BingoCard } from './components/BingoCard';
import { WinnerModal } from './components/WinnerModal';

function App() {
  const [screen, setScreen] = useState('join'); // join, waiting, playing, winner
  const [player, setPlayer] = useState(null);
  const [winner, setWinner] = useState(null);

  // Obtener código de partida de la URL si existe
  const urlParams = new URLSearchParams(window.location.search);
  const gameCodeFromUrl = urlParams.get('game');

  const {
    connected,
    gameState,
    calledNumbers,
    currentNumber,
    joinGame,
    markNumber,
    claimLine,
    claimBingo
  } = usePlayerSocket({
    onJoined: (data) => {
      setPlayer(data.player);
      setScreen('waiting');
    },
    onGameStarted: () => {
      setScreen('playing');
    },
    onLineWinner: (data) => {
      setWinner({ type: 'line', player: data.player });
    },
    onBingoWinner: (data) => {
      setWinner({ type: 'bingo', player: data.player });
      setScreen('winner');
    }
  });

  const handleJoin = (gameId, playerName) => {
    joinGame(gameId, playerName);
  };

  return (
    <div className="app">
      {screen === 'join' && (
        <JoinGame 
          connected={connected}
          initialGameCode={gameCodeFromUrl}
          onJoin={handleJoin}
        />
      )}

      {screen === 'waiting' && (
        <WaitingForStart playerName={player?.name} />
      )}

      {screen === 'playing' && player && (
        <BingoCard
          card={player.card}
          calledNumbers={calledNumbers}
          currentNumber={currentNumber}
          onMarkNumber={markNumber}
          onClaimLine={claimLine}
          onClaimBingo={claimBingo}
        />
      )}

      {winner && (
        <WinnerModal 
          winner={winner}
          isMe={winner.player.id === player?.id}
          onClose={() => {
            if (winner.type === 'bingo') {
              setScreen('join');
              setPlayer(null);
            }
            setWinner(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
