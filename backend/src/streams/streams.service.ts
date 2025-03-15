import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Stream, StreamDocument } from './schemas/stream.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class StreamsService {
  constructor(
    @InjectModel(Stream.name) private streamModel: Model<StreamDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Создает новый поток для курса.
   * @param courseId - Идентификатор курса
   * @param name - Название потока
   * @param startDate - Дата начала потока
   * @param endDate - Дата окончания потока
   * @returns Созданный поток
   * @throws BadRequestException если дата начала позже даты окончания
   */
  async createStream(
    courseId: string,
    name: string,
    startDate: Date,
    endDate: Date,
  ): Promise<StreamDocument> {
    if (startDate >= endDate) {
      throw new BadRequestException(
        'Дата начала должна быть раньше даты окончания',
      );
    }

    const stream = new this.streamModel({
      courseId: new Types.ObjectId(courseId),
      name,
      startDate,
      endDate,
      students: [],
    });

    const savedStream = await stream.save();
    // Сбрасываем кеш для курса после создания потока
    await this.cacheManager.del(`streams_course_${courseId}`);
    return savedStream;
  }

  /**
   * Добавляет студента в поток.
   * @param streamId - Идентификатор потока
   * @param studentId - Идентификатор студента
   * @returns Обновленный поток или null, если поток не найден
   * @throws BadRequestException если студент уже записан в поток
   */
  async addStudentToStream(
    streamId: string,
    studentId: string,
  ): Promise<Stream | null> {
    const studentObjectId = new Types.ObjectId(studentId);
    const updatedStream = await this.streamModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(streamId),
          students: { $ne: studentObjectId },
        },
        { $addToSet: { students: studentObjectId } },
        { new: true, lean: true },
      )
      .exec();

    if (!updatedStream) {
      const stream = await this.streamModel.findById(streamId).lean().exec();
      if (!stream) return null;
      throw new BadRequestException(
        `Студент с идентификатором ${studentId} уже записан в поток ${streamId}`,
      );
    }

    // Сбрасываем кеш для потока и курса
    await this.cacheManager.del(`stream_${streamId}`);
    await this.cacheManager.del(`streams_course_${updatedStream.courseId}`);
    return updatedStream;
  }

  /**
   * Находит поток по идентификатору с кэшированием.
   * @param streamId - Идентификатор потока
   * @returns Поток или null, если не найден
   */
  async findStreamById(streamId: string): Promise<Stream | null> {
    const cacheKey = `stream_${streamId}`;
    const cachedStream = await this.cacheManager.get<Stream>(cacheKey);

    if (cachedStream) {
      return cachedStream;
    }

    const stream = await this.streamModel
      .findById(new Types.ObjectId(streamId))
      .lean()
      .exec();

    if (stream) {
      await this.cacheManager.set(cacheKey, stream, 600); // Кеш на 10 минут
    }
    return stream;
  }

  /**
   * Получает все потоки для курса с кэшированием.
   * @param courseId - Идентификатор курса
   * @returns Список потоков
   */
  async getStreamsByCourse(courseId: string): Promise<Stream[]> {
    const cacheKey = `streams_course_${courseId}`;
    const cachedStreams = await this.cacheManager.get<Stream[]>(cacheKey);

    if (cachedStreams) {
      return cachedStreams;
    }

    const streams = await this.streamModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .lean()
      .exec();

    await this.cacheManager.set(cacheKey, streams, 600); // Кеш на 10 минут
    return streams;
  }
}
