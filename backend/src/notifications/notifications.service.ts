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
import { CoursesService } from '../courses/courses.service';
import * as nodemailer from 'nodemailer';
import * as TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/config';
import { Course } from '../courses/schemas/course.schema';
import { Module } from '../courses/schemas/module.schema';
import { Lesson } from '../courses/schemas/lesson.schema';
import { Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager'; // Импортируем CACHE_MANAGER
import { Cache } from 'cache-manager'; // Импортируем Cache
import axios from 'axios';

@Injectable()
export class NotificationsService implements INotificationsService {
  private transporter: nodemailer.Transporter;
  private telegramBot: TelegramBot;

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @Inject(forwardRef(() => EnrollmentsService))
    private enrollmentsService: EnrollmentsService,
    private usersService: UsersService,
    private coursesService: CoursesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // Инжектируем кэш
  ) {
    console.log(
      'NotificationsService initialized, enrollmentsService:',
      this.enrollmentsService,
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
        rejectUnauthorized: false, // Для тестов, убери в продакшене
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
    const cacheKey = `notification:progress:${enrollmentId}:${moduleId}:${lessonId}`;
    const cachedNotification = await this.cacheManager.get<any>(cacheKey);
    if (cachedNotification) {
      console.log(
        'Notification found in cache for progress:',
        cachedNotification,
      );
      return;
    }

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

    const courseId = enrollment.courseId.toString();
    if (!courseId) throw new Error('Course ID not found in enrollment');

    const course = (await this.coursesService.findCourseById(
      courseId,
    )) as Course;
    if (!course) throw new Error('Course not found');

    const module = await this.coursesService.findModuleById(moduleId);
    const moduleTitle = module?.title || moduleId;

    const lesson = await this.coursesService.findLessonById(lessonId);
    const lessonTitle = lesson?.title || lessonId;

    const message = `You completed lesson "${lessonTitle}" in module "${moduleTitle}" of course "${course.title}"`;
    await this.createNotification(enrollment.studentId, message);
    await this.sendEmail(enrollment.studentId, message);
    await this.sendTelegram(message);
    await this.sendSMS(enrollment.studentId, message);

    await this.cacheManager.set(cacheKey, message, 3600); // Кэшируем уведомление на 1 час
  }

  async notifyNewCourse(
    studentId: string,
    courseId: string,
    courseTitle: string,
  ): Promise<void> {
    const cacheKey = `notification:newcourse:${studentId}:${courseId}`;
    const cachedNotification = await this.cacheManager.get<any>(cacheKey);
    if (cachedNotification) {
      console.log(
        'Notification found in cache for new course:',
        cachedNotification,
      );
      return;
    }

    const message = `New course available: "${courseTitle}" (ID: ${courseId})`;
    await this.createNotification(studentId, message);
    await this.sendEmail(studentId, message);
    await this.sendTelegram(message);
    await this.sendSMS(studentId, message);

    await this.cacheManager.set(cacheKey, message, 3600); // Кэшируем уведомление на 1 час
  }

  async notifyDeadline(
    enrollmentId: string,
    daysLeft: number,
    courseTitle: string,
  ): Promise<void> {
    const cacheKey = `notification:deadline:${enrollmentId}:${daysLeft}`;
    const cachedNotification = await this.cacheManager.get<any>(cacheKey);
    if (cachedNotification) {
      console.log(
        'Notification found in cache for deadline:',
        cachedNotification,
      );
      return;
    }

    const enrollment =
      await this.enrollmentsService.findEnrollmentById(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const message = `You have ${daysLeft} days left to complete "${courseTitle}"`;
    await this.createNotification(enrollment.studentId, message);
    await this.sendEmail(enrollment.studentId, message);
    await this.sendTelegram(message);
    await this.sendSMS(enrollment.studentId, message);

    await this.cacheManager.set(cacheKey, message, 3600); // Кэшируем уведомление на 1 час
  }

  public async sendEmail(userId: string, message: string): Promise<void> {
    const user = await this.usersService.findByEmail(userId); // Используем findByEmail вместо findById
    if (!user || !user.email) {
      console.warn('User or email not found for ID:', userId);
      return;
    }

    console.log(
      'Attempting to send email to:',
      user.email,
      'with message:',
      message,
    );

    const mailOptions = {
      from: config.email.user,
      to: user.email,
      subject: 'LMS Notification',
      text: message,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', user.email);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email notification: ${error.message}`);
    }
  }

  public async sendTelegram(message: string): Promise<void> {
    try {
      await this.telegramBot.sendMessage(config.telegram.chatId, message);
      console.log('Telegram message sent:', message);
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      throw new Error(`Failed to send Telegram notification: ${error.message}`);
    }
  }

  public async sendSMS(userId: string, message: string): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      if (!user || !user.phone) {
        console.warn('User or phone number not found for ID:', userId);
        return;
      }

      const phone = user.phone; // Номер получателя из базы
      const apiKey = process.env.SMS_RU_API_KEY; // API-ключ из .env
      if (!apiKey) {
        throw new Error('SMS_RU_API_KEY is not configured in .env');
      }

      console.log(
        'Attempting to send SMS to:',
        phone,
        'with message:',
        message,
      );

      const response = await axios.get('https://sms.ru/sms/send', {
        params: {
          api_id: apiKey,
          to: phone,
          text: message,
          json: 1, // Возвращать ответ в формате JSON
        },
      });

      console.log('SMS.ru API response:', response.data);

      if (response.data.status === 'OK') {
        console.log('SMS sent successfully to:', phone);
      } else {
        console.error('Failed to send SMS:', response.data);
        throw new Error(`Failed to send SMS: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw new Error(`Failed to send SMS notification: ${error.message}`);
    }
  }
}
