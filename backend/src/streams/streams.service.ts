// src/streams/streams.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
  ) {
    const stream = new this.streamModel({ courseId, name, startDate, endDate });
    return stream.save();
  }

  async addStudentToStream(streamId: string, studentId: string) {
    return this.streamModel.updateOne(
      { _id: streamId },
      { $addToSet: { students: studentId } },
    );
  }

  async findStreamById(streamId: string) {
    return this.streamModel.findById(streamId).lean().exec();
  }
}
