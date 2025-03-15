import { ApiProperty } from '@nestjs/swagger';

// Интерфейс для типизации ответа группы
export interface IGroupResponse {
  _id: string;
  name: string;
  description?: string;
  students: string[];
}

export class GroupResponseDto implements IGroupResponse {
  @ApiProperty({
    description: 'Уникальный идентификатор группы',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Название группы',
    example: 'Группа 1',
  })
  name: string;

  @ApiProperty({
    description: 'Описание группы',
    example: 'Это описание группы 1',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Массив идентификаторов студентов в группе',
    example: ['507f191e810c19729de860ea'],
    type: [String],
  })
  students: string[];
}
