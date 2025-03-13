import { ApiProperty } from '@nestjs/swagger';

export class LeaderboardEntry {
  @ApiProperty({
    description: 'ID студента',
    example: '507f1f77bcf86cd799439011',
  })
  studentId: string;

  @ApiProperty({
    description: 'Полное имя студента',
    example: 'Иван Иванов',
  })
  name: string;

  @ApiProperty({
    description: 'Процент завершения',
    example: 85,
  })
  completionPercentage: number;

  @ApiProperty({
    description: 'Общее количество баллов',
    example: 150,
  })
  points: number;
}
