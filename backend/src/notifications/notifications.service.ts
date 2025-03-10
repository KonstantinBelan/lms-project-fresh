import { Injectable, Logger } from '@nestjs/common';
import { Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';
import { INotificationsService } from './notifications.service.interface';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';
import * as nodemailer from 'nodemailer';
import * as TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/config';
import { Course } from '../courses/schemas/course.schema';
import { Module } from '../courses/schemas/module.schema';
import { Lesson } from '../courses/schemas/lesson.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';

@Injectable()
export class NotificationsService implements INotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;
  private telegramBot: TelegramBot;

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @Inject(forwardRef(() => EnrollmentsService))
    private enrollmentsService: EnrollmentsService,
    private usersService: UsersService,
    @Inject(forwardRef(() => CoursesService))
    private coursesService: CoursesService, // Инжектируем CoursesService
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {
    this.logger.log(
      'NotificationsService initialized, enrollmentsService:',
      !!this.enrollmentsService,
    );

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.telegramBot = new TelegramBot(config.telegram.botToken, {
      polling: true,
    });

    this.telegramBot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id.toString();
      this.telegramBot.sendMessage(
        chatId,
        `Your Telegram chat ID is: ${chatId}. Use this ID to connect your account in the LMS.`,
      );
    });
  }

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationDocument> {
    this.logger.log(`Creating notification with DTO: ${JSON.stringify(dto)}`);
    const newNotification = new this.notificationModel({
      title: dto.title,
      message: dto.message,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
      recipients: dto.recipients?.map((id) => new Types.ObjectId(id)) || [],
    });
    return newNotification.save();
  }

  async findNotificationsByUser(userId: string): Promise<Notification[]> {
    this.logger.log(`Finding notifications for userId: ${userId}`);
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    this.logger.log(`Marking notification as read for id: ${notificationId}`);
    return this.notificationModel
      .findByIdAndUpdate(notificationId, { isRead: true }, { new: true })
      .exec();
  }

  async deleteNotification(notificationId: string): Promise<void> {
    this.logger.log(`Deleting notification for id: ${notificationId}`);
    await this.notificationModel.findByIdAndDelete(notificationId).exec();
  }

  public async sendEmail(
    userId: string,
    subject: string | null,
    message: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.email) {
      this.logger.warn(`User or email not found for ID: ${userId}`);
      return;
    }

    this.logger.log(`Sending email to: ${user.email}, message: ${message}`);

    const mailOptions = {
      from: `"LMS Platform" <${process.env.EMAIL_USER}>`,
      to: 'kosbelan@yandex.ru', // Замени на user.email в продакшене
      subject: subject,
      text: message,
      html: `<p>${message}</p>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to: ${user.email}`);
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw new Error(`Failed to send email notification: ${error.message}`);
    }
  }

  public async sendTelegram(userId: string, message: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.telegramId) {
      this.logger.warn(`User or Telegram ID not found for ID: ${userId}`);
      return;
    }

    try {
      await this.telegramBot.sendMessage(user.telegramId, message);
      this.logger.log(
        `Telegram message sent to ${user.telegramId}: ${message}`,
      );
    } catch (error) {
      this.logger.error('Failed to send Telegram message:', error);
      throw new Error(`Failed to send Telegram notification: ${error.message}`);
    }
  }

  public async sendSMS(userId: string, message: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.phone) {
      this.logger.warn(`User or phone number not found for ID: ${userId}`);
      return;
    }

    const phone = user.phone;
    const apiKey = process.env.SMS_RU_API_KEY;
    if (!apiKey) {
      throw new Error('SMS_RU_API_KEY is not configured in .env');
    }

    this.logger.log(`Sending SMS to: ${phone}, message: ${message}`);

    try {
      const response = await axios.get('https://sms.ru/sms/send', {
        params: {
          api_id: apiKey,
          to: phone,
          text: message,
          json: 1,
        },
      });

      this.logger.log('SMS.ru API response:', response.data);

      if (response.data.status === 'OK') {
        this.logger.log(`SMS sent successfully to: ${phone}`);
      } else {
        this.logger.error('Failed to send SMS:', response.data);
        throw new Error(`Failed to send SMS: ${response.data.error}`);
      }
    } catch (error) {
      this.logger.error('Failed to send SMS:', error);
      throw new Error(`Failed to send SMS notification: ${error.message}`);
    }
  }

  // async notifyProgress(
  //   enrollmentId: string,
  //   moduleId: string | undefined,
  //   lessonId: string,
  //   customMessage?: string,
  // ): Promise<void> {
  //   const cacheKey = `notification:progress:${enrollmentId}:${moduleId || 'no-module'}:${lessonId}`;
  //   const cachedNotification = await this.cacheManager.get<any>(cacheKey);
  //   if (cachedNotification) {
  //     this.logger.log(
  //       `Notification found in cache for progress: ${cachedNotification}`,
  //     );
  //     return;
  //   }

  //   const enrollment =
  //     await this.enrollmentsService.findEnrollmentById(enrollmentId);
  //   if (!enrollment) throw new Error('Enrollment not found');

  //   const courseId = enrollment.courseId.toString();
  //   if (!courseId) throw new Error('Course ID not found in enrollment');

  //   const course = (await this.coursesService.findCourseById(
  //     courseId,
  //   )) as Course;
  //   if (!course) throw new Error('Course not found');

  //   // const module = await this.coursesService.findModuleById(moduleId);
  //   const moduleTitle = moduleId
  //     ? (await this.coursesService.findModuleById(moduleId))?.title || moduleId
  //     : 'Unknown Module'; // Обрабатываем случай, когда moduleId не указан

  //   const lesson = await this.coursesService.findLessonById(lessonId);
  //   const lessonTitle = lesson?.title || lessonId;

  //   const message =
  //     customMessage ||
  //     (lessonId
  //       ? `You have completed lesson ${lessonTitle} in course "${course.title}".`
  //       : `Progress updated for module ${moduleTitle} in course "${course.title}".`);
  //   const subject = 'LMS Progress Update';

  //   await this.createNotification(enrollment.studentId, message);
  //   await this.sendEmail(enrollment.studentId, subject, message);
  //   await this.sendTelegram(enrollment.studentId, message);
  //   await this.sendSMS(enrollment.studentId, message);

  //   await this.cacheManager.set(cacheKey, message, 3600);
  // }

  async notifyProgress(
    userId: string,
    message: string,
    settings?: any,
  ): Promise<void> {
    const cacheKey = `notification:${userId}:${message}`;
    const cachedNotification = await this.cacheManager.get(cacheKey);
    if (cachedNotification) {
      this.logger.debug(`Notification already sent to ${userId}: ${message}`);
      return;
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      this.logger.error(`User ${userId} not found`);
      return;
    }

    // Сохранение уведомления в базу
    const notification = new this.notificationModel({
      userId,
      message,
      isRead: false,
      createdAt: new Date(),
    });
    await notification.save();

    // Используем настройки пользователя, если settings не передан
    const userSettings = settings || user.settings || {};

    // Отправка на почту
    if (userSettings.notifications && user.email) {
      await this.sendEmail(userId, 'LMS Notification', message);
    }

    // Отправка в Telegram
    if (userSettings.notifications && user.telegramId) {
      await this.sendTelegram(userId, message);
    }

    // Отправка SMS
    if (userSettings.sms && user.phone) {
      // await this.sendSMS(userId, message); // временно отключаем
    }

    // Отправка через WebSocket
    await this.notificationsGateway.notifyUser(userId, message);

    await this.cacheManager.set(cacheKey, 'sent', 3600); // Кэшируем на 1 час
    this.logger.debug(`Notification sent to ${userId}: ${message}`);
  }

  async notifyNewCourse(
    studentId: string,
    courseId: string,
    courseTitle: string,
    streamId?: string,
  ): Promise<void> {
    const cacheKey = `notification:newcourse:${studentId}:${courseId}`;
    const cachedNotification = await this.cacheManager.get<any>(cacheKey);
    if (cachedNotification) {
      this.logger.log(
        `Notification found in cache for new course: ${cachedNotification}`,
      );
      return;
    }

    const message = `New course available: "${courseTitle}" (ID: ${courseId})`;
    const subject = 'New Course Available';
    await this.createNotification({
      userId: studentId,
      message,
      title: subject,
    }); // Передаём DTO
    await this.sendEmail(studentId, subject, message);
    await this.sendTelegram(studentId, message);
    // await this.sendSMS(studentId, message);

    await this.cacheManager.set(cacheKey, message, 3600);
  }

  async notifyDeadline(
    enrollmentId: string,
    daysLeft: number,
    courseTitle: string,
  ): Promise<void> {
    const cacheKey = `notification:deadline:${enrollmentId}:${daysLeft}`;
    const cachedNotification = await this.cacheManager.get<any>(cacheKey);
    if (cachedNotification) {
      this.logger.log(
        `Notification found in cache for deadline: ${cachedNotification}`,
      );
      return;
    }

    const enrollment =
      await this.enrollmentsService.findEnrollmentById(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const message = `Your course "${courseTitle}" deadline is in ${daysLeft} days!`;
    const subject = 'LMS Deadline Reminder';
    await this.createNotification({
      userId: enrollment.studentId,
      message,
      title: subject,
    }); // Передаём DTO
    await this.sendEmail(enrollment.studentId, subject, message);
    await this.sendTelegram(enrollment.studentId, message);
    await this.sendSMS(enrollment.studentId, message);

    await this.cacheManager.set(cacheKey, message, 3600);
  }

  async createBulkNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationDocument | null> {
    const notification = new this.notificationModel({
      title: dto.title,
      message: dto.message,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
      recipients: dto.recipients?.map((id) => new Types.ObjectId(id)) || [],
      isSent: false,
    });
    await notification.save();

    // Отправка уведомлений всем получателям
    const recipients = dto.recipients || (dto.userId ? [dto.userId] : []);
    for (const recipientId of recipients) {
      await this.sendEmail(recipientId, dto.title, dto.message);
      await this.sendTelegram(recipientId, dto.message);
      // await this.sendSMS(recipientId, dto.message); // Раскомментировать, если нужно
      this.notificationsGateway.notifyUser(recipientId, dto.message);
    }

    const updatedNotification = await this.notificationModel
      .findByIdAndUpdate(
        notification._id,
        { isSent: true, sentAt: new Date() },
        { new: true }, // Возвращаем обновлённый документ
      )
      .exec(); // Убираем .lean(), чтобы сохранить тип NotificationDocument

    return updatedNotification; // Может быть null, если запись не найдена
  }

  async updateNotification(
    id: string,
    dto: CreateNotificationDto,
  ): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        {
          title: dto.title,
          message: dto.message,
          userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
          recipients: dto.recipients?.map((id) => new Types.ObjectId(id)) || [],
        },
        { new: true },
      )
      .lean()
      .exec();
  }
}
