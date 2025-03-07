import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ description: 'Group name', example: 'Group A' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Group description',
    example: 'Students',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
