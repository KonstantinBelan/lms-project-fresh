import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationsService } from './notifications.service';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private notificationsService: NotificationsService) {}

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
}
