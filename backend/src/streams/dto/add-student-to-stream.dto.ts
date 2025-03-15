import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddStudentToStreamDto {
  @ApiProperty({
    description: 'Идентификатор студента для добавления в поток',
    example: '67c92217f30e0a8bcd56bf86',
  })
  @IsMongoId({ message: 'studentId должен быть валидным MongoDB ObjectId' })
  studentId: string;
}
