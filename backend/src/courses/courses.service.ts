import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { Module, ModuleDocument } from './schemas/module.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { ICoursesService, CourseAnalytics } from './courses.service.interface';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { BatchCourseDto } from './dto/batch-course.dto';
import { Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createObjectCsvWriter } from 'csv-writer';

// Настраиваемый TTL кэша (в секундах)
const CACHE_TTL = 3600; // 1 час по умолчанию
// const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 3600; // 1 час по умолчанию

@Injectable()
export class CoursesService implements ICoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Module.name) private moduleModel: Model<ModuleDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // Инжектируем кэш
  ) {}

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    const newCourse = new this.courseModel(createCourseDto);
    return newCourse.save();
  }

  async createBatchCourses(batchCourseDto: BatchCourseDto): Promise<Course[]> {
    this.logger.debug('Creating batch courses:', batchCourseDto);
    const courses: Course[] = [];

    for (const courseData of batchCourseDto.courses) {
      try {
        const course = await this.createCourse({
          title: courseData.title,
          description: courseData.description,
        });
        courses.push(course);
      } catch (error) {
        this.logger.error(
          `Failed to create course ${courseData.title}:`,
          error,
        );
        // Можно продолжить с остальными, если ошибка не критична
      }
    }

    return courses;
  }

  async findAllCourses(): Promise<Course[]> {
    const cacheKey = 'courses:all';
    const cachedCourses = await this.cacheManager.get<Course[]>(cacheKey);
    if (cachedCourses) {
      this.logger.debug('Courses found in cache:', cachedCourses);
      return cachedCourses;
    }

    const courses = await this.courseModel.find().lean().exec();
    this.logger.debug('Courses found in DB:', courses);
    await this.cacheManager.set(cacheKey, courses, 3600); // Кэшируем на 1 час
    return courses;
  }

  async findCourseById(id: string): Promise<Course | null> {
    const cacheKey = `course:${id}`;
    const cachedCourse = await this.cacheManager.get<Course>(cacheKey);
    if (cachedCourse) {
      this.logger.debug('Course found in cache:', cachedCourse);
      return cachedCourse;
    }

    const course = await this.courseModel.findById(id).lean().exec();
    this.logger.debug('Course found in DB:', course);
    if (course) await this.cacheManager.set(cacheKey, course, 3600); // Кэшируем на 1 час
    return course;
  }

  async updateCourse(
    courseId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course | null> {
    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(courseId, updateCourseDto, { new: true })
      .exec();
    await this.cacheManager.del(`course:${courseId}`);
    await this.cacheManager.del('courses:all'); // Очистка общего кэша
    return updatedCourse;
  }

  async deleteCourse(courseId: string): Promise<void> {
    await this.cacheManager.del(`course:${courseId}`); // Очищаем кэш для этой записи
    await this.cacheManager.del('courses:all'); // Очищаем кэш всех курсов
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

    await this.cacheManager.del(`course:${courseId}`); // Очищаем кэш курса
    await this.cacheManager.del('courses:all'); // Очищаем кэш всех курсов

    return savedModule;
  }

  async findModuleById(moduleId: string): Promise<Module | null> {
    return this.moduleModel.findById(moduleId).lean().exec();
  }

  async findModuleByCourseAndTitle(
    courseId: string,
    title: string,
  ): Promise<Module | null> {
    const cacheKey = `module:course:${courseId}:title:${title}`;
    const cachedModule = await this.cacheManager.get<Module>(cacheKey);
    if (cachedModule) {
      this.logger.debug('Module found in cache:', cachedModule);
      return cachedModule;
    }

    const module = await this.moduleModel
      .findOne({ courseId: new Types.ObjectId(courseId), title })
      .lean()
      .exec();
    this.logger.debug('Module found in DB:', module);
    if (module) await this.cacheManager.set(cacheKey, module, 3600); // Кэшируем на 1 час
    return module;
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

    await this.cacheManager.del(`module:${moduleId}`); // Очищаем кэш модуля
    await this.cacheManager.del(`course:${courseId}`); // Очищаем кэш курса

    return savedLesson;
  }

  async findLessonById(lessonId: string): Promise<Lesson | null> {
    return this.lessonModel.findById(lessonId).lean().exec();
  }

  async findCourseByLesson(lessonId: string): Promise<Course | null> {
    const cacheKey = `course:lesson:${lessonId}`;
    const cachedCourse = await this.cacheManager.get<Course>(cacheKey);
    if (cachedCourse) {
      this.logger.debug('Course found in cache for lesson:', cachedCourse);
      return cachedCourse;
    }

    const objectId = new Types.ObjectId(lessonId);
    this.logger.debug(`Searching module for lessonId: ${lessonId}`);

    // Найти модуль, содержащий урок
    const module = await this.moduleModel
      .findOne({ lessons: objectId })
      .lean()
      .exec();
    if (!module) {
      this.logger.error(`No module found for lessonId: ${lessonId}`);
      return null;
    }
    this.logger.debug(`Module found for lesson: ${JSON.stringify(module)}`);

    // Найти курс, содержащий этот модуль
    const course = await this.courseModel
      .findOne({ modules: module._id })
      .lean()
      .exec();
    if (!course) {
      this.logger.error(`No course found for moduleId: ${module._id}`);
      return null;
    }
    this.logger.debug(`Course found for module: ${JSON.stringify(course)}`);

    await this.cacheManager.set(cacheKey, course, 3600); // Кэшируем на 1 час
    return course;
  }

  async getCourseStatistics(courseId: string): Promise<any> {
    const cacheKey = `course:stats:${courseId}`;
    const cachedStats = await this.cacheManager.get<any>(cacheKey);
    if (cachedStats) {
      this.logger.debug('Course statistics found in cache:', cachedStats);
      return cachedStats;
    }

    const course = (await this.courseModel
      .findById(courseId)
      .lean()) as CourseDocument;
    if (!course) throw new Error('Course not found');

    const totalModules = course.modules.length || 0;
    const totalLessons = await this.moduleModel
      .aggregate([
        {
          $match: {
            _id: { $in: course.modules.map((id) => new Types.ObjectId(id)) },
          },
        },
        { $unwind: '$lessons' },
        { $group: { _id: null, total: { $sum: 1 } } },
      ])
      .exec();

    const stats = {
      courseId: course._id.toString(),
      courseTitle: course.title,
      totalModules,
      totalLessons: totalLessons.length > 0 ? totalLessons[0].total : 0,
    };

    await this.cacheManager.set(cacheKey, stats, 3600); // Кэшируем на 1 час
    this.logger.debug('Calculated course statistics:', stats);
    return stats;
  }

  async getCourseStructure(courseId: string): Promise<any> {
    const cacheKey = `course:structure:${courseId}`;
    const cachedStructure = await this.cacheManager.get<any>(cacheKey);
    if (cachedStructure) {
      this.logger.debug('Course structure found in cache:', cachedStructure);
      return cachedStructure;
    }

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) throw new Error('Course not found');

    const modules = await this.moduleModel
      .find({
        _id: { $in: course.modules.map((id) => new Types.ObjectId(id)) },
      })
      .lean()
      .exec();
    const lessons = await this.lessonModel
      .find({
        _id: {
          $in: modules.flatMap((m) =>
            m.lessons.map((id) => new Types.ObjectId(id)),
          ),
        },
      })
      .lean()
      .exec();

    const structure = {
      courseId: course._id,
      title: course.title,
      modules: modules.map((module) => ({
        moduleId: module._id,
        title: module.title,
        lessons: lessons
          .filter((lesson) =>
            module.lessons.some((l) => l.toString() === lesson._id.toString()),
          )
          .map((lesson) => ({
            lessonId: lesson._id,
            title: lesson.title,
            content: lesson.content,
          })),
      })),
    };

    await this.cacheManager.set(cacheKey, structure, 3600); // Кэшируем на 1 час
    this.logger.debug('Course structure calculated:', structure);
    return structure;
  }

  async getTotalLessonsForCourse(courseId: string): Promise<number> {
    const cacheKey = `course:total-lessons:${courseId}`;
    const cachedTotal = await this.cacheManager.get<number>(cacheKey);
    if (cachedTotal !== undefined && cachedTotal !== null) {
      // Проверяем на undefined и null
      this.logger.debug(
        'Total lessons found in cache for course:',
        cachedTotal,
      );
      return cachedTotal; // Гарантируем, что возвращается number
    }

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) throw new Error('Course not found');

    const totalLessons = await this.moduleModel
      .aggregate([
        {
          $match: {
            _id: { $in: course.modules.map((id) => new Types.ObjectId(id)) },
          },
        },
        { $unwind: '$lessons' },
        { $group: { _id: null, total: { $sum: 1 } } },
      ])
      .exec();

    const total = totalLessons.length > 0 ? totalLessons[0].total : 0;
    await this.cacheManager.set(cacheKey, total, 3600); // Кэшируем на 1 час
    this.logger.debug('Calculated total lessons for course:', total);
    return total;
  }

  async updateLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    updateLessonDto: CreateLessonDto,
  ): Promise<Lesson | null> {
    const lesson = await this.lessonModel
      .findByIdAndUpdate(lessonId, updateLessonDto, { new: true })
      .lean()
      .exec();
    await this.cacheManager.del(`module:${moduleId}`);
    await this.cacheManager.del(`course:${courseId}`);
    return lesson;
  }

  async deleteLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void> {
    await this.lessonModel.findByIdAndDelete(lessonId).exec();
    await this.cacheManager.del(`module:${moduleId}`);
    await this.cacheManager.del(`course:${courseId}`);
  }

  // Аналитика
  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const cacheKey = `course:analytics:${courseId}`;
    const cachedAnalytics =
      await this.cacheManager.get<CourseAnalytics>(cacheKey);
    if (cachedAnalytics) {
      console.log('Analytics found in cache:', cachedAnalytics);
      return cachedAnalytics;
    }

    // Подсчёт общего количества модулей и уроков в курсе
    const course = await this.courseModel.findById(courseId).lean().exec();
    const totalModules = course?.modules?.length || 0;
    const totalLessons = await this.lessonModel.countDocuments({
      moduleId: { $in: course?.modules || [] },
    });

    // Агрегация данных из enrollments
    const analytics = await this.courseModel.db
      .collection('enrollments')
      .aggregate<CourseAnalytics>([
        { $match: { courseId: new Types.ObjectId(courseId) } },
        {
          $group: {
            _id: '$courseId',
            totalStudents: { $sum: 1 },
            completedStudents: { $sum: { $cond: ['$isCompleted', 1, 0] } },
            averageGrade: { $avg: '$grade' },
            completedModulesCount: { $sum: { $size: '$completedModules' } },
            completedLessonsCount: { $sum: { $size: '$completedLessons' } },
          },
        },
        {
          $project: {
            totalStudents: 1,
            completedStudents: 1,
            averageGrade: { $ifNull: ['$averageGrade', 0] },
            completionRate: {
              $multiply: [
                { $divide: ['$completedStudents', '$totalStudents'] },
                100,
              ],
            },
            moduleCompletion: {
              totalModules: { $literal: totalModules },
              completedModules: '$completedModulesCount',
              completionRate: {
                $cond: [
                  { $eq: [totalModules, 0] },
                  0,
                  {
                    $multiply: [
                      {
                        $divide: [
                          '$completedModulesCount',
                          { $multiply: ['$totalStudents', totalModules] },
                        ],
                      },
                      100,
                    ],
                  },
                ],
              },
            },
            lessonCompletion: {
              totalLessons: { $literal: totalLessons },
              completedLessons: '$completedLessonsCount',
              completionRate: {
                $cond: [
                  { $eq: [totalLessons, 0] },
                  0,
                  {
                    $multiply: [
                      {
                        $divide: [
                          '$completedLessonsCount',
                          { $multiply: ['$totalStudents', totalLessons] },
                        ],
                      },
                      100,
                    ],
                  },
                ],
              },
            },
          },
        },
      ])
      .toArray();

    const result: CourseAnalytics = analytics[0] || {
      totalStudents: 0,
      completedStudents: 0,
      completionRate: 0,
      averageGrade: 0,
      moduleCompletion: {
        totalModules,
        completedModules: 0,
        completionRate: 0,
      },
      lessonCompletion: {
        totalLessons,
        completedLessons: 0,
        completionRate: 0,
      },
    };
    console.log('Analytics calculated:', result);
    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async exportCourseAnalyticsToCSV(courseId: string): Promise<string> {
    const analytics = await this.getCourseAnalytics(courseId);
    const filePath = `course_${courseId}_analytics_${Date.now()}.csv`;
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'metric', title: 'Metric' },
        { id: 'value', title: 'Value' },
      ],
    });

    const records = [
      { metric: 'Total Students', value: analytics.totalStudents },
      { metric: 'Completed Students', value: analytics.completedStudents },
      {
        metric: 'Completion Rate (%)',
        value: analytics.completionRate.toFixed(2),
      },
      { metric: 'Average Grade', value: analytics.averageGrade.toFixed(2) },
      {
        metric: 'Total Modules',
        value: analytics.moduleCompletion.totalModules,
      },
      {
        metric: 'Completed Modules',
        value: analytics.moduleCompletion.completedModules,
      },
      {
        metric: 'Module Completion Rate (%)',
        value: analytics.moduleCompletion.completionRate.toFixed(2),
      },
      {
        metric: 'Total Lessons',
        value: analytics.lessonCompletion.totalLessons,
      },
      {
        metric: 'Completed Lessons',
        value: analytics.lessonCompletion.completedLessons,
      },
      {
        metric: 'Lesson Completion Rate (%)',
        value: analytics.lessonCompletion.completionRate.toFixed(2),
      },
    ];

    await csvWriter.writeRecords(records);
    return filePath; // Возвращаем путь напрямую
  }
}
