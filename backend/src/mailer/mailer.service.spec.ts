import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';

describe('MailerService', () => {
  let service: MailerService;
  let mailer: NestMailerService;
  let queue: any;
  let cache: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BullModule.forRoot({})],
      providers: [
        MailerService,
        {
          provide: NestMailerService,
          useValue: { sendMail: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: getQueueToken('mailer'),
          useValue: { add: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
    mailer = module.get<NestMailerService>(NestMailerService);
    queue = module.get(getQueueToken('mailer'));
    cache = module.get(CACHE_MANAGER);
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  it('должен отправлять мгновенное письмо', async () => {
    await service.sendInstantMail('test@example.com', 'Тест', 'welcome', {
      name: 'Тест',
    });
    expect(mailer.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Тест',
      template: 'welcome',
      context: { name: 'Тест' },
    });
  });

  it('должен добавлять массовую рассылку в очередь', async () => {
    const recipients = [{ to: 'test@example.com', context: { name: 'Тест' } }];
    await service.sendBulkMail(recipients, 'Тест', 'welcome');
    expect(queue.add).toHaveBeenCalledWith(
      'sendBulk',
      { recipients, subject: 'Тест', template: 'welcome' },
      { attempts: 3, backoff: 5000 },
    );
  });
});
