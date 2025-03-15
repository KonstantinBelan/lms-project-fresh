import { Test, TestingModule } from '@nestjs/testing';
import { HomeworksController } from './homeworks.controller';
import { HomeworksService } from './homeworks.service';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('HomeworksController - updateHomework', () => {
  let controller: HomeworksController;
  let service: HomeworksService;

  const mockHomework = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    lessonId: new Types.ObjectId('507f1f77bcf86cd799439012'),
    description: 'Старое описание',
    category: 'practice',
    deadline: new Date('2025-03-20'),
    isActive: true,
    points: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeworksController],
      providers: [
        {
          provide: HomeworksService,
          useValue: {
            updateHomework: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HomeworksController>(HomeworksController);
    service = module.get<HomeworksService>(HomeworksService);
  });

  it('должен успешно обновить домашнее задание', async () => {
    const updateDto: UpdateHomeworkDto = { description: 'Новое описание' };
    jest.spyOn(service, 'updateHomework').mockResolvedValue({
      ...mockHomework,
      ...updateDto,
    });

    const result = await controller.updateHomework(
      mockHomework._id.toString(),
      updateDto,
    );
    expect(service.updateHomework).toHaveBeenCalledWith(
      mockHomework._id.toString(),
      updateDto,
    );
    expect(result.description).toBe('Новое описание');
  });

  it('должен выбросить исключение при невалидном ID', async () => {
    const updateDto: UpdateHomeworkDto = { description: 'Новое описание' };
    await expect(
      controller.updateHomework('invalid-id', updateDto),
    ).rejects.toThrow(BadRequestException);
  });
});
