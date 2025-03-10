import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Inject, forwardRef } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
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
    @InjectQueue('notifications') private notificationsQueue: Queue,
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

    // this.telegramBot.onText(/\/start/, (msg) => {
    //   const chatId = msg.chat.id.toString();
    //   this.telegramBot.sendMessage(
    //     chatId,
    //     `Your Telegram chat ID is: ${chatId}. Use this ID to connect your account in the LMS.`,
    //   );
    // });
    this.telegramBot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id.toString();
      const template = await this.getNotificationByKey('telegram_chat_id');
      const message = this.replacePlaceholders(template.message, { chatId });
      await this.telegramBot.sendMessage(chatId, message);
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

  async findNotificationsByUser(
    userId: string,
  ): Promise<NotificationDocument[]> {
    this.logger.log(`Finding notifications for userId: ${userId}`);
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) }) // Преобразуем userId в ObjectId
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(
    notificationId: string,
  ): Promise<NotificationDocument | null> {
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

    const template = await this.getNotificationByKey('progress_points');
    const points = message.match(/(\d+)/)?.[0] || '0';
    const action = message.replace(/^\d+\s*points\s*for\s*/, '');
    const finalMessage = this.replacePlaceholders(template.message, {
      points,
      action,
    });
    const notification = await this.createNotification({
      userId,
      message: finalMessage,
      title: template.title,
    });
    if (!notification._id) throw new Error('Notification ID is missing');
    await this.sendNotificationToUser(notification._id.toString(), userId);
    await this.cacheManager.set(cacheKey, 'sent', 3600);
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

    const template = await this.getNotificationByKey('new_course');
    const message = this.replacePlaceholders(template.message, {
      courseTitle,
      courseId,
    });
    const notification = await this.createNotification({
      userId: studentId,
      message,
      title: template.title,
    });
    if (!notification._id) throw new Error('Notification ID is missing');
    await this.sendNotificationToUser(notification._id.toString(), studentId);
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

    const template = await this.getNotificationByKey('deadline_reminder');
    const message = this.replacePlaceholders(template.message, {
      courseTitle,
      daysLeft,
    });
    const notification = await this.createNotification({
      userId: enrollment.studentId.toString(),
      message,
      title: template.title,
    });
    if (!notification._id) throw new Error('Notification ID is missing');
    await this.sendNotificationToUser(
      notification._id.toString(),
      enrollment.studentId.toString(),
    );
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

  async sendNotificationToUser(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDocument | null> {
    this.logger.debug(
      `Attempting to send notification ${notificationId} to user ${userId}`,
    );
    const notification = await this.notificationModel
      .findById(new Types.ObjectId(notificationId))
      .exec();
    if (!notification) {
      this.logger.error(`Notification with ID ${notificationId} not found`);
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }
    this.logger.debug(`Notification found: ${notification._id}`);

    if (notification.isSent) {
      this.logger.warn(`Notification ${notificationId} already sent`);
      return notification;
    }

    if (!notification._id) throw new Error('Notification ID is missing');
    // Добавляем задачу в очередь вместо прямой отправки
    await this.notificationsQueue.add('send', {
      notificationId: notification._id.toString(),
      userId,
      title: notification.title,
      message: notification.message,
    });

    // Обновляем статус уведомления сразу
    const updatedNotification = await this.notificationModel
      .findByIdAndUpdate(
        new Types.ObjectId(notificationId),
        {
          isSent: true,
          sentAt: new Date(),
          userId: new Types.ObjectId(userId),
        },
        { new: true },
      )
      .exec();
    this.logger.debug(
      `Notification queued and updated: ${updatedNotification?._id}`,
    );

    return updatedNotification;
  }

  async sendNotificationToBulk(
    notificationId: string,
    recipientIds?: string[],
  ): Promise<NotificationDocument | null> {
    const notification = await this.notificationModel
      .findById(new Types.ObjectId(notificationId))
      .exec();
    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    if (notification.isSent) {
      this.logger.warn(`Notification ${notificationId} already sent`);
      return notification;
    }

    const recipients = recipientIds?.length
      ? recipientIds
      : notification.recipients.map((id) => id.toString());

    if (!recipients.length && !notification.userId) {
      throw new BadRequestException('No recipients specified for bulk send');
    }

    if (
      notification.userId &&
      !recipients.includes(notification.userId.toString())
    ) {
      recipients.push(notification.userId.toString());
    }

    if (!notification._id) throw new Error('Notification ID is missing');
    // Добавляем задачу в очередь для массовой отправки
    await this.notificationsQueue.add('sendBulk', {
      notificationId: notification._id.toString(),
      recipientIds: recipients,
      title: notification.title,
      message: notification.message,
    });

    // Обновляем статус уведомления
    const updatedNotification = await this.notificationModel
      .findByIdAndUpdate(
        new Types.ObjectId(notificationId),
        {
          isSent: true,
          sentAt: new Date(),
          recipients: recipients.map((id) => new Types.ObjectId(id)),
        },
        { new: true },
      )
      .exec();
    this.logger.debug(
      `Bulk notification queued and updated: ${updatedNotification?._id}`,
    );

    return updatedNotification;
  }

  public async getNotificationByKey(
    key: string,
  ): Promise<NotificationDocument> {
    const cacheKey = `notification_template:${key}`;
    let notification =
      await this.cacheManager.get<NotificationDocument>(cacheKey);

    if (!notification) {
      notification = await this.notificationModel.findOne({ key }).exec();
      if (!notification) {
        this.logger.warn(`Notification template with key "${key}" not found`);
        throw new NotFoundException(
          `Notification template with key "${key}" not found`,
        );
      }
      // Сохраняем в кэш на 1 час (3600 секунд)
      await this.cacheManager.set(cacheKey, notification, 3600);
      this.logger.debug(`Cached notification template for key "${key}"`);
    } else {
      this.logger.debug(
        `Retrieved notification template for key "${key}" from cache`,
      );
    }

    return notification;
  }

  public replacePlaceholders(
    template: string,
    params: Record<string, string | number>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
    }
    return result;
  }
}
