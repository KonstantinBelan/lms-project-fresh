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

@ApiTags('Streams')
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

  @Get(':streamId')
  @ApiOperation({ summary: 'Get a stream by ID' })
  @ApiParam({
    name: 'streamId',
    description: 'ID of the stream to retrieve',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Stream retrieved successfully',
    type: StreamResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Stream not found' })
  async getStreamById(@Param('streamId') streamId: string) {
    return this.streamsService.findStreamById(streamId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all streams for a course' })
  @ApiParam({
    name: 'courseId',
    description: 'ID of the course to retrieve streams for',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'List of streams retrieved successfully',
    type: [StreamResponseDto],
  })
  @ApiResponse({ status: 404, description: 'No streams found for this course' })
  async getStreamsByCourse(@Param('courseId') courseId: string) {
    return this.streamsService.getStreamsByCourse(courseId);
  }

  // @Post(':streamId/students')
  // @ApiOperation({ summary: 'Add a student to a stream' })
  // @ApiParam({
  //   name: 'streamId',
  //   description: 'ID of the stream to add the student to',
  //   example: '507f1f77bcf86cd799439012',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Student added to stream successfully',
  //   type: StreamResponseDto,
  // })
  // @ApiResponse({ status: 400, description: 'Invalid input data' })
  // @ApiResponse({ status: 404, description: 'Stream not found' })
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  // async addStudentToStream(
  //   @Param('streamId') streamId: string,
  //   @Body() addStudentDto: AddStudentToStreamDto,
  // ) {
  //   const updatedStream = await this.streamsService.addStudentToStream(
  //     streamId,
  //     addStudentDto.studentId,
  //   );
  //   return this.streamsService.findStreamById(streamId); // Возвращаем обновлённый поток
  // }

  @Post(':streamId/students')
  @ApiOperation({ summary: 'Add a student to a stream' })
  @ApiParam({
    name: 'streamId',
    description: 'ID of the stream to add the student to',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Student added to stream successfully',
    type: StreamResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or student already enrolled',
  })
  @ApiResponse({ status: 404, description: 'Stream not found' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async addStudentToStream(
    @Param('streamId') streamId: string,
    @Body() addStudentDto: AddStudentToStreamDto,
  ) {
    const updatedStream = await this.streamsService.addStudentToStream(
      streamId,
      addStudentDto.studentId,
    );
    if (!updatedStream) {
      throw new NotFoundException(`Stream with ID ${streamId} not found`);
    }
    return updatedStream;
  }
}
