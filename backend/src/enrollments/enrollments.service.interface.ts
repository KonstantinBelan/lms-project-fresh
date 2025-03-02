import { Enrollment } from './schemas/enrollment.schema';

export interface EnrollmentsService {
  createEnrollment(studentId: string, courseId: string): Promise<Enrollment>;
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
}
