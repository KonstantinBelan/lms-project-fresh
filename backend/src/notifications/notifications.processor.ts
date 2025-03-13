import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Logger } from '@nestjs/common';
// import { MailerService } from '../mailer/mailer.service'; // Предполагаем, что он доступен

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    // private readonly mailerService: MailerService, // Добавляем MailerService
  ) {}

  // Обработка уведомления о новом курсе
  @Process('newCourse')
  async handleNewCourse(job: Job) {
    try {
      const { studentId, courseId, courseTitle, streamId } = job.data;
      this.logger.debug(`Обработка задачи newCourse для студента ${studentId}`);
      await this.notificationsService.notifyNewCourse(
        studentId,
        courseId,
        courseTitle,
        streamId,
      );
      this.logger.debug(`Уведомление отправлено для студента ${studentId}`);
    } catch (error) {
      this.logger.error(
        `Ошибка обработки задачи newCourse: ${error.message}`,
        error.stack,
      );
      throw error; // Повторная отправка задачи в очередь при ошибке
    }
  }

  // Обработка отправки уведомления одному пользователю
  @Process('send')
  async handleNotification(job: Job) {
    const { notificationId, userId, title, message } = job.data;
    this.logger.debug(
      `Обработка уведомления ${notificationId} для пользователя ${userId}`,
    );

    const errors: string[] = [];

    // try {
    //   await this.mailerService.sendInstantMail(
    //     userId,
    //     title,
    //     'welcome', // Предполагаем шаблон, нужно уточнить
    //     { name: 'User', message }, // Контекст может быть расширен
    //   );
    //   this.logger.debug(`Email отправлен пользователю ${userId}`);
    // } catch (error) {
    //   const errorMsg = `Ошибка отправки email для ${userId}: ${error.message}`;
    //   this.logger.error(errorMsg);
    //   errors.push(errorMsg);
    // }

    try {
      await this.notificationsService.sendTelegram(userId, message);
      this.logger.debug(`Telegram отправлен пользователю ${userId}`);
    } catch (error) {
      const errorMsg = `Ошибка отправки Telegram для ${userId}: ${error.message}`;
      this.logger.error(errorMsg);
      errors.push(errorMsg);
    }

    try {
      this.notificationsGateway.notifyUser(userId, message);
      this.logger.debug(`Уведомление через WebSocket отправлено ${userId}`);
    } catch (error) {
      const errorMsg = `Ошибка отправки через WebSocket для ${userId}: ${error.message}`;
      this.logger.error(errorMsg);
      errors.push(errorMsg);
    }

    if (errors.length > 0) {
      throw new Error(`Ошибки при отправке уведомления: ${errors.join('; ')}`);
    }
  }

  // Обработка массового уведомления
  @Process('sendBulk')
  async handleBulkNotification(job: Job) {
    const { notificationId, recipientIds, title, message } = job.data;
    this.logger.debug(
      `Обработка массового уведомления ${notificationId} для ${recipientIds.length} получателей`,
    );

    const errors: string[] = [];

    for (const recipientId of recipientIds) {
      // try {
      //   await this.mailerService.sendInstantMail(
      //     recipientId,
      //     title,
      //     'welcome', // Предполагаем шаблон
      //     { name: 'User', message },
      //   );
      //   this.logger.debug(`Email отправлен пользователю ${recipientId}`);
      // } catch (error) {
      //   const errorMsg = `Ошибка отправки email для ${recipientId}: ${error.message}`;
      //   this.logger.error(errorMsg);
      //   errors.push(errorMsg);
      // }

      try {
        await this.notificationsService.sendTelegram(recipientId, message);
        this.logger.debug(`Telegram отправлен пользователю ${recipientId}`);
      } catch (error) {
        const errorMsg = `Ошибка отправки Telegram для ${recipientId}: ${error.message}`;
        this.logger.error(errorMsg);
        errors.push(errorMsg);
      }

      try {
        this.notificationsGateway.notifyUser(recipientId, message);
        this.logger.debug(
          `Уведомление через WebSocket отправлено ${recipientId}`,
        );
      } catch (error) {
        const errorMsg = `Ошибка отправки через WebSocket для ${recipientId}: ${error.message}`;
        this.logger.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    if (errors.length > 0) {
      this.logger.warn(
        `Массовое уведомление завершено с ошибками: ${errors.length}`,
      );
      throw new Error(`Ошибки при массовой отправке: ${errors.join('; ')}`);
    }
  }
}
