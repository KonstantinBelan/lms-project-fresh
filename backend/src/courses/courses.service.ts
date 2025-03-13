import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { Module, ModuleDocument } from './schemas/module.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { ICoursesService, CourseAnalytics } from './courses.service.interface';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { BatchCourseDto } from './dto/batch-course.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UsersService } from '../users/users.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { LeaderboardEntry } from './dto/leaderboard-entry.dto';

const CACHE_TTL = parseInt(process.env.CACHE_TTL ?? '3600', 10); // Время жизни кэша в секундах (по умолчанию 1 час)
const CSV_EXPIRY_DAYS = parseInt(process.env.CSV_EXPIRY_DAYS ?? '90', 10); // Срок хранения CSV-файлов в днях

@Injectable()
export class CoursesService implements ICoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Module.name) private moduleModel: Model<ModuleDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private usersService: UsersService,
    private enrollmentsService: EnrollmentsService,
  ) {}

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    if (!createCourseDto.title || !createCourseDto.description) {
      throw new BadRequestException('Название и описание курса обязательны');
    }
    this.logger.log(`Создание курса: ${createCourseDto.title}`);
    const newCourse = new this.courseModel(createCourseDto);
    const savedCourse = await newCourse.save();
    await this.cacheManager.del('courses:all');
    return savedCourse.toObject();
  }

  async createBatchCourses(batchCourseDto: BatchCourseDto): Promise<Course[]> {
    this.logger.log(`Создание ${batchCourseDto.courses.length} курсов`);
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
          `Ошибка при создании курса ${courseData.title}: ${error.message}`,
        );
      }
    }
    return courses;
  }

  async findAllCourses(): Promise<Course[]> {
    this.logger.debug('Получение всех курсов');
    const cacheKey = 'courses:all';
    const cachedCourses = await this.cacheManager.get<Course[]>(cacheKey);
    if (cachedCourses) return cachedCourses;

    const courses = await this.courseModel.find().lean().exec();
    await this.cacheManager.set(cacheKey, courses, CACHE_TTL);
    return courses;
  }

  async findCourseById(courseId: string): Promise<Course | null> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }
    this.logger.debug(`Поиск курса по ID: ${courseId}`);
    const cacheKey = `course:${courseId}`;
    const cachedCourse = await this.cacheManager.get<Course>(cacheKey);
    if (cachedCourse) return cachedCourse;

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (course) await this.cacheManager.set(cacheKey, course, CACHE_TTL);
    return course;
  }

  async updateCourse(
    courseId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course | null> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }
    this.logger.log(`Обновление курса с ID: ${courseId}`);
    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(courseId, updateCourseDto, { new: true })
      .lean()
      .exec();
    if (!updatedCourse)
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    await this.cacheManager.del(`course:${courseId}`);
    await this.cacheManager.del('courses:all');
    return updatedCourse;
  }

  async deleteCourse(courseId: string): Promise<void> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }
    this.logger.log(`Удаление курса с ID: ${courseId}`);
    const result = await this.courseModel.findByIdAndDelete(courseId).exec();
    if (!result) throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    await this.cacheManager.del(`course:${courseId}`);
    await this.cacheManager.del('courses:all');
  }

  async createModule(
    courseId: string,
    createModuleDto: CreateModuleDto,
  ): Promise<Module> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }
    this.logger.log(`Создание модуля для курса ${courseId}`);
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) throw new NotFoundException(`Курс с ID ${courseId} не найден`);

    const newModule = new this.moduleModel(createModuleDto);
    const savedModule = await newModule.save();
    course.modules.push(savedModule._id);
    await course.save();

    await this.cacheManager.del(`course:${courseId}`);
    await this.cacheManager.del('courses:all');
    return savedModule.toObject();
  }

  async findModuleById(moduleId: string): Promise<Module | null> {
    if (!Types.ObjectId.isValid(moduleId)) {
      throw new BadRequestException('Некорректный ID модуля');
    }
    this.logger.debug(`Поиск модуля по ID: ${moduleId}`);
    return this.moduleModel.findById(moduleId).lean().exec();
  }

  async createLesson(
    courseId: string,
    moduleId: string,
    createLessonDto: CreateLessonDto,
  ): Promise<Lesson> {
    if (
      !Types.ObjectId.isValid(courseId) ||
      !Types.ObjectId.isValid(moduleId)
    ) {
      throw new BadRequestException('Некорректный ID курса или модуля');
    }
    this.logger.log(
      `Создание урока для модуля ${moduleId} в курсе ${courseId}`,
    );
    const module = await this.moduleModel.findById(moduleId).exec();
    if (!module)
      throw new NotFoundException(`Модуль с ID ${moduleId} не найден`);

    const newLesson = new this.lessonModel(createLessonDto);
    const savedLesson = await newLesson.save();
    module.lessons.push(savedLesson._id);
    await module.save();

    await this.cacheManager.del(`module:${moduleId}`);
    await this.cacheManager.del(`course:${courseId}`);
    return savedLesson.toObject();
  }

  async findLessonById(lessonId: string): Promise<Lesson | null> {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new BadRequestException('Некорректный ID урока');
    }
    this.logger.debug(`Поиск урока по ID: ${lessonId}`);
    return this.lessonModel.findById(lessonId).lean().exec();
  }

  async updateLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    updateLessonDto: CreateLessonDto,
  ): Promise<Lesson | null> {
    if (
      !Types.ObjectId.isValid(courseId) ||
      !Types.ObjectId.isValid(moduleId) ||
      !Types.ObjectId.isValid(lessonId)
    ) {
      throw new BadRequestException('Некорректный ID курса, модуля или урока');
    }
    this.logger.log(
      `Обновление урока ${lessonId} в модуле ${moduleId} курса ${courseId}`,
    );
    const updatedLesson = await this.lessonModel
      .findByIdAndUpdate(lessonId, updateLessonDto, { new: true })
      .lean()
      .exec();
    if (!updatedLesson)
      throw new NotFoundException(`Урок с ID ${lessonId} не найден`);
    await this.cacheManager.del(`module:${moduleId}`);
    await this.cacheManager.del(`course:${courseId}`);
    return updatedLesson;
  }

  async deleteLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void> {
    if (
      !Types.ObjectId.isValid(courseId) ||
      !Types.ObjectId.isValid(moduleId) ||
      !Types.ObjectId.isValid(lessonId)
    ) {
      throw new BadRequestException('Некорректный ID курса, модуля или урока');
    }
    this.logger.log(
      `Удаление урока ${lessonId} из модуля ${moduleId} курса ${courseId}`,
    );
    const result = await this.lessonModel.findByIdAndDelete(lessonId).exec();
    if (!result) throw new NotFoundException(`Урок с ID ${lessonId} не найден`);
    await this.moduleModel
      .updateOne({ _id: moduleId }, { $pull: { lessons: lessonId } })
      .exec();
    await this.cacheManager.del(`module:${moduleId}`);
    await this.cacheManager.del(`course:${courseId}`);
  }

  async getCourseStatistics(courseId: string): Promise<any> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }
    this.logger.debug(`Получение статистики курса ${courseId}`);
    const cacheKey = `course:stats:${courseId}`;
    const cachedStats = await this.cacheManager.get<any>(cacheKey);
    if (cachedStats) return cachedStats;

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) throw new NotFoundException(`Курс с ID ${courseId} не найден`);

    const totalModules = course.modules.length || 0;
    const modules = await this.moduleModel
      .find({ _id: { $in: course.modules } })
      .lean()
      .exec();
    const totalLessons = modules.reduce(
      (sum, module) => sum + (module.lessons?.length || 0),
      0,
    );

    const stats = {
      courseId: course._id.toString(),
      courseTitle: course.title,
      totalModules,
      totalLessons,
    };

    await this.cacheManager.set(cacheKey, stats, CACHE_TTL);
    return stats;
  }

  async getCourseStructure(courseId: string): Promise<any> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }
    this.logger.debug(`Получение структуры курса ${courseId}`);
    const cacheKey = `course:structure:${courseId}`;
    const cachedStructure = await this.cacheManager.get<any>(cacheKey);
    if (cachedStructure) return cachedStructure;

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) throw new NotFoundException(`Курс с ID ${courseId} не найден`);

    const modules = await this.moduleModel
      .find({ _id: { $in: course.modules } })
      .lean()
      .exec();
    const lessons = await this.lessonModel
      .find({ _id: { $in: modules.flatMap((m) => m.lessons) } })
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

    await this.cacheManager.set(cacheKey, structure, CACHE_TTL);
    return structure;
  }

  async getStudentCourseStructure(
    studentId: string,
    courseId: string,
  ): Promise<any> {
    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId)
    ) {
      throw new BadRequestException('Некорректный ID студента или курса');
    }
    this.logger.debug(
      `Получение структуры курса ${courseId} для студента ${studentId}`,
    );
    const cacheKey = `course:student-structure:${courseId}:student:${studentId}`;
    const cachedStructure = await this.cacheManager.get<any>(cacheKey);
    if (cachedStructure) return cachedStructure;

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) throw new NotFoundException(`Курс с ID ${courseId} не найден`);

    const enrollment = await this.enrollmentsService.findOneByStudentAndCourse(
      studentId,
      courseId,
    );
    if (!enrollment)
      throw new NotFoundException('Запись о зачислении не найдена');

    const modules = await this.moduleModel
      .find({ _id: { $in: course.modules } })
      .lean()
      .exec();
    const lessons = await this.lessonModel
      .find({ _id: { $in: modules.flatMap((m) => m.lessons) } })
      .lean()
      .exec();

    const tariff = enrollment.tariffId;
    let accessibleModules = modules;
    if (tariff && tariff.accessibleModules?.length > 0) {
      accessibleModules = modules.filter((module) =>
        tariff.accessibleModules.some(
          (m) => m.toString() === module._id.toString(),
        ),
      );
    }

    const structure = {
      courseId: course._id,
      title: course.title,
      modules: accessibleModules.map((module) => ({
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

    await this.cacheManager.set(cacheKey, structure, CACHE_TTL);
    return structure;
  }

  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }
    this.logger.debug(`Получение аналитики курса ${courseId}`);
    const cacheKey = `course:analytics:${courseId}`;
    const cachedAnalytics =
      await this.cacheManager.get<CourseAnalytics>(cacheKey);
    if (cachedAnalytics) return cachedAnalytics;

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) throw new NotFoundException(`Курс с ID ${courseId} не найден`);

    const totalModules = course.modules?.length || 0;
    const totalLessons = await this.lessonModel.countDocuments({
      moduleId: { $in: course.modules || [] },
    });

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

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async exportCourseAnalyticsToCSV(courseId: string): Promise<string> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }
    this.logger.log(`Экспорт аналитики курса ${courseId} в CSV`);
    const analytics = await this.getCourseAnalytics(courseId);
    const dirPath = `analytics/course_${courseId}`;
    const filePath = `${dirPath}/course_${courseId}_analytics_${Date.now()}.csv`;

    await fs.mkdir(dirPath, { recursive: true });
    await this.cleanOldCSVFiles(dirPath);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'metric', title: 'Метрика' },
        { id: 'value', title: 'Значение' },
      ],
    });

    const records = [
      { metric: 'Всего студентов', value: analytics.totalStudents },
      { metric: 'Завершивших студентов', value: analytics.completedStudents },
      {
        metric: 'Процент завершения (%)',
        value: analytics.completionRate.toFixed(2),
      },
      { metric: 'Средняя оценка', value: analytics.averageGrade.toFixed(2) },
      {
        metric: 'Всего модулей',
        value: analytics.moduleCompletion.totalModules,
      },
      {
        metric: 'Завершенных модулей',
        value: analytics.moduleCompletion.completedModules,
      },
      {
        metric: 'Процент завершения модулей (%)',
        value: analytics.moduleCompletion.completionRate.toFixed(2),
      },
      {
        metric: 'Всего уроков',
        value: analytics.lessonCompletion.totalLessons,
      },
      {
        metric: 'Завершенных уроков',
        value: analytics.lessonCompletion.completedLessons,
      },
      {
        metric: 'Процент завершения уроков (%)',
        value: analytics.lessonCompletion.completionRate.toFixed(2),
      },
    ];

    await csvWriter.writeRecords(records);
    return filePath;
  }

  private async cleanOldCSVFiles(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);
      const now = Date.now();
      const expiryMs = CSV_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        if (now - stats.mtimeMs > expiryMs) {
          await fs.unlink(filePath);
          this.logger.debug(`Удален старый CSV-файл: ${filePath}`);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error(
          `Ошибка при очистке старых CSV-файлов: ${error.message}`,
        );
      }
    }
  }

  async getLeaderboard(
    courseId: string,
    limit: number = 10,
  ): Promise<LeaderboardEntry[]> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }
    this.logger.debug(
      `Получение таблицы лидеров для курса ${courseId} с лимитом ${limit}`,
    );
    const cacheKey = `leaderboard:${courseId}:limit:${limit}`;
    const cachedLeaderboard =
      await this.cacheManager.get<LeaderboardEntry[]>(cacheKey);
    if (cachedLeaderboard) return cachedLeaderboard;

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) throw new NotFoundException(`Курс с ID ${courseId} не найден`);

    const enrollments = await this.enrollmentsService.findByCourseId(courseId);
    if (!enrollments.length) return [];

    const studentIds = enrollments.map((e) => e.studentId.toString());
    const users = await this.usersService.findManyByIds(studentIds);
    const userMap = new Map<string, any>(
      users.map((u) => [u._id.toString(), u]),
    );

    const totalLessons = await this.getTotalLessonsForCourse(courseId);

    const leaderboard = enrollments.map((enrollment) => {
      const studentId = enrollment.studentId.toString();
      const user = userMap.get(studentId);
      const completedLessons = enrollment.completedLessons.length;
      return {
        studentId,
        name: user?.name ?? 'Неизвестно',
        completionPercentage:
          totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
        points: enrollment.points || 0,
      };
    });

    const sortedLeaderboard = leaderboard
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
    await this.cacheManager.set(cacheKey, sortedLeaderboard, CACHE_TTL);
    return sortedLeaderboard;
  }

  async getTotalLessonsForCourse(courseId: string): Promise<number> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }
    const cacheKey = `course:total-lessons:${courseId}`;
    const cachedTotal = await this.cacheManager.get<number>(cacheKey);
    if (cachedTotal !== undefined) return cachedTotal;

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) throw new NotFoundException(`Курс с ID ${courseId} не найден`);

    const modules = await this.moduleModel
      .find({ _id: { $in: course.modules } })
      .lean()
      .exec();
    const total = modules.reduce(
      (sum, module) => sum + (module.lessons?.length || 0),
      0,
    );

    await this.cacheManager.set(cacheKey, total, CACHE_TTL);
    return total;
  }
}
