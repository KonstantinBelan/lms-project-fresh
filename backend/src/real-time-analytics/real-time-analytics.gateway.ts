import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RealTimeAnalyticsService } from './real-time-analytics.service';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://postman-echo.com',
      'https://websocketking.com',
      '*',
    ], // Разрешаем больше источников для тестов
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
    credentials: true,
  },
  namespace: 'analytics',
  port: 3000,
})
@Injectable()
export class RealTimeAnalyticsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly analyticsService: RealTimeAnalyticsService) {}

  handleConnection(client: Socket) {
    console.log('WebSocket connection established:', {
      clientId: client.id,
      namespace: client.nsp.name,
      handshake: client.handshake,
      headers: client.handshake.headers,
    });
  }

  handleDisconnect(client: Socket) {
    console.log('WebSocket disconnected:', {
      clientId: client.id,
      namespace: client.nsp.name,
      reason: client.disconnected,
    });
  }

  @SubscribeMessage('subscribe-progress')
  async handleSubscribeProgress(@MessageBody() data: { userId: string }) {
    console.log('Received subscribe-progress event:', {
      clientId: data.userId,
      data,
      clientHeaders: data.headers || 'No headers',
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
  async handleSubscribeActivity(@MessageBody() data: { courseId: string }) {
    console.log('Received subscribe-activity event:', {
      clientId: data.courseId,
      data,
      clientHeaders: data.headers || 'No headers',
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
}
