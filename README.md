# 🎱 Bingo App

Aplicación de Bingo 90 (europeo) multijugador en tiempo real para reuniones familiares.

## 📁 Estructura del Proyecto

```
bingo-app/
├── server/          # Backend Node.js + Socket.io + SQLite
│   ├── src/
│   │   ├── database/    # Servicio de persistencia SQLite
│   │   ├── game/        # Lógica del juego (BingoGame, CardGenerator, GameManager)
│   │   ├── socket/      # Manejadores de WebSocket
│   │   └── index.js     # Punto de entrada
│   ├── data/            # Base de datos SQLite (bingo.db)
│   └── shared/          # Constantes compartidas
├── tv-display/      # Interfaz para Smart TV (React + Vite)
│   └── src/
│       ├── components/  # WaitingRoom, GameBoard, NumbersBoard, etc.
│       ├── hooks/       # useSocket
│       └── services/    # SpeechService, SoundService
├── mobile-app/      # PWA para jugadores (React + Vite)
│   └── src/
│       ├── components/  # BingoCard, JoinGame, WinnerModal, etc.
│       ├── hooks/       # usePlayerSocket
│       └── services/    # SoundService
└── README.md
```

## 🚀 Características

- 📺 **Pantalla TV**: Display principal para Smart TV con animación del bombo
- 📱 **App Móvil PWA**: Cartones interactivos en dispositivos móviles
- 🔄 **Tiempo real**: Sincronización via WebSocket (Socket.io)
- 💾 **Persistencia**: SQLite para guardar partidas y restaurar al reiniciar
- 🎤 **Síntesis de voz**: Los números se cantan en voz alta (Web Speech API)
- 🎵 **Efectos de sonido**: Audio generado con Web Audio API
- 📲 **Código QR**: Unirse a partidas escaneando desde el móvil
- 📳 **Vibración táctil**: Feedback háptico en móviles al marcar números

## 🎯 Formato Bingo 90 (Europeo)

- **90 números** (1-90)
- **Cartones 3×9**: 3 filas y 9 columnas
- **15 números por cartón**: 5 por fila, con casillas vacías
- **Columnas organizadas**:
  - Columna 1: 1-9
  - Columna 2: 10-19
  - ...
  - Columna 9: 80-90
- **Premios**: Línea (5 números de una fila) y Bingo (15 números completos)

## 🛠️ Tecnologías

| Componente | Tecnologías |
|------------|-------------|
| **Backend** | Node.js, Express, Socket.io, UUID, better-sqlite3 |
| **TV Display** | React, Vite, Framer Motion, canvas-confetti |
| **Mobile PWA** | React, Vite, vite-plugin-pwa, Framer Motion |
| **Audio** | Web Speech API (voz), Web Audio API (efectos) |
| **Base de datos** | SQLite (persistencia local) |
| **Comunicación** | WebSocket (Socket.io) |

## 💾 Persistencia (SQLite)

La aplicación utiliza SQLite para persistir el estado de las partidas:

- **Partidas**: Se guardan automáticamente (estado, números cantados, configuración)
- **Jugadores**: Cartones y números marcados persistidos
- **Ganadores**: Historial de ganadores (línea y bingo)
- **Restauración**: Al reiniciar el servidor, las partidas activas se restauran

### API REST

| Endpoint | Descripción |
|----------|-------------|
| `GET /` | Estado del servidor |
| `GET /api/health` | Health check |
| `GET /api/stats` | Estadísticas (partidas, jugadores, ganadores) |

## 📋 Requisitos

- Node.js 18+
- npm o yarn
- Navegador moderno con soporte para Web Speech API

## 🔧 Instalación

```bash
# Clonar repositorio
git clone https://github.com/pedrolt/bingo-app.git
cd bingo-app

# Instalar dependencias del servidor
cd server && npm install

# Instalar dependencias de TV Display
cd ../tv-display && npm install

# Instalar dependencias de Mobile App
cd ../mobile-app && npm install
```

## ▶️ Ejecución

```bash
# Terminal 1: Servidor (puerto 3000)
cd server && npm start

# Terminal 2: TV Display (puerto 5173)
cd tv-display && npm run dev

# Terminal 3: Mobile App (puerto 5174)
cd mobile-app && npm run dev
```

## 🎮 Cómo jugar

1. **Inicia los 3 servicios** (servidor, TV, móvil)
2. **Abre la TV** en http://localhost:5173 (o en tu Smart TV)
3. **Crea una partida** haciendo clic en "Crear Nueva Partida"
4. **Los jugadores** escanean el código QR con sus móviles
5. **Inicia el juego** cuando todos estén conectados
6. **El presentador** hace clic para sacar números
7. **Los jugadores** marcan los números en sus cartones
8. **¡Gana!** el primero en completar una línea o bingo completo

## 🔊 Controles de Audio

En la esquina superior derecha de la pantalla TV:
- 🎵 Activar/desactivar efectos de sonido
- 🔊 Activar/desactivar voz sintética
- 🎤 Probar que el audio funciona

## 📡 Eventos WebSocket

| Evento | Descripción |
|--------|-------------|
| `game:create` | TV crea nueva partida |
| `game:join` | Jugador se une |
| `game:start` | Iniciar partida |
| `game:call-number` | Sacar número |
| `game:mark-number` | Marcar número en cartón |
| `game:claim-line` | Reclamar línea |
| `game:claim-bingo` | Reclamar bingo |

## 📜 Licencia

MIT
