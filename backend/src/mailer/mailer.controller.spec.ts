import { Test, TestingModule } from '@nestjs/testing';
import { MailerController } from './mailer.controller';
import { MailerService } from './mailer.service';
import { BulkMailDto } from './dto/bulk-mail.dto';

describe('MailerController', () => {
  let controller: MailerController;
  let service: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailerController],
      providers: [
        {
          provide: MailerService,
          useValue: {
            sendBulkMail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<MailerController>(MailerController);
    service = module.get<MailerService>(MailerService);
  });

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  it('должен успешно ставить рассылку в очередь', async () => {
    const bulkMailDto: BulkMailDto = {
      recipients: [{ to: 'test@example.com', context: { name: 'Тест' } }],
      subject: 'Тестовая тема',
      template: 'welcome',
    };

    const result = await controller.sendBulkMail(bulkMailDto);
    expect(result).toEqual({ message: 'Рассылка поставлена в очередь' });
    expect(service.sendBulkMail).toHaveBeenCalledWith(
      bulkMailDto.recipients,
      bulkMailDto.subject,
      bulkMailDto.template,
    );
  });

  it('должен выбрасывать ошибку при некорректных данных', async () => {
    jest.spyOn(service, 'sendBulkMail').mockRejectedValue(new Error('Ошибка'));
    const bulkMailDto: BulkMailDto = {
      recipients: [],
      subject: '',
      template: '',
    };

    await expect(controller.sendBulkMail(bulkMailDto)).rejects.toThrow(
      'Ошибка',
    );
  });
});
