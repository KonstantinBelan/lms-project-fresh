const { io } = require('socket.io-client');

const socket = io('ws://localhost:3000/analytics', {
  transports: ['websocket'],
  cors: {
    origin: 'http://localhost:3000',
  },
});

socket.on('connect', () => {
  console.log('Connected to WebSocket with socket ID:', socket.id);
  socket.emit('subscribe-progress', { userId: '67c4d379a5c903e26a37557c' }); // Убедись, что userId валиден
  socket.emit('subscribe-activity', { courseId: '67c59b26be3880a60e6f53c5' }); // Убедись, что courseId валиден
});

socket.on('progress-update', (data) => {
  console.log('Received progress-update:', data);
});

socket.on('activity-update', (data) => {
  console.log('Received activity-update:', data);
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from WebSocket. Reason:', reason);
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
});

socket.on('reconnect', (attempt) => {
  console.log('Reconnected to WebSocket. Attempt:', attempt);
});
