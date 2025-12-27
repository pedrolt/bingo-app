import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../server/shared/constants.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export function useSocket(handlers = {}) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameId, setGameId] = useState(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Conectado al servidor');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
      setConnected(false);
    });

    // Eventos del juego
    newSocket.on(SOCKET_EVENTS.GAME_STARTED, (data) => {
      handlers.onGameStarted?.(data);
    });

    newSocket.on(SOCKET_EVENTS.NUMBER_CALLED, (data) => {
      handlers.onNumberCalled?.(data);
    });

    newSocket.on(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
      handlers.onPlayerJoined?.(data);
    });

    newSocket.on(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
      handlers.onPlayerLeft?.(data);
    });

    newSocket.on(SOCKET_EVENTS.LINE_WINNER, (data) => {
      handlers.onLineWinner?.(data);
    });

    newSocket.on(SOCKET_EVENTS.BINGO_WINNER, (data) => {
      handlers.onBingoWinner?.(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createGame = useCallback((options = {}) => {
    if (!socket) return;
    
    socket.emit(SOCKET_EVENTS.CREATE_GAME, options, (response) => {
      if (response.success) {
        setGameId(response.gameId);
        handlers.onGameCreated?.({ gameId: response.gameId, playersCount: 0 });
      } else {
        console.error('Error al crear partida:', response.error);
      }
    });
  }, [socket, handlers]);

  const startGame = useCallback(() => {
    if (!socket) return;
    
    socket.emit(SOCKET_EVENTS.START_GAME, (response) => {
      if (!response.success) {
        console.error('Error al iniciar partida:', response.error);
      }
    });
  }, [socket]);

  const callNumber = useCallback(() => {
    if (!socket) return;
    
    socket.emit(SOCKET_EVENTS.CALL_NUMBER, (response) => {
      if (!response.success) {
        console.error('Error al cantar número:', response.error);
      }
    });
  }, [socket]);

  return {
    socket,
    connected,
    gameId,
    createGame,
    startGame,
    callNumber
  };
}
