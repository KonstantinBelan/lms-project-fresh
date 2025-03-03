import { Course } from './schemas/course.schema';
import { Module } from './schemas/module.schema';
import { Lesson } from './schemas/lesson.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';

export interface ICoursesService {
  createCourse(createCourseDto: CreateCourseDto): Promise<Course>;
  findAllCourses(): Promise<Course[]>;
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
  getCourseStatistics(courseId: string): Promise<any>; // Добавляем новый метод
}
