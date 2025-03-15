import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

// Интерфейс для типизации DTO создания группы
export interface ICreateGroup {
  name: string;
  description?: string;
}

export class CreateGroupDto implements ICreateGroup {
  @ApiProperty({
    example: 'Группа 1',
    description: 'Название группы',
  })
  @IsString({ message: 'Название должно быть строкой' })
  name: string;

  @ApiProperty({
    example: 'Это описание группы 1',
    description: 'Описание группы',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  description?: string;
}
