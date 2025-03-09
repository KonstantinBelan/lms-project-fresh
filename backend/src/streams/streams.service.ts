// src/streams/streams.service.ts
import { Injectable } from '@nestjs/common';
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

  async addStudentToStream(streamId: string, studentId: string): Promise<any> {
    return this.streamModel.updateOne(
      { _id: new Types.ObjectId(streamId) }, // Преобразуем streamId
      { $addToSet: { students: new Types.ObjectId(studentId) } }, // Преобразуем studentId
    );
  }

  async findStreamById(streamId: string): Promise<StreamDocument | null> {
    return this.streamModel
      .findById(new Types.ObjectId(streamId))
      .lean()
      .exec();
  }
}
