import { Injectable, BadRequestException } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Logger } from '@nestjs/common';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private readonly mailerService: NestMailerService,
    @InjectQueue('mailer') private mailerQueue: Queue,
  ) {}

  // Мгновенная отправка письма (синхронно)
  async sendInstantMail(
    to: string,
    subject: string,
    template: string,
    context: any,
  ) {
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
      throw error;
    }
  }

  // Массовая отправка через очередь
  async sendBulkMail(
    recipients: { to: string; context: any }[],
    subject: string,
    template: string,
  ) {
    // Проверка на пустые или отсутствующие поля
    if (!recipients || recipients.length === 0) {
      this.logger.warn('Список получателей пуст');
      throw new BadRequestException('Список получателей не может быть пустым');
    }
    if (!subject) {
      this.logger.warn('Отсутствует тема письма');
      throw new BadRequestException('Тема письма обязательна');
    }
    if (!template) {
      this.logger.warn('Отсутствует шаблон письма');
      throw new BadRequestException('Шаблон письма обязателен');
    }

    this.logger.log(
      `Добавление массовой рассылки для ${recipients.length} получателей в очередь`,
    );
    await this.mailerQueue.add(
      'sendBulk',
      {
        recipients,
        subject,
        template,
      },
      {
        attempts: 3,
        backoff: 5000,
      },
    );
  }

  // (Опционально) Асинхронная отправка одного письма через очередь
  async sendInstantMailAsync(
    to: string,
    subject: string,
    template: string,
    context: any,
  ) {
    this.logger.log(`Добавление письма для ${to} в очередь`);
    await this.mailerQueue.add(
      'sendInstant',
      {
        to,
        subject,
        template,
        context,
      },
      {
        attempts: 3,
        backoff: 5000,
      },
    );
  }
}
