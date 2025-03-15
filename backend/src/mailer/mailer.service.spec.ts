import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

describe('MailerService', () => {
  let service: MailerService;
  let mailerService: NestMailerService;
  let mailerQueue: Queue;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: NestMailerService,
          useValue: mockMailerService,
        },
        {
          provide: 'BullQueue_mailer',
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
    mailerService = module.get<NestMailerService>(NestMailerService);
    mailerQueue = module.get<Queue>('BullQueue_mailer');
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('sendInstantMail', () => {
    it('должен отправить мгновенное письмо', async () => {
      const to = 'user@example.com';
      const subject = 'Тест';
      const template = 'welcome';
      const context = { name: 'Иван' };
      mockMailerService.sendMail.mockResolvedValue(undefined);

      await service.sendInstantMail(to, subject, template, context);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject,
        template,
        context,
      });
    });

    it('должен выбросить ошибку при отсутствии обязательных полей', async () => {
      await expect(
        service.sendInstantMail('', 'Тест', 'welcome', { name: 'Иван' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('должен выбросить ошибку при отсутствии обязательных полей в контексте', async () => {
      await expect(
        service.sendInstantMail('user@example.com', 'Тест', 'welcome', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendBulkMail', () => {
    it('должен добавить массовую рассылку в очередь', async () => {
      const recipients = [
        { to: 'user@example.com', context: { name: 'Иван' } },
      ];
      const subject = 'Тест';
      const template = 'welcome';
      mockQueue.add.mockResolvedValue(undefined);

      await service.sendBulkMail(recipients, subject, template);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'sendBulk',
        { recipients, subject, template },
        { attempts: 3, backoff: 5000 },
      );
    });

    it('должен выбросить ошибку при пустом списке получателей', async () => {
      await expect(service.sendBulkMail([], 'Тест', 'welcome')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('sendInstantMailAsync', () => {
    it('должен добавить мгновенное письмо в очередь', async () => {
      const to = 'user@example.com';
      const subject = 'Тест';
      const template = 'welcome';
      const context = { name: 'Иван' };
      mockQueue.add.mockResolvedValue(undefined);

      await service.sendInstantMailAsync(to, subject, template, context);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'sendInstant',
        { to, subject, template, context },
        { attempts: 3, backoff: 5000 },
      );
    });

    it('должен выбросить ошибку при отсутствии обязательных полей', async () => {
      await expect(
        service.sendInstantMailAsync('', 'Тест', 'welcome', { name: 'Иван' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
