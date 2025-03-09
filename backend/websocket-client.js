const io = require('socket.io-client');

// Подключаемся к WebSocket-серверу
const socket = io('ws://localhost:3000', {
  transports: ['websocket'], // Указываем только WebSocket, без polling
});

// Обработка подключения
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  // Подписываемся на уведомления
  socket.emit('subscribe', { userId: '67c92217f30e0a8bcd56bf86' });
  console.log('Subscribed with userId: 67c92217f30e0a8bcd56bf86');
});

// Обработка получения уведомлений
socket.on('notification', (data) => {
  console.log('Received notification:', data);
});

// Обработка ошибок
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Обработка отключения
socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
