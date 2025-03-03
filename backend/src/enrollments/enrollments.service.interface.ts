import { Enrollment } from './schemas/enrollment.schema';
import { BatchEnrollmentDto } from './dto/batch-enrollment.dto';

export interface IEnrollmentsService {
  createEnrollment(
    studentId: string,
    courseId: string,
    deadline?: Date,
  ): Promise<Enrollment>;
  createBatchEnrollments(
    batchEnrollmentDto: BatchEnrollmentDto,
  ): Promise<Enrollment[]>;
  findEnrollmentsByStudent(studentId: string): Promise<Enrollment[]>;
  findEnrollmentById(enrollmentId: string): Promise<Enrollment | null>;
  updateProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<Enrollment | null>;
  completeCourse(
    enrollmentId: string,
    grade: number,
  ): Promise<Enrollment | null>;
  deleteEnrollment(enrollmentId: string): Promise<void>;
  getStudentProgress(studentId: string): Promise<any>;
  getDetailedStudentProgress(studentId: string): Promise<any>;
  notifyProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void>;
  exportEnrollmentsToCsv(): Promise<string>;
}
