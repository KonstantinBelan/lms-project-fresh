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
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { mapToStreamResponseDto } from './mappers/stream.mapper';

@ApiTags('Потоки')
@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Создать новый поток' })
  @ApiResponse({
    status: 201,
    description: 'Поток успешно создан',
    type: StreamResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные входные данные',
    schema: {
      example: { message: 'Дата начала должна быть раньше даты окончания' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный формат courseId',
    schema: {
      example: { message: 'courseId должен быть валидным MongoDB ObjectId' },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createStream(
    @Body() createStreamDto: CreateStreamDto,
  ): Promise<StreamResponseDto> {
    const stream = await this.streamsService.createStream(
      createStreamDto.courseId,
      createStreamDto.name,
      new Date(createStreamDto.startDate),
      new Date(createStreamDto.endDate),
    );
    return mapToStreamResponseDto(stream);
  }

  @Get(':streamId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Получить поток по идентификатору' })
  @ApiParam({
    name: 'streamId',
    description: 'Идентификатор потока для получения',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Поток успешно получен',
    type: StreamResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Поток не найден',
    schema: {
      example: {
        message: 'Поток с идентификатором 507f1f77bcf86cd799439012 не найден',
      },
    },
  })
  async getStreamById(
    @Param('streamId') streamId: string,
  ): Promise<StreamResponseDto> {
    const stream = await this.streamsService.findStreamById(streamId);
    if (!stream) {
      throw new NotFoundException(
        `Поток с идентификатором ${streamId} не найден`,
      );
    }
    return mapToStreamResponseDto(stream);
  }

  @Get('course/:courseId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Получить все потоки курса' })
  @ApiParam({
    name: 'courseId',
    description: 'Идентификатор курса для получения потоков',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Список потоков успешно получен',
    type: [StreamResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Потоки для курса не найдены',
    schema: {
      example: {
        message:
          'Потоки для курса с идентификатором 507f1f77bcf86cd799439011 не найдены',
      },
    },
  })
  async getStreamsByCourse(
    @Param('courseId') courseId: string,
  ): Promise<StreamResponseDto[]> {
    const streams = await this.streamsService.getStreamsByCourse(courseId);
    if (!streams.length) {
      throw new NotFoundException(
        `Потоки для курса с идентификатором ${courseId} не найдены`,
      );
    }
    return streams.map(mapToStreamResponseDto);
  }

  @Post(':streamId/students')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Добавить студента в поток' })
  @ApiParam({
    name: 'streamId',
    description: 'Идентификатор потока для добавления студента',
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
    schema: {
      example: {
        message:
          'Студент с идентификатором 67c92217f30e0a8bcd56bf86 уже записан в поток 507f1f77bcf86cd799439012',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Поток не найден',
    schema: {
      example: {
        message: 'Поток с идентификатором 507f1f77bcf86cd799439012 не найден',
      },
    },
  })
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
      throw new NotFoundException(
        `Поток с идентификатором ${streamId} не найден`,
      );
    }
    return mapToStreamResponseDto(updatedStream);
  }
}
