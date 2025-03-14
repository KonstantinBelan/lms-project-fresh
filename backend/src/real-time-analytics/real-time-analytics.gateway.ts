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
import { Namespace, Socket } from 'socket.io';
import { RealTimeAnalyticsService } from './real-time-analytics.service';
import { Injectable, Logger } from '@nestjs/common';

// Интерфейс для данных подписки на прогресс
interface ISubscribeProgressData {
  userId: string;
  headers?: Record<string, string>;
}

// Интерфейс для данных подписки на активность
interface ISubscribeActivityData {
  courseId: string;
  headers?: Record<string, string>;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['*'],
    credentials: false,
  },
  namespace: 'analytics',
})
@Injectable()
export class RealTimeAnalyticsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Namespace;

  private readonly logger = new Logger(RealTimeAnalyticsGateway.name);

  constructor(private readonly analyticsService: RealTimeAnalyticsService) {}

  afterInit(server: Namespace) {
    this.logger.log(`Инициализация WebSocket шлюза: ${server.name}`);
    server.on('connection', (client: Socket) => {
      this.logger.log(`Подключение на уровне сервера: ${client.id}`);
    });
    server.on('error', (error) => {
      this.logger.error(`Ошибка WebSocket сервера: ${error.message}`);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(
      `Подключение клиента: ${client.id}, namespace: ${this.server.name}`,
    );
    try {
      const room = client.handshake.query.room || client.id;
      client.join(room);
      this.logger.log(`Клиент ${client.id} подключен к комнате: ${room}`);
    } catch (error) {
      this.logger.error(
        `Ошибка подключения клиента ${client.id}: ${error.message}`,
      );
      client.emit('error', {
        message: 'Ошибка подключения',
        error: error.message,
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `Отключение клиента: ${client.id}, namespace: ${this.server.name}`,
    );
  }

  @SubscribeMessage('subscribe-progress')
  async handleSubscribeProgress(
    @MessageBody() data: ISubscribeProgressData,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Подписка на прогресс: ${data.userId}`);
    try {
      const progress = await this.analyticsService.getStudentProgress(
        data.userId,
      );
      this.server.to(data.userId).emit('progress-update', progress);
    } catch (error) {
      this.logger.error(
        `Ошибка подписки на прогресс ${data.userId}: ${error.message}`,
      );
      this.server.to(data.userId).emit('error', {
        message: 'Ошибка получения прогресса',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('subscribe-activity')
  async handleSubscribeActivity(
    @MessageBody() data: ISubscribeActivityData,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Подписка на активность: ${data.courseId}`);
    try {
      const activity = await this.analyticsService.getCourseActivity(
        data.courseId,
      );
      this.server.to(data.courseId).emit('activity-update', activity);
    } catch (error) {
      this.logger.error(
        `Ошибка подписки на активность ${data.courseId}: ${error.message}`,
      );
      this.server.to(data.courseId).emit('error', {
        message: 'Ошибка получения активности',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('subscribe-notifications')
  async handleSubscribeNotifications(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Подписка на уведомления: ${data.userId}`);
    this.server.to(data.userId).emit('notification', {
      message: 'Получено новое уведомление',
      userId: data.userId,
    });
  }
}
