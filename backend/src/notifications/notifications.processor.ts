import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationsService } from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor {
  constructor(private notificationsService: NotificationsService) {}

  @Process('newCourse')
  async handleNewCourse(job: Job) {
    const { studentId, courseId, courseTitle } = job.data;
    await this.notificationsService.notifyNewCourse(
      studentId,
      courseId,
      courseTitle,
    );
  }
}
