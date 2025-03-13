import { Homework } from './schemas/homework.schema';
import { Submission } from './schemas/submission.schema';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

export interface IHomeworksService {
  createHomework(createHomeworkDto: CreateHomeworkDto): Promise<Homework>;
  updateHomework(
    id: string,
    updateHomeworkDto: UpdateHomeworkDto,
  ): Promise<Homework | null>;
  deleteHomework(id: string): Promise<void>;
  findHomeworkById(id: string): Promise<Homework | null>;
  findHomeworksByLesson(lessonId: string): Promise<Homework[]>;
  createSubmission(
    createSubmissionDto: CreateSubmissionDto,
  ): Promise<Submission>;
  updateSubmission(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<Submission | null>;
  findSubmissionById(id: string): Promise<Submission | null>;
  findSubmissionsByHomework(homeworkId: string): Promise<Submission[]>;
  findSubmissionsByStudent(studentId: string): Promise<Submission[]>;
}
