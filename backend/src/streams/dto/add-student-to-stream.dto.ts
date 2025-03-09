// src/streams/dto/add-student-to-stream.dto.ts
import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddStudentToStreamDto {
  @ApiProperty({
    description: 'ID of the student to add to the stream',
    example: '67c92217f30e0a8bcd56bf86',
  })
  @IsMongoId({ message: 'studentId must be a valid MongoDB ObjectId' })
  studentId: string;
}
