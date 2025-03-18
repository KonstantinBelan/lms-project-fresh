import { IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginatedFilterDto } from '../../common/dto/paginated-filter.dto';
import { IsDateBefore } from '../../common/decorators/is-date-before.decorator';
import { Type } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

// DTO для фильтрации активности по датам
export class GetActivityDto extends PaginatedFilterDto {
  @ApiProperty({
    description: 'Начальная дата для фильтрации активности (ISO 8601)',
    required: false,
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  @IsDateBefore('endDate', {
    message: 'Начальная дата должна быть раньше даты окончания 2',
  })
  startDate?: string;

  @ApiProperty({
    description: 'Конечная дата для фильтрации активности (ISO 8601)',
    required: false,
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // validateDates() {
  //   if (
  //     this.startDate &&
  //     this.endDate &&
  //     new Date(this.startDate) > new Date(this.endDate)
  //   ) {
  //     throw new BadRequestException(
  //       'Начальная дата должна быть раньше даты окончания',
  //     );
  //   }
  // }
}
