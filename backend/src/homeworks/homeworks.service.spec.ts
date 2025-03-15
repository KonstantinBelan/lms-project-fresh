import { Test, TestingModule } from '@nestjs/testing';
import { HomeworksService } from './homeworks.service';
import { getModelToken } from '@nestjs/mongoose';
import { Homework, HomeworkDocument } from './schemas/homework.schema';
import { Submission, SubmissionDocument } from './schemas/submission.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UpdateHomeworkDto } from './dto/update-homework.dto';

describe('HomeworksService - updateHomework', () => {
  let service: HomeworksService;
  let homeworkModel: any;

  const mockHomework = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    lessonId: new Types.ObjectId('507f1f77bcf86cd799439012'),
    description: 'Старое описание',
    category: 'practice',
    deadline: new Date('2025-03-20'),
    isActive: true,
    points: 10,
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeworksService,
        {
          provide: getModelToken(Homework.name),
          useValue: {
            findByIdAndUpdate: jest.fn(),
          },
        },
        {
          provide: getModelToken(Submission.name),
          useValue: {},
        },
        {
          provide: NotificationsService,
          useValue: {},
        },
        {
          provide: CoursesService,
          useValue: {},
        },
        {
          provide: EnrollmentsService,
          useValue: {},
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<HomeworksService>(HomeworksService);
    homeworkModel = module.get(getModelToken(Homework.name));
  });

  it('должен успешно обновить домашнее задание', async () => {
    const updateDto: UpdateHomeworkDto = {
      description: 'Новое описание',
      points: 25,
    };
    homeworkModel.findByIdAndUpdate.mockResolvedValue({
      ...mockHomework,
      ...updateDto,
    });

    const result = await service.updateHomework(
      mockHomework._id.toString(),
      updateDto,
    );

    expect(homeworkModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockHomework._id.toString(),
      expect.objectContaining({
        description: 'Новое описание',
        points: 25,
      }),
      { new: true, runValidators: true },
    );
    expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
    expect(result.description).toBe('Новое описание');
    expect(result.points).toBe(25);
  });

  it('должен выбросить исключение при невалидном ID', async () => {
    const updateDto: UpdateHomeworkDto = { description: 'Новое описание' };
    await expect(
      service.updateHomework('invalid-id', updateDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('должен выбросить исключение, если задание не найдено', async () => {
    homeworkModel.findByIdAndUpdate.mockResolvedValue(null);
    const updateDto: UpdateHomeworkDto = { description: 'Новое описание' };
    await expect(
      service.updateHomework(mockHomework._id.toString(), updateDto),
    ).rejects.toThrow(NotFoundException);
  });
});
