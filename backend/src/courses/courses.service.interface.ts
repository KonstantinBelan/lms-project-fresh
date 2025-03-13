import { Course } from './schemas/course.schema';
import { Module } from './schemas/module.schema';
import { Lesson } from './schemas/lesson.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { BatchCourseDto } from './dto/batch-course.dto';
import { LeaderboardEntry } from './dto/leaderboard-entry.dto';

export interface ICoursesService {
  createCourse(createCourseDto: CreateCourseDto): Promise<Course>;
  createBatchCourses(batchCourseDto: BatchCourseDto): Promise<Course[]>;
  // findAllCourses(): Promise<Course[]>;
  findAllCourses(
    skip?: number,
    limit?: number,
  ): Promise<{ courses: Course[]; total: number }>;
  findCourseById(courseId: string): Promise<Course | null>;
  updateCourse(
    courseId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course | null>;
  deleteCourse(courseId: string): Promise<void>;
  createModule(
    courseId: string,
    createModuleDto: CreateModuleDto,
  ): Promise<Module>;
  findModuleById(moduleId: string): Promise<Module | null>;
  createLesson(
    courseId: string,
    moduleId: string,
    createLessonDto: CreateLessonDto,
  ): Promise<Lesson>;
  findLessonById(lessonId: string): Promise<Lesson | null>;
  updateLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    updateLessonDto: CreateLessonDto,
  ): Promise<Lesson | null>;
  deleteLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void>;
  getCourseStatistics(courseId: string): Promise<any>;
  getCourseStructure(courseId: string): Promise<any>;
  getStudentCourseStructure(studentId: string, courseId: string): Promise<any>;
  getCourseAnalytics(courseId: string): Promise<CourseAnalytics>;
  exportCourseAnalyticsToCSV(courseId: string): Promise<string>;
  getLeaderboard(courseId: string, limit: number): Promise<LeaderboardEntry[]>;
}

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
