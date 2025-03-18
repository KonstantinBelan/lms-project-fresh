import { ApiProperty } from '@nestjs/swagger';
import { Notification } from '../schemas/notification.schema';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Идентификатор уведомления',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Заголовок уведомления',
    example: 'Новое задание',
  })
  title: string;

  @ApiProperty({
    description: 'Сообщение уведомления',
    example: 'Проверьте новое задание в курсе Nest.js',
  })
  message: string;

  @ApiProperty({
    description: 'Уникальный ключ для шаблона (опционально)',
    example: 'new_assignment',
    required: false,
  })
  key?: string;

  @ApiProperty({
    description: 'Идентификатор получателя (опционально)',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  userId?: string;

  @ApiProperty({
    description: 'Массив идентификаторов получателей для массовых уведомлений',
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    type: [String],
  })
  recipients?: string[];

  @ApiProperty({
    description: 'Прочитано ли уведомление',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Отправлено ли уведомление',
    example: true,
  })
  isSent: boolean;

  @ApiProperty({
    description: 'Дата и время отправки (опционально)',
    example: '2025-03-18T10:00:00Z',
    required: false,
  })
  sentAt?: string;

  constructor(notification: Notification) {
    // this._id = notification._id.toString();
    this.title = notification.title;
    this.message = notification.message;
    this.key = notification.key;
    this.userId = notification.userId?.toString();
    this.recipients = notification.recipients?.map((id) => id.toString()) || [];
    this.isRead = notification.isRead;
    this.isSent = notification.isSent;
    this.sentAt = notification.sentAt?.toISOString();
  }
}
