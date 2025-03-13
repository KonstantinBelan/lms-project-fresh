import { Homework, HomeworkDocument } from './schemas/homework.schema';
import { Submission, SubmissionDocument } from './schemas/submission.schema';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

export interface IHomeworksService {
  createHomework(
    createHomeworkDto: CreateHomeworkDto,
  ): Promise<HomeworkDocument>;
  updateHomework(
    id: string,
    updateHomeworkDto: UpdateHomeworkDto,
  ): Promise<HomeworkDocument>;
  deleteHomework(id: string): Promise<void>;
  findHomeworkById(id: string): Promise<HomeworkDocument>;
  findHomeworksByLesson(
    lessonId: string,
    skip?: number,
    limit?: number,
  ): Promise<{ homeworks: Homework[]; total: number }>;
  createSubmission(
    createSubmissionDto: CreateSubmissionDto,
  ): Promise<SubmissionDocument>;
  updateSubmission(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<SubmissionDocument>;
  findSubmissionById(id: string): Promise<SubmissionDocument>;
  findSubmissionsByHomework(
    homeworkId: string,
    skip?: number,
    limit?: number,
  ): Promise<{ submissions: Submission[]; total: number }>;
  findSubmissionsByStudent(
    studentId: string,
    skip?: number,
    limit?: number,
  ): Promise<{ submissions: Submission[]; total: number }>;
  autoCheckSubmission(
    submissionId: string,
  ): Promise<{ grade: number; comment: string }>;
  checkDeadlines(): Promise<void>;
  checkDeadlineNotifications(homeworkId: string): Promise<void>;
  getSubmissionsByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<Submission[]>;
  getHomeworksByCourse(courseId: string): Promise<Homework[]>;
  getSubmissionsByCourse(courseId: string): Promise<Submission[]>;
}
