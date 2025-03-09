import { ApiProperty } from '@nestjs/swagger';

export class StudentProgress {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  studentId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  courseId: string;

  @ApiProperty({ example: 2 })
  completedModules: number;

  @ApiProperty({ example: 3 })
  totalModules: number;

  @ApiProperty({ example: 5 })
  completedLessons: number;

  @ApiProperty({ example: 10 })
  totalLessons: number;

  points: number;

  @ApiProperty({ example: 50 })
  completionPercentage: number;

  @ApiProperty({ example: ['507f1f77bcf86cd799439013'], isArray: true })
  completedModuleIds: string[];

  @ApiProperty({ example: ['507f1f77bcf86cd799439014'], isArray: true })
  completedLessonIds: string[];

  avgHomeworkGrade: number;
  avgQuizScore: number;
}
