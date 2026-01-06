/**
 * 🔌 Socket Handlers
 * Manejadores de eventos de Socket.io con soporte para reconexión
 */

import { SOCKET_EVENTS, GAME_STATES } from '../../shared/constants.js';
import { db } from '../database/Database.js';

/**
 * Configura los manejadores de eventos de Socket.io
 * @param {import('socket.io').Server} io 
 * @param {import('../game/GameManager.js').GameManager} gameManager 
 */
export function setupSocketHandlers(io, gameManager) {
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // ==========================================
    // EVENTOS DE PARTIDA
    // ==========================================

    /**
     * Crear nueva partida (desde TV)
     */
    socket.on(SOCKET_EVENTS.CREATE_GAME, (options, callback) => {
      try {
        const game = gameManager.createGame(options);
        socket.join(game.id);
        socket.gameId = game.id;
        socket.isTV = true;
        
        callback({ success: true, gameId: game.id });
        console.log(`📺 TV creó partida: ${game.id}`);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Unirse a partida (desde móvil)
     * Ahora también verifica si el jugador puede reconectarse
     */
    socket.on(SOCKET_EVENTS.JOIN_GAME, ({ gameId, playerName, reconnectToken }, callback) => {
      try {
        const game = gameManager.getGame(gameId);
        if (!game) {
          return callback({ success: false, error: 'Partida no encontrada' });
        }

        let player;
        let isReconnection = false;

        // Intentar reconexión si se proporciona token o nombre existe
        if (reconnectToken) {
          player = game.reconnectPlayerByToken(reconnectToken, socket.id);
          isReconnection = !!player;
        }
        
        // Fallback: reconectar por nombre si existe un jugador desconectado con ese nombre
        if (!player && playerName) {
          player = game.reconnectPlayerByName(playerName, socket.id);
          isReconnection = !!player;
        }

        // Si no es reconexión, crear nuevo jugador
        if (!player) {
          player = game.addPlayer(socket.id, playerName);
        }
        
        socket.join(gameId);
        socket.gameId = gameId;
        socket.playerId = player.id;

        // Notificar evento correspondiente
        if (isReconnection) {
          io.to(gameId).emit(SOCKET_EVENTS.PLAYER_RECONNECTED, {
            player: { id: player.id, name: player.name },
            playersCount: game.getConnectedPlayersCount()
          });
        } else {
          io.to(gameId).emit(SOCKET_EVENTS.PLAYER_JOINED, {
            player: { id: player.id, name: player.name },
            playersCount: game.getConnectedPlayersCount()
          });
        }

        callback({ 
          success: true,
          isReconnection,
          player: {
            id: player.id,
            name: player.name,
            card: player.card,
            markedNumbers: player.markedNumbers || [],
            reconnectToken: player.reconnectToken
          },
          gameState: game.getInfo()
        });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Reconexión explícita (desde móvil)
     */
    socket.on(SOCKET_EVENTS.RECONNECT, ({ gameId, reconnectToken, playerName }, callback) => {
      try {
        const game = gameManager.getGame(gameId);
        if (!game) {
          return callback({ success: false, error: 'Partida no encontrada' });
        }

        // Verificar que la partida no haya terminado
        if (game.state === GAME_STATES.FINISHED) {
          return callback({ success: false, error: 'La partida ha finalizado' });
        }

        let player = null;

        // Intentar reconectar por token
        if (reconnectToken) {
          player = game.reconnectPlayerByToken(reconnectToken, socket.id);
        }

        // Fallback: reconectar por nombre
        if (!player && playerName) {
          player = game.reconnectPlayerByName(playerName, socket.id);
        }

        if (!player) {
          return callback({ 
            success: false, 
            error: 'No se encontró una sesión anterior. Por favor, únete como nuevo jugador.' 
          });
        }

        socket.join(gameId);
        socket.gameId = gameId;
        socket.playerId = player.id;

        // Notificar a todos
        io.to(gameId).emit(SOCKET_EVENTS.PLAYER_RECONNECTED, {
          player: { id: player.id, name: player.name },
          playersCount: game.getConnectedPlayersCount()
        });

        callback({
          success: true,
          player: {
            id: player.id,
            name: player.name,
            card: player.card,
            markedNumbers: player.markedNumbers || [],
            reconnectToken: player.reconnectToken
          },
          gameState: game.getInfo()
        });

        console.log(`🔄 Jugador "${player.name}" reconectado a ${gameId}`);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Iniciar partida (desde TV)
     */
    socket.on(SOCKET_EVENTS.START_GAME, (callback) => {
      try {
        const game = gameManager.getGame(socket.gameId);
        if (!game) {
          return callback({ success: false, error: 'Partida no encontrada' });
        }

        game.start();
        io.to(socket.gameId).emit(SOCKET_EVENTS.GAME_STARTED, game.getInfo());
        callback({ success: true });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // ==========================================
    // EVENTOS DE JUEGO
    // ==========================================

    /**
     * Cantar siguiente número (desde TV)
     */
    socket.on(SOCKET_EVENTS.CALL_NUMBER, (callback) => {
      try {
        const game = gameManager.getGame(socket.gameId);
        if (!game) {
          return callback({ success: false, error: 'Partida no encontrada' });
        }

        const number = game.callNextNumber();
        if (number === null) {
          return callback({ success: false, error: 'No hay más números' });
        }

        // Emitir a todos los jugadores
        io.to(socket.gameId).emit(SOCKET_EVENTS.NUMBER_CALLED, {
          number,
          calledNumbers: game.calledNumbers
        });

        callback({ success: true, number });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // ==========================================
    // MODO AUTOMÁTICO
    // ==========================================

    /**
     * Activar modo automático (desde TV)
     */
    socket.on(SOCKET_EVENTS.AUTO_MODE_START, ({ interval }, callback) => {
      try {
        const game = gameManager.getGame(socket.gameId);
        if (!game) {
          return callback({ success: false, error: 'Partida no encontrada' });
        }

        const success = game.startAutoMode(interval, (number, calledNumbers) => {
          // Emitir número a todos los jugadores
          io.to(socket.gameId).emit(SOCKET_EVENTS.NUMBER_CALLED, {
            number,
            calledNumbers
          });
        });

        if (success) {
          io.to(socket.gameId).emit(SOCKET_EVENTS.AUTO_MODE_CHANGED, {
            enabled: true,
            interval: game.autoMode.interval
          });
        }

        callback({ success, interval: game.autoMode.interval });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Desactivar modo automático (desde TV)
     */
    socket.on(SOCKET_EVENTS.AUTO_MODE_STOP, (callback) => {
      try {
        const game = gameManager.getGame(socket.gameId);
        if (!game) {
          return callback({ success: false, error: 'Partida no encontrada' });
        }

        game.stopAutoMode();

        io.to(socket.gameId).emit(SOCKET_EVENTS.AUTO_MODE_CHANGED, {
          enabled: false,
          interval: game.autoMode.interval
        });

        callback({ success: true });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Cambiar intervalo del modo automático (desde TV)
     */
    socket.on(SOCKET_EVENTS.AUTO_MODE_SET_INTERVAL, ({ interval }, callback) => {
      try {
        const game = gameManager.getGame(socket.gameId);
        if (!game) {
          return callback({ success: false, error: 'Partida no encontrada' });
        }

        const newInterval = game.setAutoInterval(interval);

        io.to(socket.gameId).emit(SOCKET_EVENTS.AUTO_MODE_CHANGED, {
          enabled: game.autoMode.enabled,
          interval: newInterval
        });

        callback({ success: true, interval: newInterval });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Marcar número en cartón (desde móvil)
     */
    socket.on(SOCKET_EVENTS.MARK_NUMBER, ({ number }, callback) => {
      try {
        const game = gameManager.getGame(socket.gameId);
        if (!game) {
          return callback({ success: false, error: 'Partida no encontrada' });
        }

        const marked = game.markNumber(socket.id, number);
        callback({ success: marked });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Reclamar línea (desde móvil)
     */
    socket.on(SOCKET_EVENTS.CLAIM_LINE, (callback) => {
      try {
        const game = gameManager.getGame(socket.gameId);
        if (!game) {
          return callback({ success: false, error: 'Partida no encontrada' });
        }

        const player = game.players.get(socket.id);
        const hasLine = game.checkLine(socket.id);

        if (hasLine && !game.winners.line) {
          game.winners.line = { id: socket.id, name: player.name };
          
          // Detener modo automático si está activo
          if (game.autoMode.enabled) {
            game.stopAutoMode();
            io.to(socket.gameId).emit(SOCKET_EVENTS.AUTO_MODE_CHANGED, {
              enabled: false,
              interval: game.autoMode.interval
            });
          }
          
          // Registrar ganador en BD
          db.saveWinner(socket.gameId, socket.id, player.name, 'line');
          
          io.to(socket.gameId).emit(SOCKET_EVENTS.LINE_WINNER, {
            player: { id: socket.id, name: player.name }
          });
          callback({ success: true, winner: true });
        } else {
          callback({ success: false, winner: false, error: 'No tienes línea válida' });
        }
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Reclamar bingo (desde móvil)
     */
    socket.on(SOCKET_EVENTS.CLAIM_BINGO, (callback) => {
      try {
        const game = gameManager.getGame(socket.gameId);
        if (!game) {
          return callback({ success: false, error: 'Partida no encontrada' });
        }

        const player = game.players.get(socket.id);
        const hasBingo = game.checkBingo(socket.id);

        if (hasBingo && !game.winners.bingo) {
          game.winners.bingo = { id: socket.id, name: player.name };
          
          // Detener modo automático si está activo
          if (game.autoMode.enabled) {
            game.stopAutoMode();
            io.to(socket.gameId).emit(SOCKET_EVENTS.AUTO_MODE_CHANGED, {
              enabled: false,
              interval: game.autoMode.interval
            });
          }
          
          // Registrar ganador en BD
          db.saveWinner(socket.gameId, socket.id, player.name, 'bingo');
          
          io.to(socket.gameId).emit(SOCKET_EVENTS.BINGO_WINNER, {
            player: { id: socket.id, name: player.name }
          });
          callback({ success: true, winner: true });
        } else {
          callback({ success: false, winner: false, error: 'No tienes bingo válido' });
        }
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // ==========================================
    // EVENTOS DE CONEXIÓN
    // ==========================================

    /**
     * Desconexión
     * Ahora marca al jugador como desconectado en lugar de eliminarlo
     */
    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
      
      if (socket.gameId) {
        const game = gameManager.getGame(socket.gameId);
        if (game) {
          if (socket.isTV) {
            // Si la TV se desconecta, notificar a los jugadores pero mantener la partida
            io.to(socket.gameId).emit(SOCKET_EVENTS.GAME_ENDED, {
              reason: 'La pantalla principal se ha desconectado'
            });
          } else {
            // Si un jugador se desconecta, marcarlo como desconectado (no eliminar)
            const disconnectedPlayer = game.disconnectPlayer(socket.id);
            
            if (disconnectedPlayer) {
              // Notificar que el jugador se desconectó (pero puede reconectarse)
              io.to(socket.gameId).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, {
                player: { id: socket.id, name: disconnectedPlayer.name },
                playersCount: game.getConnectedPlayersCount(),
                canReconnect: true
              });
            }
          }
        }
      }
    });
  });

  // Limpiar jugadores desconectados periódicamente (cada 5 minutos)
  setInterval(() => {
    const cleaned = db.cleanDisconnectedPlayers(30); // 30 minutos de timeout
    if (cleaned > 0) {
      console.log(`🧹 Limpieza automática: ${cleaned} jugadores desconectados eliminados`);
    }
  }, 5 * 60 * 1000);
}
