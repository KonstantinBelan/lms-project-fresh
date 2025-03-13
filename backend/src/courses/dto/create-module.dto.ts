import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({
    example: 'Модуль 1',
    description: 'Название модуля',
  })
  @IsString()
  @IsNotEmpty({ message: 'Название модуля не может быть пустым' })
  title: string;
}
