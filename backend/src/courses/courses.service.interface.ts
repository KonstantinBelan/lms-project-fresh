import { Course } from './schemas/course.schema';
import { Module } from './schemas/module.schema';
import { Lesson } from './schemas/lesson.schema';

export interface ICoursesService {
  createCourse(title: string, description: string): Promise<Course>;
  findAllCourses(): Promise<Course[]>;
  findCourseById(id: string): Promise<Course | null>;
  updateCourse(
    id: string,
    title: string,
    description: string,
  ): Promise<Course | null>;
  deleteCourse(id: string): Promise<void>;
  addModule(courseId: string, moduleTitle: string): Promise<Module>;
  addLesson(
    moduleId: string,
    lessonTitle: string,
    content: string,
    media?: string,
  ): Promise<Lesson>;
  getCourseStatistics(courseId: string): Promise<any>;
}
