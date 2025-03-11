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
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';
import { INotificationsService } from './notifications.service.interface';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';
import * as TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/config';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';

@Injectable()
export class NotificationsService implements INotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private telegramBot: TelegramBot;

  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @Inject(forwardRef(() => EnrollmentsService))
    private enrollmentsService: EnrollmentsService,
    private usersService: UsersService,
    @Inject(forwardRef(() => CoursesService))
    private coursesService: CoursesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {
    this.logger.log(
      'NotificationsService initialized, enrollmentsService:',
      !!this.enrollmentsService,
    );

    // Инициализация Telegram-бота
    this.telegramBot = new TelegramBot(config.telegram.botToken, {
      polling: true,
    });

    // Обработчик команды /start для Telegram
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
    this.logger.log(`Создание уведомления с DTO: ${JSON.stringify(dto)}`);
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
    this.logger.log(`Поиск уведомлений для userId: ${userId}`);
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(
    notificationId: string,
  ): Promise<NotificationDocument | null> {
    this.logger.log(`Отметка уведомления как прочитанного: ${notificationId}`);
    return this.notificationModel
      .findByIdAndUpdate(notificationId, { isRead: true }, { new: true })
      .exec();
  }

  async deleteNotification(notificationId: string): Promise<void> {
    this.logger.log(`Удаление уведомления: ${notificationId}`);
    await this.notificationModel.findByIdAndDelete(notificationId).exec();
  }

  public async sendTelegram(userId: string, message: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.telegramId) {
      this.logger.warn(`Пользователь или Telegram ID не найден для: ${userId}`);
      return;
    }

    try {
      await this.telegramBot.sendMessage(user.telegramId, message);
      this.logger.log(`Сообщение Telegram отправлено: ${user.telegramId}`);
    } catch (error) {
      this.logger.error('Ошибка отправки Telegram:', error);
      throw new Error(`Ошибка отправки Telegram: ${error.message}`);
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
      this.logger.debug(`Уведомление уже отправлено: ${userId}`);
      return;
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      this.logger.error(`Пользователь ${userId} не найден`);
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
    if (!notification._id) throw new Error('ID уведомления отсутствует');
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
      this.logger.log(`Уведомление о новом курсе уже в кэше`);
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
    if (!notification._id) throw new Error('ID уведомления отсутствует');
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
      this.logger.log(`Уведомление о дедлайне уже в кэше`);
      return;
    }

    const enrollment =
      await this.enrollmentsService.findEnrollmentById(enrollmentId);
    if (!enrollment) throw new Error('Зачисление не найдено');

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
    if (!notification._id) throw new Error('ID уведомления отсутствует');
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

    const recipients = dto.recipients || (dto.userId ? [dto.userId] : []);
    for (const recipientId of recipients) {
      await this.sendTelegram(recipientId, dto.message);
      this.notificationsGateway.notifyUser(recipientId, dto.message);
    }

    const updatedNotification = await this.notificationModel
      .findByIdAndUpdate(
        notification._id,
        { isSent: true, sentAt: new Date() },
        { new: true },
      )
      .exec();

    return updatedNotification;
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
      `Попытка отправить уведомление ${notificationId} пользователю ${userId}`,
    );
    const notification = await this.notificationModel
      .findById(new Types.ObjectId(notificationId))
      .exec();
    if (!notification) {
      this.logger.error(`Уведомление ${notificationId} не найдено`);
      throw new NotFoundException(`Уведомление ${notificationId} не найдено`);
    }
    this.logger.debug(`Уведомление найдено: ${notification._id}`);

    if (notification.isSent) {
      this.logger.warn(`Уведомление ${notificationId} уже отправлено`);
      return notification;
    }

    if (!notification._id) throw new Error('ID уведомления отсутствует');

    // Добавляем задачу в очередь для Telegram и WebSocket
    await this.notificationsQueue.add('send', {
      notificationId: notification._id.toString(),
      userId,
      title: notification.title,
      message: notification.message,
      channels: ['telegram', 'websocket'], // Явно указываем каналы
    });

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
    this.logger.debug(`Уведомление в очереди: ${updatedNotification?._id}`);

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
      throw new NotFoundException(`Уведомление ${notificationId} не найдено`);
    }

    if (notification.isSent) {
      this.logger.warn(`Уведомление ${notificationId} уже отправлено`);
      return notification;
    }

    const recipients = recipientIds?.length
      ? recipientIds
      : notification.recipients.map((id) => id.toString());

    if (!recipients.length && !notification.userId) {
      throw new BadRequestException('Нет получателей для массовой отправки');
    }

    if (
      notification.userId &&
      !recipients.includes(notification.userId.toString())
    ) {
      recipients.push(notification.userId.toString());
    }

    if (!notification._id) throw new Error('ID уведомления отсутствует');

    // Массовое уведомление через очередь
    await this.notificationsQueue.add('sendBulk', {
      notificationId: notification._id.toString(),
      recipientIds: recipients,
      title: notification.title,
      message: notification.message,
      channels: ['telegram', 'websocket'],
    });

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
      `Массовое уведомление в очереди: ${updatedNotification?._id}`,
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
        this.logger.warn(`Шаблон уведомления "${key}" не найден`);
        throw new NotFoundException(`Шаблон "${key}" не найден`);
      }
      await this.cacheManager.set(cacheKey, notification, 3600);
      this.logger.debug(`Шаблон "${key}" сохранён в кэш`);
    } else {
      this.logger.debug(`Шаблон "${key}" взят из кэша`);
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
}
