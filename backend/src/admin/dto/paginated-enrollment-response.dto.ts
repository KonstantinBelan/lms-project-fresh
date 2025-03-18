import { ApiProperty } from '@nestjs/swagger';
import { Enrollment } from '../../enrollments/schemas/enrollment.schema';
import { EnrollmentResponseDto } from '../../enrollments/dto/enrollment-response.dto';
import { PaginatedFilterTotalDto } from 'src/common/dto/paginated-filter.dto';

export class PaginatedEnrollmentDto extends PaginatedFilterTotalDto {
  @ApiProperty({
    type: [Enrollment],
    description: 'Массив записей о зачислении',
  })
  data: Enrollment[];
}

export class PaginatedEnrollmentResponseDto extends PaginatedFilterTotalDto {
  @ApiProperty({
    type: [EnrollmentResponseDto],
    description: 'Массив записей о зачислении',
  })
  data: EnrollmentResponseDto[];
}
