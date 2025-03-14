import { Course } from './schemas/course.schema';
import { Module } from './schemas/module.schema';
import { Lesson } from './schemas/lesson.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { BatchCourseDto } from './dto/batch-course.dto';
import { LeaderboardEntry } from './dto/leaderboard-entry.dto';

// Интерфейс сервиса курсов
export interface ICoursesService {
  // Создание курса
  createCourse(createCourseDto: CreateCourseDto): Promise<Course>;
  // Пакетное создание курсов
  createBatchCourses(batchCourseDto: BatchCourseDto): Promise<Course[]>;
  // Получение всех курсов с пагинацией
  findAllCourses(
    skip?: number,
    limit?: number,
  ): Promise<{ courses: Course[]; total: number }>;
  // Поиск курса по ID
  findCourseById(courseId: string): Promise<Course | null>;
  // Обновление курса
  updateCourse(
    courseId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course | null>;
  // Удаление курса
  deleteCourse(courseId: string): Promise<null>;
  // Создание модуля
  createModule(
    courseId: string,
    createModuleDto: CreateModuleDto,
  ): Promise<Module>;
  // Поиск модуля по ID
  findModuleById(moduleId: string): Promise<Module | null>;
  // Создание урока
  createLesson(
    courseId: string,
    moduleId: string,
    createLessonDto: CreateLessonDto,
  ): Promise<Lesson>;
  // Поиск урока по ID
  findLessonById(lessonId: string): Promise<Lesson | null>;
  // Обновление урока
  updateLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    updateLessonDto: CreateLessonDto,
  ): Promise<Lesson | null>;
  // Удаление урока
  deleteLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<null>;
  // Получение статистики курса
  getCourseStatistics(courseId: string): Promise<any>;
  // Получение структуры курса
  getCourseStructure(courseId: string): Promise<any>;
  // Получение структуры курса для студента
  getStudentCourseStructure(studentId: string, courseId: string): Promise<any>;
  // Получение аналитики курса
  getCourseAnalytics(courseId: string): Promise<CourseAnalytics>;
  // Экспорт аналитики в CSV
  exportCourseAnalyticsToCSV(courseId: string): Promise<string>;
  // Получение таблицы лидеров
  getLeaderboard(courseId: string, limit: number): Promise<LeaderboardEntry[]>;
}

// Интерфейс аналитики курса
export interface CourseAnalytics {
  totalStudents: number;
  completedStudents: number;
  completionRate: number;
  averageGrade: number;
  moduleCompletion: {
    totalModules: number;
    completedModules: number;
    completionRate: number;
  };
  lessonCompletion: {
    totalLessons: number;
    completedLessons: number;
    completionRate: number;
  };
}
