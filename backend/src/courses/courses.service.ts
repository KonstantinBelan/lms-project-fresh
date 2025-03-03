import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { Module, ModuleDocument } from './schemas/module.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { ICoursesService } from './courses.service.interface';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { BatchCourseDto } from './dto/batch-course.dto';
import { Types } from 'mongoose';

@Injectable()
export class CoursesService implements ICoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Module.name) private moduleModel: Model<ModuleDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
  ) {}

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    const newCourse = new this.courseModel(createCourseDto);
    return newCourse.save();
  }

  async createBatchCourses(batchCourseDto: BatchCourseDto): Promise<Course[]> {
    console.log('Creating batch courses:', batchCourseDto);
    const courses: Course[] = [];

    for (const courseData of batchCourseDto.courses) {
      try {
        const course = await this.createCourse({
          title: courseData.title,
          description: courseData.description,
        });
        courses.push(course);
      } catch (error) {
        console.error(`Failed to create course ${courseData.title}:`, error);
        // Можно продолжить с остальными, если ошибка не критична
      }
    }

    return courses;
  }

  async findAllCourses(): Promise<Course[]> {
    // return this.courseModel.find().exec();
    return this.courseModel.find().lean().exec(); // Используем .lean()
  }

  async findCourseById(courseId: string): Promise<Course | null> {
    // return this.courseModel.findById(courseId).exec();
    return this.courseModel.findById(courseId).lean().exec(); // Используем .lean()
  }

  async updateCourse(
    courseId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course | null> {
    return this.courseModel
      .findByIdAndUpdate(courseId, updateCourseDto, { new: true })
      .exec();
  }

  async deleteCourse(courseId: string): Promise<void> {
    await this.courseModel.findByIdAndDelete(courseId).exec();
  }

  async createModule(
    courseId: string,
    createModuleDto: CreateModuleDto,
  ): Promise<Module> {
    const course = (await this.courseModel.findById(
      courseId,
    )) as CourseDocument;
    if (!course) throw new Error('Course not found');

    const newModule = new this.moduleModel({
      ...createModuleDto,
      courseId: course._id,
    });
    const savedModule = (await newModule.save()) as ModuleDocument;

    course.modules.push(savedModule._id); // Теперь добавляем Types.ObjectId
    await course.save();

    return savedModule;
  }

  async findModuleById(moduleId: string): Promise<Module | null> {
    return this.moduleModel.findById(moduleId).exec();
  }

  async createLesson(
    courseId: string,
    moduleId: string,
    createLessonDto: CreateLessonDto,
  ): Promise<Lesson> {
    const module = (await this.moduleModel.findById(
      moduleId,
    )) as ModuleDocument;
    if (!module) throw new Error('Module not found');

    const newLesson = new this.lessonModel({
      ...createLessonDto,
      moduleId: module._id,
    });
    const savedLesson = (await newLesson.save()) as LessonDocument;

    module.lessons.push(savedLesson._id); // Теперь добавляем Types.ObjectId
    await module.save();

    return savedLesson;
  }

  async findLessonById(lessonId: string): Promise<Lesson | null> {
    return this.lessonModel.findById(lessonId).exec();
  }

  async findCourseByLesson(lessonId: string): Promise<any> {
    // Замени any на конкретный тип, если известен
    // const course = await this.courseModel
    //   .findOne({ 'modules.lessons': new Types.ObjectId(lessonId) })
    //   .exec();
    const course = await this.courseModel
      .findOne({ 'modules.lessons': new Types.ObjectId(lessonId) })
      .lean()
      .exec(); // Используем .lean()
    return course;
  }

  async getCourseStatistics(courseId: string): Promise<any> {
    const course = (await this.courseModel.findById(
      courseId,
    )) as CourseDocument;
    if (!course) throw new Error('Course not found');

    const totalModules = course.modules.length || 0;
    const totalLessons = await this.moduleModel
      .aggregate([
        { $match: { _id: { $in: course.modules } } },
        { $unwind: '$lessons' },
        { $group: { _id: null, total: { $sum: 1 } } },
      ])
      .exec();

    return {
      courseId: course._id.toString(),
      courseTitle: course.title,
      totalModules,
      totalLessons: totalLessons.length > 0 ? totalLessons[0].total : 0,
    };
  }
}
