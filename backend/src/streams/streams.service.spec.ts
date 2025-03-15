import { Test, TestingModule } from '@nestjs/testing';
import { StreamsService } from './streams.service';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Stream } from './schemas/stream.schema';
import { BadRequestException } from '@nestjs/common';

describe('StreamsService', () => {
  let service: StreamsService;
  let streamModel: any;
  let cacheManager: any;

  const mockStreamModel = {
    findById: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamsService,
        { provide: getModelToken(Stream.name), useValue: mockStreamModel },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<StreamsService>(StreamsService);
    streamModel = module.get(getModelToken(Stream.name));
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('createStream', () => {
    it('должен создать поток', async () => {
      const streamData = {
        courseId: '507f1f77bcf86cd799439011',
        name: 'Поток 1',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-31'),
      };
      const stream = {
        ...streamData,
        _id: '507f1f77bcf86cd799439012',
        students: [],
      };
      mockStreamModel.create.mockReturnValue({
        save: jest.fn().mockResolvedValue(stream),
      });

      const result = await service.createStream(
        streamData.courseId,
        streamData.name,
        streamData.startDate,
        streamData.endDate,
      );
      expect(result).toEqual(stream);
      expect(cacheManager.del).toHaveBeenCalledWith(
        `streams_course_${streamData.courseId}`,
      );
    });

    it('должен выбросить исключение при неверных датах', async () => {
      await expect(
        service.createStream(
          '507f1f77bcf86cd799439011',
          'Поток 1',
          new Date('2025-03-31'),
          new Date('2025-03-01'),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addStudentToStream', () => {
    it('должен добавить студента в поток', async () => {
      const streamId = '507f1f77bcf86cd799439012';
      const studentId = '67c92217f30e0a8bcd56bf86';
      const stream = {
        _id: streamId,
        students: [],
        courseId: '507f1f77bcf86cd799439011',
      };
      mockStreamModel.findOneAndUpdate.mockResolvedValue({
        ...stream,
        students: [studentId],
      });

      const result = await service.addStudentToStream(streamId, studentId);
      expect(result!.students).toContain(studentId);
      expect(cacheManager.del).toHaveBeenCalledWith(`stream_${streamId}`);
    });
  });
});
