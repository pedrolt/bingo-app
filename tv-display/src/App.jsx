import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { WaitingRoom } from './components/WaitingRoom';
import { GameBoard } from './components/GameBoard';
import { WinnerScreen } from './components/WinnerScreen';
import { speechService } from './services/SpeechService';

function App() {
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, finished
  const [gameData, setGameData] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Actualizar estado de voz en el servicio
  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    speechService.setEnabled(newState);
  };
  
  const { socket, connected, gameId, createGame, startGame, callNumber } = useSocket({
    onGameCreated: (data) => {
      setGameData(data);
    },
    onGameStarted: () => {
      setGameState('playing');
      speechService.announceGameStart();
    },
    onNumberCalled: (data) => {
      setGameData(prev => ({
        ...prev,
        currentNumber: data.number,
        calledNumbers: data.calledNumbers
      }));
      // Cantar el número
      speechService.callNumber(data.number);
    },
    onBingoWinner: (data) => {
      setGameState('finished');
      setGameData(prev => ({ ...prev, winner: data.player }));
      speechService.announceBingoWinner(data.player.name);
    },
    onLineWinner: (data) => {
      speechService.announceLineWinner(data.player.name);
    },
    onPlayerJoined: (data) => {
      setGameData(prev => ({
        ...prev,
        playersCount: data.playersCount
      }));
      // Anunciar nuevo jugador (opcional, puede ser molesto)
      // speechService.announcePlayerJoined(data.player.name);
    }
  });

  return (
    <div className="app">
      {/* Botón de toggle de voz */}
      <button 
        className="voice-toggle"
        onClick={toggleVoice}
        title={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
      >
        {voiceEnabled ? '🔊' : '🔇'}
      </button>
      {/* Botón para probar la voz rápidamente */}
      <button
        className="voice-test"
        onClick={() => speechService.speak('Prueba de voz. Un dos tres. El número siete.')}
        title="Probar voz"
      >
        Probar voz
      </button>

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
