import { useState, useEffect } from 'react';
import { usePlayerSocket } from './hooks/usePlayerSocket';
import { JoinGame } from './components/JoinGame';
import { WaitingForStart } from './components/WaitingForStart';
import { BingoCard } from './components/BingoCard';
import { WinnerModal } from './components/WinnerModal';

function App() {
  const [screen, setScreen] = useState('join'); // join, waiting, playing, winner, reconnecting
  const [player, setPlayer] = useState(null);
  const [winner, setWinner] = useState(null);
  const [reconnectError, setReconnectError] = useState(null);

  // Obtener código de partida de la URL si existe
  const urlParams = new URLSearchParams(window.location.search);
  const gameCodeFromUrl = urlParams.get('game');

  const {
    connected,
    gameState,
    calledNumbers,
    currentNumber,
    isReconnecting,
    joinGame,
    markNumber,
    claimLine,
    claimBingo,
    getSavedSession,
    clearSavedSession
  } = usePlayerSocket({
    onJoined: (data) => {
      setPlayer(data.player);
      setReconnectError(null);
      // Si la partida ya está en juego, ir directamente a playing
      if (data.gameState.state === 'playing') {
        setScreen('playing');
      } else {
        setScreen('waiting');
      }
    },
    onReconnected: (data) => {
      console.log('🔄 Reconectado exitosamente');
      setPlayer(data.player);
      setReconnectError(null);
      // Determinar pantalla según estado del juego
      if (data.gameState.state === 'playing') {
        setScreen('playing');
      } else if (data.gameState.state === 'waiting') {
        setScreen('waiting');
      } else {
        setScreen('join');
      }
    },
    onReconnectFailed: (error) => {
      console.log('❌ Falló la reconexión:', error);
      setReconnectError(error);
      setScreen('join');
    },
    onDisconnected: () => {
      // Mostrar indicador de reconexión si estaba jugando
      if (screen === 'playing') {
        setReconnectError('Conexión perdida. Reconectando...');
      }
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
    },
    onGameEnded: (data) => {
      alert(data.reason || 'La partida ha terminado');
      setScreen('join');
      setPlayer(null);
      clearSavedSession();
    }
  });

  // Verificar si hay sesión guardada al cargar
  useEffect(() => {
    const savedSession = getSavedSession();
    if (savedSession && savedSession.reconnectToken) {
      setScreen('reconnecting');
    }
  }, [getSavedSession]);

  // Actualizar pantalla cuando cambie isReconnecting
  useEffect(() => {
    if (isReconnecting && screen === 'join') {
      setScreen('reconnecting');
    } else if (!isReconnecting && screen === 'reconnecting' && !player) {
      setScreen('join');
    }
  }, [isReconnecting, screen, player]);

  const handleJoin = (gameId, playerName) => {
    setReconnectError(null);
    joinGame(gameId, playerName);
  };

  const handleCancelReconnect = () => {
    clearSavedSession();
    setScreen('join');
    setReconnectError(null);
  };

  return (
    <div className="app">
      {/* Indicador de reconexión */}
      {isReconnecting && screen !== 'reconnecting' && (
        <div className="reconnecting-banner">
          🔄 Reconectando...
        </div>
      )}

      {/* Error de reconexión */}
      {reconnectError && screen === 'join' && (
        <div className="reconnect-error">
          ⚠️ {reconnectError}
        </div>
      )}

      {screen === 'reconnecting' && (
        <div className="reconnecting-screen">
          <div className="reconnecting-content">
            <div className="spinner"></div>
            <h2>🔄 Reconectando...</h2>
            <p>Recuperando tu partida anterior</p>
            <button 
              className="btn-cancel-reconnect"
              onClick={handleCancelReconnect}
            >
              Cancelar y unirse como nuevo
            </button>
          </div>
        </div>
      )}

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
          markedNumbers={player.markedNumbers}
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
              clearSavedSession();
            }
            setWinner(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
