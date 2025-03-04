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
    origin: '*', // Разрешаем все источники для тестов, настрой под свои нужды в продакшене
  },
  namespace: 'analytics',
})
@Injectable()
export class RealTimeAnalyticsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly analyticsService: RealTimeAnalyticsService) {}

  @SubscribeMessage('subscribe-progress')
  async handleSubscribeProgress(@MessageBody() userId: string) {
    const progress = await this.analyticsService.getStudentProgress(userId);
    this.server.to(userId).emit('progress-update', progress);
  }

  @SubscribeMessage('subscribe-activity')
  async handleSubscribeActivity(@MessageBody() courseId: string) {
    const activity = await this.analyticsService.getCourseActivity(courseId);
    this.server.to(courseId).emit('activity-update', activity);
  }
}
