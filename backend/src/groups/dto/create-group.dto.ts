import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    example: 'Group 1',
    description: 'Название группы',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Это описание группы 1',
    description: 'Описание группы',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
