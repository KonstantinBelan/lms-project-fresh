// src/notifications/notifications.service.interface.ts
import { NotificationDocument } from './schemas/notification.schema'; // Добавляем импорт
import { CreateNotificationDto } from './dto/create-notification.dto';

export interface INotificationsService {
  createNotification(dto: CreateNotificationDto): Promise<NotificationDocument>;
  findNotificationsByUser(userId: string): Promise<NotificationDocument[]>;
  markAsRead(notificationId: string): Promise<NotificationDocument | null>;
  deleteNotification(notificationId: string): Promise<void>;
  notifyProgress(
    userId: string,
    message: string,
    settings?: any,
  ): Promise<void>;
  notifyNewCourse(
    studentId: string,
    courseId: string,
    courseTitle: string,
    streamId?: string,
  ): Promise<void>;
  notifyDeadline(
    enrollmentId: string,
    daysLeft: number,
    courseTitle: string,
  ): Promise<void>;
  sendNotificationToUser(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDocument | null>;
  sendNotificationToBulk(
    notificationId: string,
    recipientIds?: string[],
  ): Promise<NotificationDocument | null>;
  getNotificationByKey(key: string): Promise<NotificationDocument>; // Убираем null, так как throw гарантирует результат
  replacePlaceholders(
    template: string,
    params: Record<string, string | number>,
  ): string;
}
