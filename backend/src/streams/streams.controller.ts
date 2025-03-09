// src/streams/streams.controller.ts
import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { StreamsService } from './streams.service';
import { CreateStreamDto } from './dto/create-stream.dto';
import { StreamResponseDto } from './dto/stream-response.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Streams') // Группируем endpoints под тегом "streams"
@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new stream' })
  @ApiResponse({
    status: 201,
    description: 'Stream created successfully',
    type: StreamResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createStream(@Body() createStreamDto: CreateStreamDto) {
    return this.streamsService.createStream(
      createStreamDto.courseId,
      createStreamDto.name,
      new Date(createStreamDto.startDate),
      new Date(createStreamDto.endDate),
    );
  }
}
