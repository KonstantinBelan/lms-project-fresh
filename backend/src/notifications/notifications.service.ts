import { Injectable } from '@nestjs/common';
import { Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { INotificationsService } from './notifications.service.interface';
import { EnrollmentsService } from '../enrollments/enrollments.service';

@Injectable()
export class NotificationsService implements INotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @Inject(forwardRef(() => EnrollmentsService))
    private enrollmentsService: EnrollmentsService,
  ) {
    console.log(
      'NotificationsService initialized, enrollmentsService:',
      this.enrollmentsService,
    );
  }

  async createNotification(
    userId: string,
    message: string,
  ): Promise<Notification> {
    console.log(
      'Creating notification for userId:',
      userId,
      'message:',
      message,
    );
    const newNotification = new this.notificationModel({ userId, message });
    return newNotification.save();
  }

  async findNotificationsByUser(userId: string): Promise<Notification[]> {
    console.log('Finding notifications for userId:', userId);
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    console.log('Marking notification as read for id:', notificationId);
    return this.notificationModel
      .findByIdAndUpdate(notificationId, { isRead: true }, { new: true })
      .exec();
  }

  async deleteNotification(notificationId: string): Promise<void> {
    console.log('Deleting notification for id:', notificationId);
    await this.notificationModel.findByIdAndDelete(notificationId).exec();
  }

  async notifyProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void> {
    console.log(
      'Notifying progress for enrollmentId:',
      enrollmentId,
      'moduleId:',
      moduleId,
      'lessonId:',
      lessonId,
    );
    const enrollment =
      await this.enrollmentsService.findEnrollmentById(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    const message = `You completed lesson "${lessonId}" in module "${moduleId}" of course "${enrollment.courseId}"`;
    await this.createNotification(enrollment.studentId, message);
  }

  async notifyNewCourse(
    studentId: string,
    courseId: string,
    courseTitle: string,
  ): Promise<void> {
    const message = `New course available: "${courseTitle}" (ID: ${courseId})`;
    await this.createNotification(studentId, message);
  }

  async notifyDeadline(
    enrollmentId: string,
    daysLeft: number,
    courseTitle: string,
  ): Promise<void> {
    const enrollment =
      await this.enrollmentsService.findEnrollmentById(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    const message = `You have ${daysLeft} days left to complete "${courseTitle}"`;
    await this.createNotification(enrollment.studentId, message);
  }
}
