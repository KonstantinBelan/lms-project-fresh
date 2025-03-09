// src/tariffs/tariffs.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TariffsService } from './tariffs.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tariff' })
  @ApiResponse({ status: 201, description: 'Tariff created' })
  async createTariff(
    @Body('courseId') courseId: string,
    @Body('name') name: string,
    @Body('price') price: number,
    @Body('accessibleModules') accessibleModules: string[],
    @Body('includesHomeworks') includesHomeworks: boolean,
    @Body('includesPoints') includesPoints: boolean,
  ) {
    return this.tariffsService.createTariff(
      courseId,
      name,
      price,
      accessibleModules,
      includesHomeworks,
      includesPoints,
    );
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get tariffs for a course' })
  @ApiResponse({ status: 200, description: 'List of tariffs' })
  async getTariffsByCourse(@Param('courseId') courseId: string) {
    return this.tariffsService.getTariffsByCourse(courseId);
  }
}
