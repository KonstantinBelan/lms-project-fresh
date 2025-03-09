// src/streams/streams.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { StreamsService } from './streams.service';

@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Post()
  async createStream(
    @Body('courseId') courseId: string,
    @Body('name') name: string,
    @Body('startDate') startDate: Date,
    @Body('endDate') endDate: Date,
  ) {
    return this.streamsService.createStream(courseId, name, startDate, endDate);
  }
}
