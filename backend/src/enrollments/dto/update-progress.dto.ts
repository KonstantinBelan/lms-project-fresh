import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the module',
  })
  @IsMongoId()
  @IsNotEmpty()
  moduleId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the lesson',
  })
  @IsMongoId()
  @IsNotEmpty()
  lessonId: string;
}
