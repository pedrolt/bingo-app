import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../server/shared/constants.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export function useSocket(handlers = {}) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [autoMode, setAutoMode] = useState({ enabled: false, interval: 5000 });

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

    // Eventos de modo automático
    newSocket.on(SOCKET_EVENTS.AUTO_MODE_CHANGED, (data) => {
      setAutoMode(data);
      handlers.onAutoModeChanged?.(data);
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

  // Funciones de modo automático
  const startAutoMode = useCallback((interval = 5000) => {
    if (!socket) return;
    
    socket.emit(SOCKET_EVENTS.AUTO_MODE_START, { interval }, (response) => {
      if (response.success) {
        setAutoMode({ enabled: true, interval: response.interval });
      } else {
        console.error('Error al activar modo automático:', response.error);
      }
    });
  }, [socket]);

  const stopAutoMode = useCallback(() => {
    if (!socket) return;
    
    socket.emit(SOCKET_EVENTS.AUTO_MODE_STOP, (response) => {
      if (response.success) {
        setAutoMode(prev => ({ ...prev, enabled: false }));
      } else {
        console.error('Error al desactivar modo automático:', response.error);
      }
    });
  }, [socket]);

  const setAutoInterval = useCallback((interval) => {
    if (!socket) return;
    
    socket.emit(SOCKET_EVENTS.AUTO_MODE_SET_INTERVAL, { interval }, (response) => {
      if (response.success) {
        setAutoMode(prev => ({ ...prev, interval: response.interval }));
      }
    });
  }, [socket]);

  return {
    socket,
    connected,
    gameId,
    autoMode,
    createGame,
    startGame,
    callNumber,
    startAutoMode,
    stopAutoMode,
    setAutoInterval
  };
}
