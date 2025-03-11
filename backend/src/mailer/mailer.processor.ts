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
    } catch (error) {
      this.logger.error(`Ошибка отправки письма на ${to}: ${error.message}`);
      throw error; // Bull автоматически обработает повторные попытки
    }
  }

  @Process('sendBulk')
  async handleSendBulk(job: Job) {
    const { recipients, subject, template } = job.data;
    this.logger.debug(
      `Обработка массовой рассылки для ${recipients.length} получателей`,
    );

    for (const { to, context } of recipients) {
      try {
        await this.mailerService.sendMail({
          to,
          subject,
          template,
          context,
        });
        this.logger.log(`Письмо отправлено на ${to}`);
      } catch (error) {
        this.logger.error(`Ошибка отправки письма на ${to}: ${error.message}`);
        // Продолжаем отправку остальным, не прерывая процесс
      }
    }
  }
}
