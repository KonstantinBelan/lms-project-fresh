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
import { UsersService } from '../users/users.service';
import * as nodemailer from 'nodemailer';
import * as TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/config';

@Injectable()
export class NotificationsService implements INotificationsService {
  private transporter: nodemailer.Transporter;
  private telegramBot: TelegramBot;

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @Inject(forwardRef(() => EnrollmentsService))
    private enrollmentsService: EnrollmentsService,
    private usersService: UsersService, // Инжектируем UsersService напрямую
  ) {
    console.log(
      'NotificationsService initialized, enrollmentsService:',
      this.enrollmentsService,
    );

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false, // true для 465, false для других портов
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: false, // Игнорировать ошибки сертификатов (для тестов, убери в продакшене)
      },
    });

    this.telegramBot = new TelegramBot(config.telegram.botToken, {
      polling: false,
    });
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
    await this.sendEmail(enrollment.studentId, message);
    await this.sendTelegram(message);
  }

  async notifyNewCourse(
    studentId: string,
    courseId: string,
    courseTitle: string,
  ): Promise<void> {
    const message = `New course available: "${courseTitle}" (ID: ${courseId})`;
    await this.createNotification(studentId, message);
    await this.sendEmail(studentId, message);
    await this.sendTelegram(message);
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
    await this.sendEmail(enrollment.studentId, message);
    await this.sendTelegram(message);
  }

  private async sendEmail(userId: string, message: string): Promise<void> {
    const user = await this.usersService.findById(userId); // Используем UsersService напрямую
    if (!user || !user.email) {
      console.warn('User or email not found for ID:', userId);
      return;
    }

    const mailOptions = {
      from: config.email.user,
      to: user.email,
      subject: 'LMS Notification',
      text: message,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email sent to:', user.email, 'with message:', message);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email notification');
    }
  }

  private async sendTelegram(message: string): Promise<void> {
    try {
      await this.telegramBot.sendMessage(config.telegram.chatId, message);
      console.log('Telegram message sent:', message);
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      throw new Error('Failed to send Telegram notification');
    }
  }
}
