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
// import { MailerService } from '../mailer/mailer.service';

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
    // private mailerService: MailerService, // Добавляем MailerService
  ) {
    this.logger.log(
      `Инициализация NotificationsService, enrollmentsService: ${!!this.enrollmentsService}`,
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
      this.logger.log(
        `Приветственное сообщение отправлено в Telegram: ${chatId}`,
      );
    });
  }

  // Создание уведомления
  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationDocument> {
    this.logger.log(`Создание уведомления с данными: ${JSON.stringify(dto)}`);
    const newNotification = new this.notificationModel({
      title: dto.title,
      message: dto.message,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
      recipients: dto.recipients?.map((id) => new Types.ObjectId(id)) || [],
    });
    const savedNotification = await newNotification.save();
    this.logger.log(`Уведомление создано: ${savedNotification._id}`);
    return savedNotification;
  }

  // Поиск уведомлений по идентификатору пользователя
  async findNotificationsByUser(
    userId: string,
  ): Promise<NotificationDocument[]> {
    this.logger.log(`Поиск уведомлений для пользователя: ${userId}`);
    const notifications = await this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
    this.logger.debug(
      `Найдено ${notifications.length} уведомлений для ${userId}`,
    );
    return notifications;
  }

  // Отметка уведомления как прочитанного
  async markAsRead(
    notificationId: string,
  ): Promise<NotificationDocument | null> {
    this.logger.log(`Отметка уведомления ${notificationId} как прочитанного`);
    const updated = await this.notificationModel
      .findByIdAndUpdate(notificationId, { isRead: true }, { new: true })
      .exec();
    if (!updated) {
      this.logger.warn(`Уведомление ${notificationId} не найдено`);
    }
    return updated;
  }

  // Удаление уведомления
  async deleteNotification(notificationId: string): Promise<void> {
    this.logger.log(`Удаление уведомления ${notificationId}`);
    const result = await this.notificationModel
      .findByIdAndDelete(notificationId)
      .exec();
    if (!result) {
      this.logger.warn(`Уведомление ${notificationId} не найдено`);
    }
  }

  // Отправка email-уведомления
  // async sendEmail(
  //   userId: string,
  //   subject: string,
  //   message: string,
  // ): Promise<void> {
  //   const user = await this.usersService.findById(userId);
  //   if (!user || !user.email) {
  //     this.logger.warn(`Пользователь или email не найден для: ${userId}`);
  //     return;
  //   }

  //   try {
  //     await this.mailerService.sendInstantMail(
  //       user.email,
  //       subject,
  //       'welcome', // Предполагаем шаблон
  //       { name: user.name || 'User', message },
  //     );
  //     this.logger.log(`Сообщение email отправлено пользователю: ${user.email}`);
  //   } catch (error) {
  //     this.logger.error(
  //       `Ошибка отправки email для ${userId}: ${error.message}`,
  //     );
  //     throw new Error(`Ошибка отправки email: ${error.message}`);
  //   }
  // }

  // Отправка Telegram-уведомления
  async sendTelegram(userId: string, message: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.telegramId) {
      this.logger.warn(`Пользователь или Telegram ID не найден для: ${userId}`);
      return;
    }

    try {
      await this.telegramBot.sendMessage(user.telegramId, message);
      this.logger.log(`Сообщение Telegram отправлено: ${user.telegramId}`);
    } catch (error) {
      this.logger.error(
        `Ошибка отправки Telegram для ${userId}: ${error.message}`,
      );
      throw new Error(`Ошибка отправки Telegram: ${error.message}`);
    }
  }

  // Уведомление о прогрессе
  async notifyProgress(
    userId: string,
    message: string,
    settings?: any,
  ): Promise<void> {
    const cacheKey = `notification:${userId}:${message}`;
    const cachedNotification = await this.cacheManager.get(cacheKey);
    if (cachedNotification) {
      this.logger.debug(`Уведомление о прогрессе уже отправлено: ${userId}`);
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
    this.logger.log(`Уведомление о прогрессе отправлено: ${userId}`);
  }

  // Уведомление о новом курсе
  async notifyNewCourse(
    studentId: string,
    courseId: string,
    courseTitle: string,
    streamId?: string,
  ): Promise<void> {
    const cacheKey = `notification:newcourse:${studentId}:${courseId}`;
    const cachedNotification = await this.cacheManager.get<any>(cacheKey);
    if (cachedNotification) {
      this.logger.log(`Уведомление о новом курсе уже в кэше для ${studentId}`);
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
    this.logger.log(`Уведомление о новом курсе отправлено: ${studentId}`);
  }

  // Уведомление о дедлайне
  async notifyDeadline(
    enrollmentId: string,
    daysLeft: number,
    courseTitle: string,
  ): Promise<void> {
    const cacheKey = `notification:deadline:${enrollmentId}:${daysLeft}`;
    const cachedNotification = await this.cacheManager.get<any>(cacheKey);
    if (cachedNotification) {
      this.logger.log(`Уведомление о дедлайне уже в кэше для ${enrollmentId}`);
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
    this.logger.log(
      `Уведомление о дедлайне отправлено для ${enrollment.studentId}`,
    );
  }

  // Создание массового уведомления
  async createBulkNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationDocument | null> {
    this.logger.log(`Создание массового уведомления: ${JSON.stringify(dto)}`);
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
    this.logger.log(
      `Массовое уведомление создано и отправлено: ${updatedNotification?._id}`,
    );
    return updatedNotification;
  }

  // Обновление уведомления
  async updateNotification(
    id: string,
    dto: CreateNotificationDto,
  ): Promise<NotificationDocument | null> {
    this.logger.log(`Обновление уведомления ${id}: ${JSON.stringify(dto)}`);
    const updated = await this.notificationModel
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
    this.logger.log(`Уведомление обновлено: ${id}`);
    return updated;
  }

  // Отправка уведомления одному пользователю
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

    await this.notificationsQueue.add('send', {
      notificationId: notification._id.toString(),
      userId,
      title: notification.title,
      message: notification.message,
      channels: ['email', 'telegram', 'websocket'], // Добавляем email
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
    this.logger.debug(
      `Уведомление поставлено в очередь: ${updatedNotification?._id}`,
    );
    return updatedNotification;
  }

  // Отправка уведомления нескольким пользователям
  async sendNotificationToBulk(
    notificationId: string,
    recipientIds?: string[],
  ): Promise<NotificationDocument | null> {
    this.logger.debug(`Отправка массового уведомления ${notificationId}`);
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

    await this.notificationsQueue.add('sendBulk', {
      notificationId: notification._id.toString(),
      recipientIds: recipients,
      title: notification.title,
      message: notification.message,
      channels: ['email', 'telegram', 'websocket'], // Добавляем email
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
      `Массовое уведомление поставлено в очередь: ${updatedNotification?._id}`,
    );
    return updatedNotification;
  }

  // Получение уведомления по ключу
  async getNotificationByKey(key: string): Promise<NotificationDocument> {
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
      this.logger.debug(`Шаблон "${key}" сохранен в кэш`);
    } else {
      this.logger.debug(`Шаблон "${key}" взят из кэша`);
    }

    return notification;
  }

  // Замена placeholder'ов в шаблоне
  replacePlaceholders(
    template: string,
    params: Record<string, string | number>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
    }
    return result;
  }

  // Отправка SMS-уведомления
  async sendSMS(userId: string, message: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.phone) {
      this.logger.warn(
        `Пользователь или номер телефона не найден для: ${userId}`,
      );
      return;
    }

    const phone = user.phone;
    const apiKey = process.env.SMS_RU_API_KEY;
    if (!apiKey) {
      throw new Error('Переменная SMS_RU_API_KEY не настроена в .env');
    }

    this.logger.log(`Отправка SMS на: ${phone}, сообщение: ${message}`);

    try {
      const response = await axios.get('https://sms.ru/sms/send', {
        params: {
          api_id: apiKey,
          to: phone,
          text: message,
          json: 1,
        },
      });

      this.logger.log(`Ответ API SMS.ru: ${JSON.stringify(response.data)}`);

      if (response.data.status === 'OK') {
        this.logger.log(`SMS успешно отправлено на: ${phone}`);
      } else {
        this.logger.error(`Ошибка отправки SMS: ${response.data.error}`);
        throw new Error(`Ошибка отправки SMS: ${response.data.error}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка отправки SMS: ${error.message}`);
      throw new Error(`Ошибка отправки SMS: ${error.message}`);
    }
  }
}
