// src/tariffs/tariffs.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TariffsService } from './tariffs.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { TariffResponseDto } from './dto/tariff-response.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('tariffs') // Группируем endpoints в Swagger под тегом "tariffs"
@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tariff' })
  @ApiResponse({ status: 201, description: 'Tariff created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Валидация
  async createTariff(@Body() createTariffDto: CreateTariffDto) {
    return this.tariffsService.createTariff(
      createTariffDto.courseId,
      createTariffDto.name,
      createTariffDto.price,
      createTariffDto.accessibleModules,
      createTariffDto.includesHomeworks,
      createTariffDto.includesPoints,
    );
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get tariffs for a course' })
  @ApiParam({
    name: 'courseId',
    description: 'ID of the course to retrieve tariffs for',
    example: '67c848283c783d942cafb829',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tariffs retrieved successfully',
    type: [TariffResponseDto], // Указываем массив TariffResponseDto
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getTariffsByCourse(@Param('courseId') courseId: string) {
    return this.tariffsService.getTariffsByCourse(courseId);
  }
}
