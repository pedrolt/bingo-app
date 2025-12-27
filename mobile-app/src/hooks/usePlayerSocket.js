import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../server/shared/constants.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export function usePlayerSocket(handlers = {}) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);

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
      setGameState(data);
      handlers.onGameStarted?.(data);
    });

    newSocket.on(SOCKET_EVENTS.NUMBER_CALLED, (data) => {
      setCalledNumbers(data.calledNumbers);
      setCurrentNumber(data.number);
      handlers.onNumberCalled?.(data);
      
      // Vibrar si el dispositivo lo soporta
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    });

    newSocket.on(SOCKET_EVENTS.LINE_WINNER, (data) => {
      handlers.onLineWinner?.(data);
    });

    newSocket.on(SOCKET_EVENTS.BINGO_WINNER, (data) => {
      handlers.onBingoWinner?.(data);
    });

    newSocket.on(SOCKET_EVENTS.GAME_ENDED, (data) => {
      handlers.onGameEnded?.(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinGame = useCallback((gameId, playerName) => {
    if (!socket) return;

    socket.emit(SOCKET_EVENTS.JOIN_GAME, { gameId, playerName }, (response) => {
      if (response.success) {
        setGameState(response.gameState);
        setCalledNumbers(response.gameState.calledNumbers || []);
        handlers.onJoined?.(response);
      } else {
        console.error('Error al unirse:', response.error);
        alert(response.error || 'No se pudo unir a la partida');
      }
    });
  }, [socket, handlers]);

  const markNumber = useCallback((number) => {
    if (!socket) return;

    socket.emit(SOCKET_EVENTS.MARK_NUMBER, { number }, (response) => {
      if (!response.success) {
        console.warn('No se pudo marcar el número');
      }
    });
  }, [socket]);

  const claimLine = useCallback(() => {
    if (!socket) return;

    socket.emit(SOCKET_EVENTS.CLAIM_LINE, (response) => {
      if (!response.success) {
        alert(response.error || '¡No tienes línea válida!');
      }
    });
  }, [socket]);

  const claimBingo = useCallback(() => {
    if (!socket) return;

    socket.emit(SOCKET_EVENTS.CLAIM_BINGO, (response) => {
      if (!response.success) {
        alert(response.error || '¡No tienes bingo válido!');
      }
    });
  }, [socket]);

  return {
    socket,
    connected,
    gameState,
    calledNumbers,
    currentNumber,
    joinGame,
    markNumber,
    claimLine,
    claimBingo
  };
}
