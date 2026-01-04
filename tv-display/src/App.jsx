import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { WaitingRoom } from './components/WaitingRoom';
import { GameBoard } from './components/GameBoard';
import { WinnerScreen } from './components/WinnerScreen';
import { speechService } from './services/SpeechService';
import { SoundService } from './services/SoundService';

function App() {
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, finished
  const [gameData, setGameData] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Actualizar estado de voz en el servicio
  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    speechService.setEnabled(newState);
  };

  // Actualizar estado de sonido
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    SoundService.setEnabled(newState);
  };
  
  const { socket, connected, gameId, createGame, startGame, callNumber } = useSocket({
    onGameCreated: (data) => {
      setGameData(data);
      SoundService.playClick();
    },
    onGameStarted: () => {
      setGameState('playing');
      SoundService.playGameStart();
      speechService.announceGameStart();
    },
    onNumberCalled: (data) => {
      setGameData(prev => ({
        ...prev,
        currentNumber: data.number,
        calledNumbers: data.calledNumbers
      }));
      // Efectos de sonido y voz
      SoundService.playNumberCalled();
      speechService.callNumber(data.number);
    },
    onBingoWinner: (data) => {
      setGameState('finished');
      setGameData(prev => ({ ...prev, winner: data.player }));
      SoundService.playBingoWin();
      speechService.announceBingoWinner(data.player.name);
    },
    onLineWinner: (data) => {
      SoundService.playLineWin();
      speechService.announceLineWinner(data.player.name);
    },
    onPlayerJoined: (data) => {
      setGameData(prev => ({
        ...prev,
        playersCount: data.playersCount
      }));
      SoundService.playPlayerJoined();
    }
  });

  // Handler para sacar número con sonido de bombo
  const handleCallNumber = () => {
    SoundService.playDrumRoll();
    // Pequeño delay para el efecto del bombo antes de sacar el número
    setTimeout(() => {
      callNumber();
    }, 500);
  };

  return (
    <div className="app">
      {/* Controles de audio */}
      <div className="audio-controls">
        <button 
          className="audio-toggle"
          onClick={toggleSound}
          title={soundEnabled ? 'Desactivar sonidos' : 'Activar sonidos'}
        >
          {soundEnabled ? '🎵' : '🎵❌'}
        </button>
        <button 
          className="audio-toggle"
          onClick={toggleVoice}
          title={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
        >
          {voiceEnabled ? '🔊' : '🔇'}
        </button>
        <button
          className="audio-toggle test-btn"
          onClick={() => {
            SoundService.playNumberCalled();
            speechService.speak('Prueba de sonido. El número cuarenta y dos.');
          }}
          title="Probar audio"
        >
          🎤
        </button>
      </div>

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
          onCallNumber={handleCallNumber}
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
