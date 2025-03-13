import { Injectable, BadRequestException } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { MailContext } from './mailer.interface';
import { RecipientDto } from './dto/bulk-mail.dto';

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
    context: MailContext,
  ) {
    if (!to || !subject || !template) {
      this.logger.warn(
        'Отсутствуют обязательные параметры для отправки письма',
      );
      throw new BadRequestException('Email, тема и шаблон обязательны');
    }

    this.logger.debug(`Начало мгновенной отправки письма на ${to}`);
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
      throw error;
    }
  }

  // Массовая отправка через очередь
  async sendBulkMail(
    recipients: RecipientDto[],
    subject: string,
    template: string,
  ) {
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

    this.logger.debug(
      `Подготовка массовой рассылки для ${recipients.length} получателей`,
    );
    try {
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
      this.logger.log(
        `Массовая рассылка для ${recipients.length} получателей успешно добавлена в очередь`,
      );
    } catch (error) {
      this.logger.error(
        `Ошибка добавления массовой рассылки в очередь: ${error.message}`,
      );
      throw error;
    }
  }

  // Асинхронная отправка одного письма через очередь
  async sendInstantMailAsync(
    to: string,
    subject: string,
    template: string,
    context: MailContext,
  ) {
    if (!to || !subject || !template) {
      this.logger.warn(
        'Отсутствуют обязательные параметры для отправки письма',
      );
      throw new BadRequestException('Email, тема и шаблон обязательны');
    }

    this.logger.debug(`Подготовка асинхронной отправки письма на ${to}`);
    try {
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
      this.logger.log(`Письмо для ${to} успешно добавлено в очередь`);
    } catch (error) {
      this.logger.error(
        `Ошибка добавления письма в очередь для ${to}: ${error.message}`,
      );
      throw error;
    }
  }
}
