import { EnrollmentDocument } from './schemas/enrollment.schema';
import { BatchEnrollmentDto } from './dto/batch-enrollment.dto';

export interface IEnrollmentsService {
  createEnrollment(
    studentId: string,
    courseId: string,
    deadline?: Date,
  ): Promise<EnrollmentDocument>;
  createBatchEnrollments(
    batchEnrollmentDto: BatchEnrollmentDto,
  ): Promise<EnrollmentDocument[]>;
  findEnrollmentsByStudent(studentId: string): Promise<EnrollmentDocument[]>;
  findEnrollmentById(enrollmentId: string): Promise<EnrollmentDocument | null>;
  updateProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument | null>;
  completeCourse(
    enrollmentId: string,
    grade: number,
  ): Promise<EnrollmentDocument | null>;
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
