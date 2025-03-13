// src/notifications/notifications.service.interface.ts
import { NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

export interface INotificationsService {
  // Создание уведомления
  createNotification(dto: CreateNotificationDto): Promise<NotificationDocument>;

  // Поиск уведомлений по идентификатору пользователя
  findNotificationsByUser(userId: string): Promise<NotificationDocument[]>;

  // Отметка уведомления как прочитанного
  markAsRead(notificationId: string): Promise<NotificationDocument | null>;

  // Удаление уведомления
  deleteNotification(notificationId: string): Promise<void>;

  // Уведомление о прогрессе
  notifyProgress(
    userId: string,
    message: string,
    settings?: any,
  ): Promise<void>;

  // Уведомление о новом курсе
  notifyNewCourse(
    studentId: string,
    courseId: string,
    courseTitle: string,
    streamId?: string,
  ): Promise<void>;

  // Уведомление о дедлайне
  notifyDeadline(
    enrollmentId: string,
    daysLeft: number,
    courseTitle: string,
  ): Promise<void>;

  // Отправка уведомления одному пользователю
  sendNotificationToUser(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDocument | null>;

  // Отправка уведомления нескольким пользователям
  sendNotificationToBulk(
    notificationId: string,
    recipientIds?: string[],
  ): Promise<NotificationDocument | null>;

  // Получение уведомления по ключу (выбрасывает исключение, если не найдено)
  getNotificationByKey(key: string): Promise<NotificationDocument>;

  // Замена placeholder'ов в шаблоне
  replacePlaceholders(
    template: string,
    params: Record<string, string | number>,
  ): string;
}
