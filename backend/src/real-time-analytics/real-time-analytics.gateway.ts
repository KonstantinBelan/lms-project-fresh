import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket, Namespace } from 'socket.io'; // Импортируем Namespace
import { RealTimeAnalyticsService } from './real-time-analytics.service';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Разрешить все источники для тестов, в продакшене уточни домены
    methods: ['GET', 'POST'],
    allowedHeaders: ['*'], // Разрешить все заголовки для тестов
    credentials: false, // Отключить credentials, чтобы избежать конфликтов
  },
  namespace: 'analytics',
}) // Убрали порт, чтобы использовать порт приложения (3000 по умолчанию)
@Injectable()
export class RealTimeAnalyticsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Namespace; // Изменяем тип на Namespace, чтобы использовать nsp

  constructor(private readonly analyticsService: RealTimeAnalyticsService) {}

  afterInit(server: Namespace) {
    console.log('WebSocket gateway initialized with server:', server.name); // Используем server.name вместо server.nsp.name
    // Логирование и настройка событий на уровне сервера
    server.on('connection', (client: Socket) => {
      console.log('Server-level WebSocket connection:', {
        clientId: client.id,
        namespace: server.name, // Используем server.name
        handshake: client.handshake,
        headers: client.handshake.headers,
        query: client.handshake.query,
      });
    });

    server.on('error', (error) => {
      console.error('Server-level WebSocket error:', error);
    });

    server.on('disconnection', (client: Socket) => {
      console.log('Server-level WebSocket disconnection:', {
        clientId: client.id,
        namespace: server.name, // Используем server.name
        reason: client.disconnected,
      });
    });
  }

  handleConnection(client: Socket) {
    console.log('Gateway-level WebSocket connection attempt:', {
      clientId: client.id,
      namespace: (this.server as Namespace).name, // Явно приводим тип для совместимости
      handshake: client.handshake,
      headers: client.handshake.headers,
      query: client.handshake.query,
    });
    try {
      client.join(client.handshake.query.room || client.id);
      console.log(
        'Client successfully joined room:',
        client.handshake.query.room || client.id,
      );
    } catch (error) {
      console.error('Error in WebSocket connection:', error);
      client.emit('error', {
        message: 'Connection error',
        error: error.message,
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Gateway-level WebSocket disconnection:', {
      clientId: client.id,
      namespace: (this.server as Namespace).name, // Явно приводим тип для совместимости
      reason: client.disconnected,
      time: new Date().toISOString(),
    });
  }

  @SubscribeMessage('subscribe-progress')
  async handleSubscribeProgress(
    @MessageBody() data: { userId: string; headers?: Record<string, string> },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Received subscribe-progress event:', {
      clientId: data.userId,
      data,
      clientHeaders: data.headers || client.handshake.headers || 'No headers',
      clientIp: client.handshake.address,
      clientQuery: client.handshake.query,
    });
    try {
      const progress = await this.analyticsService.getStudentProgress(
        data.userId,
      );
      console.log('Emitting progress-update:', {
        userId: data.userId,
        progress,
      });
      this.server.to(data.userId).emit('progress-update', progress);
    } catch (error) {
      console.error('Error in subscribe-progress:', error);
      this.server.to(data.userId).emit('error', {
        message: 'Failed to get progress',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('subscribe-activity')
  async handleSubscribeActivity(
    @MessageBody() data: { courseId: string; headers?: Record<string, string> },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Received subscribe-activity event:', {
      clientId: data.courseId,
      data,
      clientHeaders: data.headers || client.handshake.headers || 'No headers',
      clientIp: client.handshake.address,
      clientQuery: client.handshake.query,
    });
    try {
      const activity = await this.analyticsService.getCourseActivity(
        data.courseId,
      );
      console.log('Emitting activity-update:', {
        courseId: data.courseId,
        activity,
      });
      this.server.to(data.courseId).emit('activity-update', activity);
    } catch (error) {
      console.error('Error in subscribe-activity:', error);
      this.server.to(data.courseId).emit('error', {
        message: 'Failed to get activity',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('subscribe-notifications')
  async handleSubscribeNotifications(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Received subscribe-notifications event:', {
      clientId: data.userId,
      data,
      clientHeaders: client.handshake.headers || 'No headers',
      clientIp: client.handshake.address,
      clientQuery: client.handshake.query,
    });
    // Здесь можно добавить логику получения уведомлений через NotificationsService
    this.server.to(data.userId).emit('notification', {
      message: 'New notification received',
      userId: data.userId,
    });
  }
}
