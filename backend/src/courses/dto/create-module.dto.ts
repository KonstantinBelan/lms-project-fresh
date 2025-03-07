import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({
    example: 'Module 1',
    description: 'The title of the module',
  })
  @IsString()
  title: string;
}
