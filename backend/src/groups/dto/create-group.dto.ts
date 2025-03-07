import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    example: 'Group 1',
    description: 'The name of the group',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'This is a description of Group 1',
    description: 'The description of the group',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
