import { Notification } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

export interface INotificationsService {
  createNotification(dto: CreateNotificationDto): Promise<Notification>;
  findNotificationsByUser(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<Notification | null>;
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
  ): Promise<Notification | null>;
  sendNotificationToBulk(
    notificationId: string,
    recipientIds?: string[],
  ): Promise<Notification | null>;
}
