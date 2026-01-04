/**
 * 🎱 Bingo Server
 * Servidor principal de la aplicación de Bingo
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './game/GameManager.js';
import { setupSocketHandlers } from './socket/handlers.js';

const app = express();
const httpServer = createServer(app);

// Configuración de CORS
app.use(cors());
app.use(express.json());

// Configuración de Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Instancia del gestor de juegos
const gameManager = new GameManager();

// Inicializar GameManager con persistencia
await gameManager.init();

// Configurar manejadores de Socket
setupSocketHandlers(io, gameManager);

// Rutas REST básicas
app.get('/', (req, res) => {
  res.json({ 
    message: '🎱 Bingo Server está funcionando',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint para estadísticas
app.get('/api/stats', (req, res) => {
  res.json(gameManager.getStats());
});

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  gameManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  gameManager.shutdown();
  process.exit(0);
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🎱 Bingo Server iniciado en http://localhost:${PORT}`);
});
