import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TariffsService } from './tariffs.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { TariffResponseDto } from './dto/tariff-response.dto';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { mapToTariffResponseDto } from './mappers/tariff.mapper';

@ApiTags('Тарифы')
@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый тариф' })
  @ApiResponse({
    status: 201,
    description: 'Тариф успешно создан',
    type: TariffResponseDto,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Некорректные входные данные',
    schema: {
      example: { message: 'Цена тарифа не может быть отрицательной' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Невалидный формат courseId',
    schema: {
      example: { message: 'courseId должен быть валидным MongoDB ObjectId' },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createTariff(
    @Body() createTariffDto: CreateTariffDto,
  ): Promise<TariffResponseDto> {
    const tariff = await this.tariffsService.createTariff(
      createTariffDto.courseId,
      createTariffDto.name,
      createTariffDto.price,
      createTariffDto.accessibleModules,
      createTariffDto.includesHomeworks,
      createTariffDto.includesPoints,
    );
    return mapToTariffResponseDto(tariff);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Получить тарифы для курса' })
  @ApiParam({
    name: 'courseId',
    description: 'Идентификатор курса для получения тарифов',
    example: '67c848283c783d942cafb829',
  })
  @ApiResponse({
    status: 200,
    description: 'Список тарифов успешно получен',
    type: [TariffResponseDto],
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Тарифы для курса не найдены',
    schema: {
      example: {
        message: 'Тарифы для курса с ID 67c848283c783d942cafb829 не найдены',
      },
    },
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Невалидный формат courseId',
    schema: {
      example: { message: 'courseId должен быть валидным MongoDB ObjectId' },
    },
  })
  async getTariffsByCourse(
    @Param('courseId') courseId: string,
  ): Promise<TariffResponseDto[]> {
    const tariffs = await this.tariffsService.getTariffsByCourse(courseId);
    if (!tariffs.length) {
      throw new NotFoundException(
        `Тарифы для курса с ID ${courseId} не найдены`,
      );
    }
    return tariffs.map(mapToTariffResponseDto);
  }
}
