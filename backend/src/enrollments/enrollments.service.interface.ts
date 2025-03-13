import { EnrollmentDocument } from './schemas/enrollment.schema';
import { BatchEnrollmentDto } from './dto/batch-enrollment.dto';

// Интерфейс для сервиса зачислений
export interface IEnrollmentsService {
  createEnrollment(
    studentId: string,
    courseId: string,
    deadline?: Date,
    streamId?: string,
    tariffId?: string,
    skipNotifications?: boolean,
  ): Promise<EnrollmentDocument>;
  createBatchEnrollments(
    batchEnrollmentDto: BatchEnrollmentDto,
  ): Promise<EnrollmentDocument[]>;
  findEnrollmentsByStudent(studentId: string): Promise<EnrollmentDocument[]>;
  findEnrollmentsByCourse(courseId: string): Promise<any[]>;
  findEnrollmentById(enrollmentId: string): Promise<EnrollmentDocument | null>;
  updateStudentProgress(
    studentId: string,
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument | null>;
  getStudentProgress(
    studentId: string,
    courseId: string,
  ): Promise<StudentProgress>;
  getDetailedStudentProgress(
    studentId: string,
  ): Promise<DetailedStudentProgress>;
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
  notifyProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void>;
  exportEnrollmentsToCsv(): Promise<string>;
  awardPoints(
    studentId: string,
    courseId: string,
    points: number,
  ): Promise<EnrollmentDocument>;
}

// Интерфейс для прогресса студента
export interface StudentProgress {
  studentId: string;
  courseId: string;
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  points: number;
  completionPercentage: number;
  completedModuleIds: string[];
  completedLessonIds: string[];
  avgHomeworkGrade: number;
  avgQuizScore: number;
}

// Интерфейс для детального прогресса по курсу
export interface DetailedCourseProgress {
  courseId: string;
  courseTitle: string;
  completionPercentage: number;
  lessonCompletionPercentage: number;
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  points: number;
  grade?: number;
  isCompleted: boolean;
  deadline: string | null;
}

// Интерфейс для детального прогресса студента
export interface DetailedStudentProgress {
  studentId: string;
  progress: DetailedCourseProgress[];
}
