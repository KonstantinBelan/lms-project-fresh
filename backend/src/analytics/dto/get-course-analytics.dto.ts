import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetCourseAnalyticsDto {
  @ApiProperty({
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  courseId: string;
}
