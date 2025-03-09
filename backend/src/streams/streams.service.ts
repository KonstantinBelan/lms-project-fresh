// src/streams/streams.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Stream, StreamDocument } from './schemas/stream.schema';

@Injectable()
export class StreamsService {
  constructor(
    @InjectModel(Stream.name) private streamModel: Model<StreamDocument>,
  ) {}

  async createStream(
    courseId: string,
    name: string,
    startDate: Date,
    endDate: Date,
  ): Promise<StreamDocument> {
    const stream = new this.streamModel({
      courseId: new Types.ObjectId(courseId), // Преобразуем в ObjectId
      name,
      startDate,
      endDate,
      students: [], // Явно инициализируем пустой массив
    });
    return stream.save();
  }

  async addStudentToStream(
    streamId: string,
    studentId: string,
  ): Promise<StreamDocument | null> {
    // Сначала проверяем, существует ли поток и студент уже в нём
    const stream = await this.streamModel
      .findById(new Types.ObjectId(streamId))
      .lean()
      .exec();

    if (!stream) {
      return null; // Поток не найден, вернём null (обработка в контроллере)
    }

    const studentObjectId = new Types.ObjectId(studentId);
    if (stream.students.some((id) => id.equals(studentObjectId))) {
      throw new BadRequestException(
        `Student with ID ${studentId} is already enrolled in stream ${streamId}`,
      );
    }

    // Если студента нет, добавляем его
    const updatedStream = await this.streamModel
      .findByIdAndUpdate(
        new Types.ObjectId(streamId),
        { $addToSet: { students: studentObjectId } },
        { new: true },
      )
      .lean()
      .exec();

    return updatedStream;
  }

  async findStreamById(streamId: string): Promise<StreamDocument | null> {
    return this.streamModel
      .findById(new Types.ObjectId(streamId))
      .lean()
      .exec();
  }

  async getStreamsByCourse(courseId: string): Promise<StreamDocument[]> {
    return this.streamModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .lean()
      .exec();
  }
}
