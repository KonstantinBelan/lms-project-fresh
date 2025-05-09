import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Processor('mailer')
export class MailerProcessor {
  private readonly logger = new Logger(MailerProcessor.name);

  constructor(private readonly mailerService: NestMailerService) {}

  @Process('sendInstant')
  async handleSendInstant(job: Job) {
    const { to, subject, template, context } = job.data;
    this.logger.debug(`Обработка отправки письма для ${to}`);

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      this.logger.log(`Письмо успешно отправлено на ${to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка отправки письма на ${to}: ${error.message}`);
      throw error;
    }
  }

  @Process('sendBulk')
  async handleSendBulk(job: Job) {
    const { recipients, subject, template } = job.data;
    this.logger.debug(
      `Обработка массовой рассылки для ${recipients.length} получателей`,
    );

    const errors: { to: string; error: string }[] = [];
    let successCount = 0;

    for (const { to, context } of recipients) {
      try {
        await this.mailerService.sendMail({
          to,
          subject,
          template,
          context,
        });
        this.logger.log(`Письмо отправлено на ${to}`);
        successCount++;
      } catch (error) {
        const errorMsg = `Ошибка отправки письма на ${to}: ${error.message}`;
        this.logger.error(errorMsg);
        errors.push({ to, error: error.message });
      }
    }

    if (errors.length > 0) {
      this.logger.warn(
        `Массовое отправление завершено с ошибками: ${errors.length}. Ошибки: ${JSON.stringify(errors)}`,
      );
      return { success: false, successCount, errors };
    }
    this.logger.log('Массовая рассылка завершена успешно');
    return { success: true, successCount };
  }
}
