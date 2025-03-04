const { io } = require('socket.io-client');

const socket = io('ws://localhost:3000/analytics', {
  transports: ['websocket'],
  cors: {
    origin: 'http://localhost:3000',
  },
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
  socket.emit('subscribe-progress', { userId: '67c4d379a5c903e26a37557c' }); // Убедись, что userId валиден
});

socket.on('progress-update', (data) => {
  console.log('Progress update:', data);
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket');
});
