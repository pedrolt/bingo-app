import { QRCodeSVG } from 'qrcode.react';

export function WaitingRoom({ connected, gameId, gameData, onCreateGame, onStartGame }) {
  const joinUrl = gameId 
    ? `${window.location.origin.replace('5173', '5174')}?game=${gameId}`
    : '';

  return (
    <div className="waiting-room">
      <h1 className="title">🎱 BINGO</h1>
      
      {!connected && (
        <div className="status connecting">
          Conectando al servidor...
        </div>
      )}

      {connected && !gameId && (
        <button className="btn-create" onClick={() => onCreateGame()}>
          🎮 Crear Nueva Partida
        </button>
      )}

      {gameId && (
        <div className="game-info">
          <div className="game-code">
            <span className="label">Código de partida:</span>
            <span className="code">{gameId}</span>
          </div>

          <div className="qr-container">
            <QRCodeSVG 
              value={joinUrl} 
              size={200}
              bgColor="#ffffff"
              fgColor="#1a1a2e"
              level="M"
            />
            <p className="qr-hint">Escanea para unirte</p>
          </div>

          <div className="players-count">
            👥 Jugadores: <strong>{gameData?.playersCount || 0}</strong>
          </div>

          {(gameData?.playersCount || 0) > 0 && (
            <button className="btn-start" onClick={onStartGame}>
              🚀 Iniciar Partida
            </button>
          )}
        </div>
      )}
    </div>
  );
}
