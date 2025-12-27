import { useState } from 'react';

export function JoinGame({ connected, initialGameCode, onJoin }) {
  const [gameCode, setGameCode] = useState(initialGameCode || '');
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (gameCode.trim() && playerName.trim()) {
      onJoin(gameCode.trim().toUpperCase(), playerName.trim());
    }
  };

  return (
    <div className="join-screen">
      <div className="logo">
        <span className="logo-emoji">🎱</span>
        <h1>BINGO</h1>
      </div>

      {!connected && (
        <div className="status connecting">
          Conectando...
        </div>
      )}

      {connected && (
        <form onSubmit={handleSubmit} className="join-form">
          <div className="input-group">
            <label>Código de partida</label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="XXXXXXXX"
              maxLength={8}
              className="input-code"
            />
          </div>

          <div className="input-group">
            <label>Tu nombre</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="¿Cómo te llamas?"
              maxLength={20}
              className="input-name"
            />
          </div>

          <button 
            type="submit" 
            className="btn-join"
            disabled={!gameCode.trim() || !playerName.trim()}
          >
            🎮 Unirse a la Partida
          </button>
        </form>
      )}
    </div>
  );
}
