import { ApiProperty } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({
    description: 'ID уведомления',
    example: '507f1f77bcf86cd799439016',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Заголовок уведомления для админ-панели',
    example: 'Новое обновление',
    type: String,
  })
  title: string;

  @ApiProperty({
    description: 'Сообщение уведомления',
    example: 'Пожалуйста, проверьте новые функции в системе.',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Уникальный ключ для шаблона (опционально)',
    example: 'update_001',
    required: false,
    type: String,
  })
  key?: string;

  @ApiProperty({
    description: 'Идентификатор одного получателя (опционально)',
    example: '507f1f77bcf86cd799439012',
    required: false,
    type: String,
  })
  userId?: string;

  @ApiProperty({
    description: 'Массив идентификаторов получателей для массовых уведомлений',
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    type: [String],
    default: [],
  })
  recipients: string[];

  @ApiProperty({
    description: 'Прочитано ли уведомление',
    example: false,
    type: Boolean,
    default: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Отправлено ли уведомление',
    example: false,
    type: Boolean,
    default: false,
  })
  isSent: boolean;

  @ApiProperty({
    description: 'Дата и время отправки (опционально)',
    example: '2025-03-16T12:00:00Z',
    required: false,
    type: String,
  })
  sentAt?: string;

  @ApiProperty({
    description: 'Дата создания уведомления',
    example: '2025-03-16T10:00:00Z',
    type: String,
  })
  createdAt: string;

  @ApiProperty({
    description: 'Дата последнего обновления уведомления',
    example: '2025-03-16T10:00:00Z',
    type: String,
  })
  updatedAt: string;
}
