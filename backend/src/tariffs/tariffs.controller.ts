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
import { TariffsService } from './tariffs.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { TariffResponseDto } from './dto/tariff-response.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({ status: 400, description: 'Некорректные входные данные' })
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
    description: 'ID курса для получения тарифов',
    example: '67c848283c783d942cafb829',
  })
  @ApiResponse({
    status: 200,
    description: 'Список тарифов успешно получен',
    type: [TariffResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Тарифы для курса не найдены' })
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
