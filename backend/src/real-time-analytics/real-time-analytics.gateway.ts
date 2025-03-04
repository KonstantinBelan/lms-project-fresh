import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RealTimeAnalyticsService } from './real-time-analytics.service';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://postman-echo.com',
    ], // Добавляем Postman для тестов
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  namespace: 'analytics',
  port: 3000,
})
@Injectable()
export class RealTimeAnalyticsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly analyticsService: RealTimeAnalyticsService) {}

  @SubscribeMessage('subscribe-progress')
  async handleSubscribeProgress(@MessageBody() data: { userId: string }) {
    console.log('WebSocket subscribed to progress for userId:', data.userId);
    try {
      const progress = await this.analyticsService.getStudentProgress(
        data.userId,
      );
      this.server.to(data.userId).emit('progress-update', progress);
    } catch (error) {
      console.error('Failed to handle subscribe-progress:', error);
      this.server.to(data.userId).emit('error', {
        message: 'Failed to get progress',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('subscribe-activity')
  async handleSubscribeActivity(@MessageBody() data: { courseId: string }) {
    console.log(
      'WebSocket subscribed to activity for courseId:',
      data.courseId,
    );
    try {
      const activity = await this.analyticsService.getCourseActivity(
        data.courseId,
      );
      this.server.to(data.courseId).emit('activity-update', activity);
    } catch (error) {
      console.error('Failed to handle subscribe-activity:', error);
      this.server.to(data.courseId).emit('error', {
        message: 'Failed to get activity',
        error: error.message,
      });
    }
  }
}
