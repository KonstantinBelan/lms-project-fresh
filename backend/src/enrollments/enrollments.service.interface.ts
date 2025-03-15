import { EnrollmentDocument } from './schemas/enrollment.schema';
import { BatchEnrollmentDto } from './dto/batch-enrollment.dto';

// Интерфейс для сервиса зачислений
export interface IEnrollmentsService {
  // Создание одного зачисления
  createEnrollment(
    studentId: string,
    courseId: string,
    deadline?: Date,
    streamId?: string,
    tariffId?: string,
    skipNotifications?: boolean,
  ): Promise<EnrollmentDocument>;

  // Массовое создание зачислений
  createBatchEnrollments(
    batchEnrollmentDto: BatchEnrollmentDto,
  ): Promise<EnrollmentDocument[]>;

  // Поиск зачислений по идентификатору студента
  findEnrollmentsByStudent(studentId: string): Promise<EnrollmentDocument[]>;

  // Поиск зачислений по идентификатору курса
  findEnrollmentsByCourse(courseId: string): Promise<any[]>;

  // Поиск зачисления по идентификатору
  findEnrollmentById(enrollmentId: string): Promise<EnrollmentDocument | null>;

  // Обновление прогресса студента
  updateStudentProgress(
    studentId: string,
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument | null>;

  // Получение прогресса студента по курсу
  getStudentProgress(
    studentId: string,
    courseId: string,
  ): Promise<StudentProgress>;

  // Получение детального прогресса студента по всем курсам
  getDetailedStudentProgress(
    studentId: string,
  ): Promise<DetailedStudentProgress>;

  // Обновление прогресса по идентификатору зачисления
  updateProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument | null>;

  // Завершение курса с выставлением оценки
  completeCourse(
    enrollmentId: string,
    grade: number,
  ): Promise<EnrollmentDocument | null>;

  // Удаление зачисления
  deleteEnrollment(enrollmentId: string): Promise<void>;

  // Уведомление о прогрессе
  notifyProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void>;

  // Экспорт зачислений в CSV
  exportEnrollmentsToCsv(): Promise<string>;

  // Начисление баллов студенту за курс
  awardPoints(
    studentId: string,
    courseId: string,
    points: number,
  ): Promise<EnrollmentDocument>;
}

// Интерфейс для прогресса студента
export interface StudentProgress {
  studentId: string; // Идентификатор студента
  courseId: string; // Идентификатор курса
  completedModules: number; // Количество завершенных модулей
  totalModules: number; // Общее количество модулей
  completedLessons: number; // Количество завершенных уроков
  totalLessons: number; // Общее количество уроков
  points: number; // Количество набранных баллов
  completionPercentage: number; // Процент завершения курса
  completedModuleIds: string[]; // Список идентификаторов завершенных модулей
  completedLessonIds: string[]; // Список идентификаторов завершенных уроков
  avgHomeworkGrade: number; // Средняя оценка за домашние задания
  avgQuizScore: number; // Средний балл за тесты
}

// Интерфейс для детального прогресса по курсу
export interface DetailedCourseProgress {
  courseId: string; // Идентификатор курса
  courseTitle: string; // Название курса
  completionPercentage: number; // Процент завершения модулей
  lessonCompletionPercentage: number; // Процент завершения уроков
  completedModules: number; // Количество завершенных модулей
  totalModules: number; // Общее количество модулей
  completedLessons: number; // Количество завершенных уроков
  totalLessons: number; // Общее количество уроков
  points: number; // Количество набранных баллов
  grade?: number; // Оценка за курс (опционально)
  isCompleted: boolean; // Завершен ли курс
  deadline: string | null; // Дедлайн курса (если есть)
}

// Интерфейс для детального прогресса студента
export interface DetailedStudentProgress {
  studentId: string; // Идентификатор студента
  progress: DetailedCourseProgress[]; // Прогресс по всем курсам
}
