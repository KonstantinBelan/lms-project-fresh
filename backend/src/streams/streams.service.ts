import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Stream, StreamDocument } from './schemas/stream.schema';

@Injectable()
export class StreamsService {
  constructor(
    @InjectModel(Stream.name) private streamModel: Model<StreamDocument>,
  ) {}

  /**
   * Создает новый поток для курса.
   * @param courseId - ID курса
   * @param name - Название потока
   * @param startDate - Дата начала потока
   * @param endDate - Дата окончания потока
   * @returns Созданный поток
   * @throws BadRequestException если startDate позже endDate
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
      courseId: new Types.ObjectId(courseId), // Преобразуем строку в ObjectId
      name,
      startDate,
      endDate,
      students: [], // Инициализируем пустой массив студентов
    });
    return stream.save();
  }

  /**
   * Добавляет студента в поток.
   * @param streamId - ID потока
   * @param studentId - ID студента
   * @returns Обновленный поток или null, если поток не найден
   * @throws BadRequestException если студент уже записан в поток
   */
  async addStudentToStream(
    streamId: string,
    studentId: string,
  ): Promise<Stream> {
    const studentObjectId = new Types.ObjectId(studentId);
    const updatedStream = await this.streamModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(streamId),
          students: { $ne: studentObjectId }, // Проверяем, что студента еще нет
        },
        { $addToSet: { students: studentObjectId } }, // Добавляем студента
        { new: true, lean: true }, // Возвращаем обновленный объект как plain JS
      )
      .exec();

    if (!updatedStream) {
      const stream = await this.streamModel.findById(streamId).lean().exec();
      if (!stream) return null; // Поток не найден
      throw new BadRequestException(
        `Студент с ID ${studentId} уже записан в поток ${streamId}`,
      );
    }

    return updatedStream;
  }

  /**
   * Находит поток по ID.
   * @param streamId - ID потока
   * @returns Поток или null, если не найден
   */
  async findStreamById(streamId: string): Promise<Stream> {
    return this.streamModel
      .findById(new Types.ObjectId(streamId))
      .lean()
      .exec();
  }

  /**
   * Получает все потоки для курса.
   * @param courseId - ID курса
   * @returns Список потоков
   */
  async getStreamsByCourse(courseId: string): Promise<Stream[]> {
    return this.streamModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .lean()
      .exec();
  }
}
