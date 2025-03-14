import { ApiProperty, ApiResponse } from '@nestjs/swagger';

// DTO для записи в таблице лидеров
export class LeaderboardEntry {
  @ApiProperty({
    description: 'ID студента',
    example: '507f1f77bcf86cd799439011',
    examples: {
      student1: { value: '507f1f77bcf86cd799439011' },
      student2: { value: '507f1f77bcf86cd799439012' },
    },
  })
  studentId: string;

  @ApiProperty({
    description: 'Полное имя студента',
    example: 'Иван Иванов',
    examples: {
      ivan: { value: 'Иван Иванов' },
      maria: { value: 'Мария Петрова' },
    },
  })
  name: string;

  @ApiProperty({
    description: 'Процент завершения',
    example: 85,
    examples: {
      high: { value: 85 },
      low: { value: 45 },
    },
  })
  completionPercentage: number;

  @ApiProperty({
    description: 'Общее количество баллов',
    example: 150,
    examples: {
      highScore: { value: 150 },
      lowScore: { value: 50 },
    },
  })
  points: number;
}

// Интерфейс для LeaderboardEntry
export interface ILeaderboardEntry {
  studentId: string;
  name: string;
  completionPercentage: number;
  points: number;
}
