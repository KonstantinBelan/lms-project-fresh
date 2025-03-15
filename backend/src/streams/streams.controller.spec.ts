import { Test, TestingModule } from '@nestjs/testing';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';

describe('StreamsController', () => {
  let controller: StreamsController;
  let service: StreamsService;

  const mockStreamsService = {
    createStream: jest.fn(),
    findStreamById: jest.fn(),
    getStreamsByCourse: jest.fn(),
    addStudentToStream: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreamsController],
      providers: [{ provide: StreamsService, useValue: mockStreamsService }],
    }).compile();

    controller = module.get<StreamsController>(StreamsController);
    service = module.get<StreamsService>(StreamsService);
  });

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  describe('createStream', () => {
    it('должен создать поток', async () => {
      const dto = {
        courseId: '507f1f77bcf86cd799439011',
        name: 'Поток 1',
        startDate: '2025-03-01T00:00:00.000Z',
        endDate: '2025-03-31T23:59:59.999Z',
      };
      const stream = { ...dto, _id: '507f1f77bcf86cd799439012', students: [] };
      mockStreamsService.createStream.mockResolvedValue(stream);

      const result = await controller.createStream(dto);
      expect(result._id).toBe(stream._id);
    });
  });

  describe('getStreamById', () => {
    it('должен вернуть поток', async () => {
      const stream = {
        _id: '507f1f77bcf86cd799439012',
        name: 'Поток 1',
        students: [],
      };
      mockStreamsService.findStreamById.mockResolvedValue(stream);

      const result = await controller.getStreamById(stream._id);
      expect(result._id).toBe(stream._id);
    });
  });
});
