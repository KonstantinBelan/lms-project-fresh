import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { Module, ModuleDocument } from './schemas/module.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { ICoursesService } from './courses.service.interface'; // Обновлённый импорт

@Injectable()
export class CoursesService implements ICoursesService {
  // Изменили на ICoursesService
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Module.name) private moduleModel: Model<ModuleDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
  ) {}

  async createCourse(title: string, description: string): Promise<Course> {
    const newCourse = new this.courseModel({ title, description });
    return newCourse.save();
  }

  async findAllCourses(): Promise<Course[]> {
    return this.courseModel.find().exec();
  }

  async findCourseById(id: string): Promise<Course | null> {
    return this.courseModel.findById(id).populate('modules').exec();
  }

  async updateCourse(
    id: string,
    title: string,
    description: string,
  ): Promise<Course | null> {
    return this.courseModel
      .findByIdAndUpdate(
        id,
        { title, description },
        { new: true, runValidators: true },
      )
      .exec();
  }

  async deleteCourse(id: string): Promise<void> {
    await this.courseModel.findByIdAndDelete(id).exec();
  }

  async addModule(courseId: string, moduleTitle: string): Promise<Module> {
    const newModule = new this.moduleModel({ title: moduleTitle });
    const savedModule = await newModule.save();
    await this.courseModel
      .findByIdAndUpdate(
        courseId,
        { $push: { modules: savedModule._id } },
        { new: true },
      )
      .exec();
    return savedModule;
  }

  async addLesson(
    moduleId: string,
    lessonTitle: string,
    content: string,
    media?: string,
  ): Promise<Lesson> {
    const newLesson = new this.lessonModel({
      title: lessonTitle,
      content,
      media,
    });
    const savedLesson = await newLesson.save();
    await this.moduleModel
      .findByIdAndUpdate(
        moduleId,
        { $push: { lessons: savedLesson._id } },
        { new: true },
      )
      .exec();
    return savedLesson;
  }
}
