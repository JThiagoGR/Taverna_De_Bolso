const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

const rooms = {};

io.on('connection', (socket) => {
  socket.on('join', (data) => {
    socket.join(data.room);
    if (!rooms[data.room]) {
      rooms[data.room] = {
        players: [], walls: [], map: null, fog: false,
        light: 0, zoom: 1, offsetX: 0, offsetY: 0
      };
    }
    const room = rooms[data.room];
    const player = {
      id: socket.id, name: data.name, isMaster: data.isMaster,
      ownerId: socket.id, x: 100 + Math.random()*200, y: 100 + Math.random()*200,
      hp: 20, maxHp: 20, ca: 15, light: 0, isNpc: false
    };
    room.players = room.players.filter(p => p.ownerId !== socket.id);
    room.players.push(player);
    
    socket.emit('joined', { pid: socket.id, isMaster: data.isMaster });
    socket.emit('state', room);
    socket.to(data.room).emit('playerJoined', player);
  });

  socket.on('move', (data) => {
    const room = rooms[data.room];
    if (!room) return;
    const player = room.players.find(p => p.id === data.id);
    if (player) {
      player.x = data.x; player.y = data.y;
      io.to(data.room).emit('playerMoved', player);
    }
  });

  socket.on('addWall', (data) => {
    const room = rooms[data.room];
    if (!room) return;
    room.walls.push(data.wall);
    io.to(data.room).emit('wallAdded', data.wall);
  });

  socket.on('clearWalls', (data) => {
    const room = rooms[data.room];
    if (!room) return;
    room.walls = [];
    io.to(data.room).emit('wallsCleared');
  });

  socket.on('addNpc', (data) => {
    const room = rooms[data.room];
    if (!room) return;
    const npc = {
      id: 'n' + Date.now(), name: data.name, hp: data.hp, maxHp: data.maxHp,
      ca: data.ca, light: 0, isNpc: true, x: 200, y: 200, ownerId: null
    };
    room.players.push(npc);
    io.to(data.room).emit('playerAdded', npc);
  });

  socket.on('updateNpc', (data) => {
    const room = rooms[data.room];
    if (!room) return;
    const npc = room.players.find(p => p.id === data.id);
    if (npc) {
      Object.assign(npc, data.updates);
      io.to(data.room).emit('playerUpdated', npc);
    }
  });

  socket.on('setMap', (data) => {
    const room = rooms[data.room];
    if (!room) return;
    room.map = data.mapData;
    io.to(data.room).emit('mapUpdated', data.mapData);
  });

  socket.on('setFog', (data) => {
    const room = rooms[data.room];
    if (!room) return;
    room.fog = data.fog;
    io.to(data.room).emit('fogUpdated', data.fog);
  });

  socket.on('setLight', (data) => {
    const room = rooms[data.room];
    if (!room) return;
    room.light = data.light;
    io.to(data.room).emit('lightUpdated', data.light);
  });

  socket.on('setZoom', (data) => {
    const room = rooms[data.room];
    if (!room) return;
    room.zoom = data.zoom; room.offsetX = data.offsetX; room.offsetY = data.offsetY;
    io.to(data.room).emit('zoomUpdated', data);
  });

  socket.on('setRuler', (data) => {
    io.to(data.room).emit('rulerUpdated', data.ruler);
  });

  socket.on('roll', (data) => {
    io.to(data.room).emit('rollResult', data);
  });

  socket.on('disconnect', () => {
    for (const roomName in rooms) {
      const room = rooms[roomName];
      const idx = room.players.findIndex(p => p.ownerId === socket.id && !p.isNpc);
      if (idx >= 0) {
        const player = room.players[idx];
        room.players.splice(idx, 1);
        io.to(roomName).emit('playerLeft', player.id);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🍺 Taverna De Bolso rodando na porta ${PORT}`);
});
