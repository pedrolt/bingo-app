import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../server/shared/constants.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

// Clave para almacenar datos de sesión en localStorage
const SESSION_STORAGE_KEY = 'bingo_session';

/**
 * Guarda la sesión del jugador en localStorage
 */
function saveSession(gameId, reconnectToken, playerName) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      gameId,
      reconnectToken,
      playerName,
      savedAt: Date.now()
    }));
  } catch (e) {
    console.warn('No se pudo guardar la sesión:', e);
  }
}

/**
 * Obtiene la sesión guardada
 */
function getSession() {
  try {
    const data = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!data) return null;
    
    const session = JSON.parse(data);
    // Sesión válida por 30 minutos
    const thirtyMinutes = 30 * 60 * 1000;
    if (Date.now() - session.savedAt > thirtyMinutes) {
      clearSession();
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

/**
 * Limpia la sesión guardada
 */
function clearSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    // Ignorar
  }
}

export function usePlayerSocket(handlers = {}) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Ref para almacenar datos de reconexión
  const sessionRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    newSocket.on('connect', () => {
      console.log('✅ Conectado al servidor');
      setConnected(true);
      
      // Intentar reconexión automática si hay sesión guardada
      const savedSession = getSession();
      if (savedSession && savedSession.reconnectToken) {
        setIsReconnecting(true);
        console.log('🔄 Intentando reconexión automática...');
        
        newSocket.emit(SOCKET_EVENTS.RECONNECT, {
          gameId: savedSession.gameId,
          reconnectToken: savedSession.reconnectToken,
          playerName: savedSession.playerName
        }, (response) => {
          setIsReconnecting(false);
          
          if (response.success) {
            console.log('✅ Reconexión exitosa');
            sessionRef.current = {
              gameId: savedSession.gameId,
              reconnectToken: response.player.reconnectToken,
              playerName: response.player.name
            };
            
            setGameState(response.gameState);
            setCalledNumbers(response.gameState.calledNumbers || []);
            setCurrentNumber(response.gameState.currentNumber);
            
            handlersRef.current.onReconnected?.({
              player: response.player,
              gameState: response.gameState
            });
          } else {
            console.log('❌ Reconexión fallida:', response.error);
            clearSession();
            handlersRef.current.onReconnectFailed?.(response.error);
          }
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
      setConnected(false);
      handlersRef.current.onDisconnected?.();
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Intento de reconexión #${attemptNumber}`);
      setIsReconnecting(true);
    });

    newSocket.on('reconnect', () => {
      console.log('✅ Reconectado al servidor');
      setIsReconnecting(false);
    });

    newSocket.on('reconnect_failed', () => {
      console.log('❌ Falló la reconexión');
      setIsReconnecting(false);
    });

    // Eventos del juego
    newSocket.on(SOCKET_EVENTS.GAME_STARTED, (data) => {
      setGameState(data);
      handlersRef.current.onGameStarted?.(data);
    });

    newSocket.on(SOCKET_EVENTS.NUMBER_CALLED, (data) => {
      setCalledNumbers(data.calledNumbers);
      setCurrentNumber(data.number);
      handlersRef.current.onNumberCalled?.(data);
      
      // Vibrar si el dispositivo lo soporta
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    });

    newSocket.on(SOCKET_EVENTS.LINE_WINNER, (data) => {
      handlersRef.current.onLineWinner?.(data);
    });

    newSocket.on(SOCKET_EVENTS.BINGO_WINNER, (data) => {
      // Limpiar sesión cuando termina el juego
      clearSession();
      handlersRef.current.onBingoWinner?.(data);
    });

    newSocket.on(SOCKET_EVENTS.GAME_ENDED, (data) => {
      clearSession();
      handlersRef.current.onGameEnded?.(data);
    });

    newSocket.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, (data) => {
      handlersRef.current.onPlayerDisconnected?.(data);
    });

    newSocket.on(SOCKET_EVENTS.PLAYER_RECONNECTED, (data) => {
      handlersRef.current.onPlayerReconnected?.(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinGame = useCallback((gameId, playerName) => {
    if (!socket) return;

    // Verificar si hay una sesión guardada para reconexión
    const savedSession = getSession();
    const reconnectToken = savedSession?.gameId === gameId ? savedSession.reconnectToken : null;

    socket.emit(SOCKET_EVENTS.JOIN_GAME, { 
      gameId, 
      playerName,
      reconnectToken 
    }, (response) => {
      if (response.success) {
        // Guardar sesión para reconexión futura
        saveSession(gameId, response.player.reconnectToken, response.player.name);
        sessionRef.current = {
          gameId,
          reconnectToken: response.player.reconnectToken,
          playerName: response.player.name
        };
        
        setGameState(response.gameState);
        setCalledNumbers(response.gameState.calledNumbers || []);
        
        if (response.isReconnection) {
          handlersRef.current.onReconnected?.({
            player: response.player,
            gameState: response.gameState
          });
        } else {
          handlersRef.current.onJoined?.(response);
        }
      } else {
        console.error('Error al unirse:', response.error);
        alert(response.error || 'No se pudo unir a la partida');
      }
    });
  }, [socket]);

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

  /**
   * Intenta reconectar manualmente
   */
  const attemptReconnect = useCallback((gameId, reconnectToken, playerName) => {
    if (!socket) return;

    setIsReconnecting(true);
    
    socket.emit(SOCKET_EVENTS.RECONNECT, {
      gameId,
      reconnectToken,
      playerName
    }, (response) => {
      setIsReconnecting(false);
      
      if (response.success) {
        saveSession(gameId, response.player.reconnectToken, response.player.name);
        sessionRef.current = {
          gameId,
          reconnectToken: response.player.reconnectToken,
          playerName: response.player.name
        };
        
        setGameState(response.gameState);
        setCalledNumbers(response.gameState.calledNumbers || []);
        setCurrentNumber(response.gameState.currentNumber);
        
        handlersRef.current.onReconnected?.({
          player: response.player,
          gameState: response.gameState
        });
      } else {
        handlersRef.current.onReconnectFailed?.(response.error);
      }
    });
  }, [socket]);

  /**
   * Obtiene la sesión guardada (para UI)
   */
  const getSavedSession = useCallback(() => {
    return getSession();
  }, []);

  /**
   * Limpia la sesión (logout manual)
   */
  const clearSavedSession = useCallback(() => {
    clearSession();
    sessionRef.current = null;
  }, []);

  return {
    socket,
    connected,
    gameState,
    calledNumbers,
    currentNumber,
    isReconnecting,
    joinGame,
    markNumber,
    claimLine,
    claimBingo,
    attemptReconnect,
    getSavedSession,
    clearSavedSession
  };
}
