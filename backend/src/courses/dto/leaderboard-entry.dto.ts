import { ApiProperty } from '@nestjs/swagger';

export class LeaderboardEntry {
  @ApiProperty({
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  studentId: string;

  @ApiProperty({ description: 'Student full name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Completion percentage', example: 85 })
  completionPercentage: number;

  @ApiProperty({ description: 'Total points earned', example: 150 })
  points: number;
}
