// src/streams/streams.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { StreamsService } from './streams.service';
import { CreateStreamDto } from './dto/create-stream.dto';
import { AddStudentToStreamDto } from './dto/add-student-to-stream.dto';
import { StreamResponseDto } from './dto/stream-response.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

@ApiTags('Потоки')
@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый поток' })
  @ApiResponse({
    status: 201,
    description: 'Поток успешно создан',
    type: StreamResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Некорректные входные данные' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createStream(
    @Body() createStreamDto: CreateStreamDto,
  ): Promise<StreamResponseDto> {
    return this.streamsService.createStream(
      createStreamDto.courseId,
      createStreamDto.name,
      new Date(createStreamDto.startDate),
      new Date(createStreamDto.endDate),
    );
  }

  @Get(':streamId')
  @ApiOperation({ summary: 'Получить поток по ID' })
  @ApiParam({
    name: 'streamId',
    description: 'ID потока для получения',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Поток успешно получен',
    type: StreamResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Поток не найден' })
  async getStreamById(
    @Param('streamId') streamId: string,
  ): Promise<StreamResponseDto> {
    const stream = await this.streamsService.findStreamById(streamId);
    if (!stream) {
      throw new NotFoundException(`Поток с ID ${streamId} не найден`);
    }
    return stream;
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Получить все потоки курса' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса для получения потоков',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Список потоков успешно получен',
    type: [StreamResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Потоки для курса не найдены' })
  async getStreamsByCourse(
    @Param('courseId') courseId: string,
  ): Promise<StreamResponseDto[]> {
    const streams = await this.streamsService.getStreamsByCourse(courseId);
    if (!streams.length) {
      throw new NotFoundException(
        `Потоки для курса с ID ${courseId} не найдены`,
      );
    }
    return streams;
  }

  @Post(':streamId/students')
  @ApiOperation({ summary: 'Добавить студента в поток' })
  @ApiParam({
    name: 'streamId',
    description: 'ID потока для добавления студента',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Студент успешно добавлен в поток',
    type: StreamResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные или студент уже записан',
  })
  @ApiResponse({ status: 404, description: 'Поток не найден' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async addStudentToStream(
    @Param('streamId') streamId: string,
    @Body() addStudentDto: AddStudentToStreamDto,
  ): Promise<StreamResponseDto> {
    const updatedStream = await this.streamsService.addStudentToStream(
      streamId,
      addStudentDto.studentId,
    );
    if (!updatedStream) {
      throw new NotFoundException(`Поток с ID ${streamId} не найден`);
    }
    return updatedStream;
  }
}
