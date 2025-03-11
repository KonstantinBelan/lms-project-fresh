import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Process('newCourse')
  async handleNewCourse(job: Job) {
    try {
      const { studentId, courseId, courseTitle, streamId } = job.data;
      this.logger.debug(`Processing newCourse job for student ${studentId}`);
      await this.notificationsService.notifyNewCourse(
        studentId,
        courseId,
        courseTitle,
        streamId,
      );
      this.logger.debug(`Notification sent for student ${studentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process newCourse job: ${error.message}`,
        error.stack,
      );
      throw error; // Повторная отправка задачи в очередь при ошибке
    }
  }

  @Process('send')
  async handleNotification(job: Job) {
    const { notificationId, userId, title, message } = job.data;
    this.logger.debug(
      `Processing notification ${notificationId} for user ${userId}`,
    );

    // try {
    //   await this.notificationsService.sendEmail(userId, title, message);
    //   this.logger.debug(`Email sent to ${userId}`);
    // } catch (error) {
    //   this.logger.error(`Email failed for ${userId}: ${error.message}`);
    // }

    try {
      await this.notificationsService.sendTelegram(userId, message);
      this.logger.debug(`Telegram sent to ${userId}`);
    } catch (error) {
      this.logger.error(`Telegram failed for ${userId}: ${error.message}`);
    }

    try {
      this.notificationsGateway.notifyUser(userId, message);
      this.logger.debug(`Gateway sent to ${userId}`);
    } catch (error) {
      this.logger.error(`Gateway failed for ${userId}: ${error.message}`);
    }
  }

  @Process('sendBulk')
  async handleBulkNotification(job: Job) {
    const { notificationId, recipientIds, title, message } = job.data;
    this.logger.debug(
      `Processing bulk notification ${notificationId} for ${recipientIds.length} recipients`,
    );

    for (const recipientId of recipientIds) {
      // try {
      //   await this.notificationsService.sendEmail(recipientId, title, message);
      //   this.logger.debug(`Email sent to ${recipientId}`);
      // } catch (error) {
      //   this.logger.error(
      //     `Email failed for ${recipientId}: ${error.message}`,
      //     error.stack,
      //   );
      // }

      try {
        await this.notificationsService.sendTelegram(recipientId, message);
        this.logger.debug(`Telegram sent to ${recipientId}`);
      } catch (error) {
        this.logger.error(
          `Telegram failed for ${recipientId}: ${error.message}`,
          error.stack,
        );
      }

      try {
        this.notificationsGateway.notifyUser(recipientId, message);
        this.logger.debug(`Gateway sent to ${recipientId}`);
      } catch (error) {
        this.logger.error(
          `Gateway failed for ${recipientId}: ${error.message}`,
          error.stack,
        );
      }
    }
  }
}
