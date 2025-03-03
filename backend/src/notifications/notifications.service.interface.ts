import { Notification } from './schemas/notification.schema';

export interface INotificationsService {
  createNotification(userId: string, message: string): Promise<Notification>;
  findNotificationsByUser(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<Notification | null>;
  deleteNotification(notificationId: string): Promise<void>;
  notifyProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void>;
  notifyNewCourse(
    studentId: string,
    courseId: string,
    courseTitle: string,
  ): Promise<void>;
  notifyDeadline(
    enrollmentId: string,
    daysLeft: number,
    courseTitle: string,
  ): Promise<void>;
}
