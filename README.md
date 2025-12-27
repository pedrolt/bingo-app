# 🎱 Bingo App

Aplicación de bingo multijugador en tiempo real.

## 📁 Estructura del Proyecto

```
bingo-app/
├── server/          # Backend Node.js + Socket.io
├── tv-display/      # Interfaz para Smart TV (React)
├── mobile-app/      # PWA para jugadores (React)
└── shared/          # Código compartido (tipos, constantes)
```

## 🚀 Características

- 📺 Pantalla principal para Smart TV con animación del bombo
- 📱 Cartones interactivos en dispositivos móviles
- 🔄 Sincronización en tiempo real via WebSocket
- 🎤 Voz sintetizada para cantar números
- 🎨 Interfaz moderna y responsive
- 📲 Unirse a partidas escaneando código QR

## 🛠️ Tecnologías

- **Backend**: Node.js, Express, Socket.io
- **Frontend TV**: React, Vite, Framer Motion
- **Mobile PWA**: React, Vite, PWA
- **Comunicación**: WebSocket (Socket.io)

## 📋 Requisitos

- Node.js 18+
- npm o yarn

## 🎮 Cómo jugar

1. Inicia el servidor
2. Abre la pantalla TV en tu Smart TV
3. Los jugadores escanean el código QR con sus móviles
4. ¡A jugar!

## 📜 Licencia

MIT
