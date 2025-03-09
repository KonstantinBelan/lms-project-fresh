// src/notifications/notifications.gateway.ts
import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } }) // Разрешаем подключение с любого источника (для разработки)
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  // Логируем подключение клиента
  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Клиент подписывается на уведомления, указывая свой userId
  @SubscribeMessage('subscribe')
  handleSubscription(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.userId) {
      client.emit('error', { message: 'userId is required' });
      return;
    }
    client.join(data.userId); // Клиент加入到以userId命名的房间
    this.logger.log(
      `Client ${client.id} subscribed to notifications for user ${data.userId}`,
    );
  }

  // Метод для отправки уведомления конкретному пользователю
  async notifyUser(userId: string, message: string) {
    this.server.to(userId).emit('notification', {
      message,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Notification sent to user ${userId}: ${message}`);
  }
}
