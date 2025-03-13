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
import { User } from '../users/schemas/user.schema';
import { Tariff, TariffDocument } from '../tariffs/schemas/tariff.schema';
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

// Константы для TTL кэша и срока хранения CSV файлов
const CACHE_TTL = parseInt(process.env.CACHE_TTL ?? '3600', 10); // 1 час по умолчанию
const CSV_EXPIRY_DAYS = parseInt(process.env.CSV_EXPIRY_DAYS ?? '90', 10); // 90 дней по умолчанию

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

  // Создание нового курса
  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    this.logger.log(`Создание курса: ${createCourseDto.title}`);
    const newCourse = new this.courseModel(createCourseDto);
    return newCourse.save();
  }

  // Пакетное создание курсов с обработкой ошибок
  async createBatchCourses(batchCourseDto: BatchCourseDto): Promise<Course[]> {
    this.logger.debug('Пакетное создание курсов:', batchCourseDto);
    const courses: Course[] = [];
    const errors: string[] = [];

    for (const courseData of batchCourseDto.courses) {
      try {
        const course = await this.createCourse({
          title: courseData.title,
          description: courseData.description,
        });
        courses.push(course);
      } catch (error) {
        const errorMsg = `Не удалось создать курс ${courseData.title}: ${error.message}`;
        this.logger.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    if (errors.length > 0) {
      this.logger.warn(
        `Создано ${courses.length} курсов, ошибок: ${errors.length}`,
      );
    }
    return courses;
  }

  // Получение всех курсов с кэшированием и пагинацией
  async findAllCourses(
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ courses: Course[]; total: number }> {
    const cacheKey = `courses:all:skip:${skip}:limit:${limit}`;
    const cachedResult = await this.cacheManager.get<{
      courses: Course[];
      total: number;
    }>(cacheKey);
    if (cachedResult) {
      this.logger.debug(
        `Курсы найдены в кэше: ${cachedResult.courses.length} из ${cachedResult.total}`,
      );
      return cachedResult;
    }

    const [courses, total] = await Promise.all([
      this.courseModel.find().skip(skip).limit(limit).lean().exec(),
      this.courseModel.countDocuments().exec(),
    ]);

    this.logger.debug(`Курсы найдены в БД: ${courses.length} из ${total}`);
    const result = { courses, total };
    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  // Поиск курса по ID с выбросом исключения, если не найден
  async findCourseById(id: string): Promise<Course> {
    const cacheKey = `course:${id}`;
    const cachedCourse = await this.cacheManager.get<Course>(cacheKey);
    if (cachedCourse) {
      this.logger.debug('Курс найден в кэше:', cachedCourse.title);
      return cachedCourse;
    }

    const course = await this.courseModel.findById(id).lean().exec();
    if (!course) {
      throw new NotFoundException(`Курс с ID ${id} не найден`);
    }
    this.logger.debug('Курс найден в БД:', course.title);
    await this.cacheManager.set(cacheKey, course, CACHE_TTL);
    return course;
  }

  // Обновление курса с очисткой кэша
  async updateCourse(
    courseId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course> {
    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(courseId, updateCourseDto, { new: true })
      .exec();
    if (!updatedCourse) {
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    }
    await this.cacheManager.del(`course:${courseId}`);
    await this.cacheManager.del('courses:all');
    this.logger.log(`Курс ${courseId} обновлен`);
    return updatedCourse;
  }

  // Удаление курса
  async deleteCourse(courseId: string): Promise<void> {
    const result = await this.courseModel.findByIdAndDelete(courseId).exec();
    if (!result) {
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    }
    await this.cacheManager.del(`course:${courseId}`);
    await this.cacheManager.del('courses:all');
    this.logger.log(`Курс ${courseId} удален`);
  }

  // Создание модуля для курса
  async createModule(
    courseId: string,
    createModuleDto: CreateModuleDto,
  ): Promise<Module> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    }

    const newModule = new this.moduleModel({
      ...createModuleDto,
      courseId: course._id,
    });
    const savedModule = await newModule.save();

    course.modules.push(savedModule._id);
    await course.save();

    await this.cacheManager.del(`course:${courseId}`);
    await this.cacheManager.del('courses:all');
    this.logger.log(`Модуль ${savedModule.title} добавлен в курс ${courseId}`);
    return savedModule;
  }

  // Поиск модуля по ID
  async findModuleById(moduleId: string): Promise<Module> {
    const module = await this.moduleModel.findById(moduleId).lean().exec();
    if (!module) {
      throw new NotFoundException(`Модуль с ID ${moduleId} не найден`);
    }
    return module;
  }

  // Поиск модуля по курсу и заголовку
  async findModuleByCourseAndTitle(
    courseId: string,
    title: string,
  ): Promise<Module | null> {
    const cacheKey = `module:course:${courseId}:title:${title}`;
    const cachedModule = await this.cacheManager.get<Module>(cacheKey);
    if (cachedModule) {
      this.logger.debug('Модуль найден в кэше:', cachedModule.title);
      return cachedModule;
    }

    const module = await this.moduleModel
      .findOne({ courseId: new Types.ObjectId(courseId), title })
      .lean()
      .exec();
    if (module) {
      await this.cacheManager.set(cacheKey, module, CACHE_TTL);
      this.logger.debug('Модуль найден в БД:', module.title);
    }
    return module;
  }

  // Создание урока в модуле
  async createLesson(
    courseId: string,
    moduleId: string,
    createLessonDto: CreateLessonDto,
  ): Promise<Lesson> {
    const module = await this.moduleModel.findById(moduleId).exec();
    if (!module) {
      throw new NotFoundException(`Модуль с ID ${moduleId} не найден`);
    }

    const newLesson = new this.lessonModel({
      ...createLessonDto,
      moduleId: module._id,
    });
    const savedLesson = await newLesson.save();

    module.lessons.push(savedLesson._id);
    await module.save();

    await this.cacheManager.del(`module:${moduleId}`);
    await this.cacheManager.del(`course:${courseId}`);
    this.logger.log(`Урок ${savedLesson.title} добавлен в модуль ${moduleId}`);
    return savedLesson;
  }

  // Поиск урока по ID
  async findLessonById(lessonId: string): Promise<Lesson> {
    const lesson = await this.lessonModel.findById(lessonId).lean().exec();
    if (!lesson) {
      throw new NotFoundException(`Урок с ID ${lessonId} не найден`);
    }
    return lesson;
  }

  // Поиск курса по уроку
  async findCourseByLesson(lessonId: string): Promise<Course | null> {
    const cacheKey = `course:lesson:${lessonId}`;
    const cachedCourse = await this.cacheManager.get<Course>(cacheKey);
    if (cachedCourse) {
      this.logger.debug('Курс найден в кэше для урока:', cachedCourse.title);
      return cachedCourse;
    }

    const module = await this.moduleModel
      .findOne({ lessons: new Types.ObjectId(lessonId) })
      .lean()
      .exec();
    if (!module) {
      this.logger.warn(`Модуль для урока ${lessonId} не найден`);
      return null;
    }

    const course = await this.courseModel
      .findOne({ modules: module._id })
      .lean()
      .exec();
    if (!course) {
      this.logger.warn(`Курс для модуля ${module._id} не найден`);
      return null;
    }

    await this.cacheManager.set(cacheKey, course, CACHE_TTL);
    this.logger.debug('Курс найден для урока:', course.title);
    return course;
  }

  // Получение статистики курса
  async getCourseStatistics(courseId: string): Promise<any> {
    const cacheKey = `course:stats:${courseId}`;
    const cachedStats = await this.cacheManager.get<any>(cacheKey);
    if (cachedStats) {
      this.logger.debug('Статистика курса найдена в кэше:', cachedStats);
      return cachedStats;
    }

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) {
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    }

    const totalLessons = await this.moduleModel
      .aggregate([
        { $match: { _id: { $in: course.modules } } },
        { $unwind: '$lessons' },
        { $group: { _id: null, total: { $sum: 1 } } },
      ])
      .exec();

    const stats = {
      courseId: course._id.toString(),
      courseTitle: course.title,
      totalModules: course.modules.length,
      totalLessons: totalLessons.length > 0 ? totalLessons[0].total : 0,
    };

    await this.cacheManager.set(cacheKey, stats, CACHE_TTL);
    this.logger.debug('Статистика курса рассчитана:', stats);
    return stats;
  }

  // Получение структуры курса
  async getCourseStructure(courseId: string): Promise<any> {
    const cacheKey = `course:structure:${courseId}`;
    const cachedStructure = await this.cacheManager.get<any>(cacheKey);
    if (cachedStructure) {
      this.logger.debug('Структура курса найдена в кэше:', cachedStructure);
      return cachedStructure;
    }

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) {
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    }

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
          .filter((lesson) => module.lessons.some((l) => l.equals(lesson._id)))
          .map((lesson) => ({
            lessonId: lesson._id,
            title: lesson.title,
            content: lesson.content,
          })),
      })),
    };

    await this.cacheManager.set(cacheKey, structure, CACHE_TTL);
    this.logger.debug('Структура курса рассчитана:', structure);
    return structure;
  }

  // Получение структуры курса для студента с учетом тарифа
  async getStudentCourseStructure(
    studentId: string,
    courseId: string,
  ): Promise<any> {
    const cacheKey = `course:student-structure:${courseId}:student:${studentId}`;
    const cachedStructure = await this.cacheManager.get<any>(cacheKey);
    if (cachedStructure) {
      this.logger.debug('Структура курса для студента найдена в кэше');
      return cachedStructure;
    }

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) {
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    }

    const enrollment = await this.enrollmentsService.findOneByStudentAndCourse(
      studentId,
      courseId,
    );
    if (!enrollment) {
      throw new BadRequestException('Запись о зачислении не найдена');
    }

    const tariff = enrollment.tariffId as TariffDocument | undefined;
    const modules = await this.moduleModel
      .find({ _id: { $in: course.modules } })
      .lean()
      .exec();
    const lessons = await this.lessonModel
      .find({ _id: { $in: modules.flatMap((m) => m.lessons) } })
      .lean()
      .exec();

    let accessibleModules = modules;
    if (tariff && tariff.accessibleModules.length > 0) {
      accessibleModules = modules.filter((module) =>
        tariff.accessibleModules.some((m) => m.equals(module._id)),
      );
    }

    const structure = {
      courseId: course._id,
      title: course.title,
      modules: accessibleModules.map((module) => ({
        moduleId: module._id,
        title: module.title,
        lessons: lessons
          .filter((lesson) => module.lessons.some((l) => l.equals(lesson._id)))
          .map((lesson) => ({
            lessonId: lesson._id,
            title: lesson.title,
            content: lesson.content,
          })),
      })),
    };

    await this.cacheManager.set(cacheKey, structure, CACHE_TTL);
    this.logger.debug('Структура курса для студента рассчитана');
    return structure;
  }

  // Получение общего количества уроков в курсе
  async getTotalLessonsForCourse(courseId: string): Promise<number> {
    const cacheKey = `course:total-lessons:${courseId}`;
    const cachedTotal = await this.cacheManager.get<number>(cacheKey);
    if (cachedTotal !== undefined && cachedTotal !== null) {
      this.logger.debug('Общее количество уроков найдено в кэше:', cachedTotal);
      return cachedTotal;
    }

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) {
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    }

    const totalLessons = await this.moduleModel
      .aggregate([
        { $match: { _id: { $in: course.modules } } },
        { $unwind: '$lessons' },
        { $group: { _id: null, total: { $sum: 1 } } },
      ])
      .exec();

    const total = totalLessons.length > 0 ? totalLessons[0].total : 0;
    await this.cacheManager.set(cacheKey, total, CACHE_TTL);
    this.logger.debug('Общее количество уроков рассчитано:', total);
    return total;
  }

  // Обновление урока
  async updateLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    updateLessonDto: CreateLessonDto,
  ): Promise<Lesson> {
    const lesson = await this.lessonModel
      .findByIdAndUpdate(lessonId, updateLessonDto, { new: true })
      .lean()
      .exec();
    if (!lesson) {
      throw new NotFoundException(`Урок с ID ${lessonId} не найден`);
    }
    await this.cacheManager.del(`module:${moduleId}`);
    await this.cacheManager.del(`course:${courseId}`);
    await this.cacheManager.del('courses:all'); // Добавлено для консистентности
    this.logger.log(`Урок ${lessonId} обновлен`);
    return lesson;
  }

  // Удаление урока
  async deleteLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void> {
    const result = await this.lessonModel.findByIdAndDelete(lessonId).exec();
    if (!result) {
      throw new NotFoundException(`Урок с ID ${lessonId} не найден`);
    }
    await this.cacheManager.del(`module:${moduleId}`);
    await this.cacheManager.del(`course:${courseId}`);
    await this.cacheManager.del('courses:all');
    this.logger.log(`Урок ${lessonId} удален`);
  }

  // Получение аналитики курса
  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const cacheKey = `course:analytics:${courseId}`;
    const cachedAnalytics =
      await this.cacheManager.get<CourseAnalytics>(cacheKey);
    if (cachedAnalytics) {
      this.logger.debug('Аналитика найдена в кэше:', cachedAnalytics);
      return cachedAnalytics;
    }

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) {
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    }

    const totalModules = course.modules.length;
    const totalLessons = await this.lessonModel.countDocuments({
      moduleId: { $in: course.modules },
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
    this.logger.debug('Аналитика рассчитана:', result);
    return result;
  }

  // Экспорт аналитики в CSV
  async exportCourseAnalyticsToCSV(courseId: string): Promise<string> {
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
        metric: 'Процент завершения',
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
        metric: 'Процент завершения модулей',
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
        metric: 'Процент завершения уроков',
        value: analytics.lessonCompletion.completionRate.toFixed(2),
      },
    ];

    await csvWriter.writeRecords(records);
    this.logger.log('CSV файл сохранен:', filePath);
    return filePath;
  }

  // Очистка старых CSV файлов
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
          this.logger.log(`Удален старый CSV файл: ${filePath}`);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error('Ошибка при очистке старых CSV файлов:', error);
      }
    }
  }

  // Получение лидерборда
  async getLeaderboard(
    courseId: string,
    limit: number = 10,
  ): Promise<LeaderboardEntry[]> {
    const cacheKey = `leaderboard:${courseId}:limit:${limit}`;
    const cachedLeaderboard =
      await this.cacheManager.get<LeaderboardEntry[]>(cacheKey);
    if (cachedLeaderboard) {
      this.logger.debug(`Лидерборд из кэша для курса ${courseId}`);
      return cachedLeaderboard;
    }

    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Неверный ID курса');
    }

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) {
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    }

    const enrollments = await this.enrollmentsService.findByCourseId(courseId);
    if (!enrollments.length) {
      this.logger.warn(`Нет записей о зачислении для курса ${courseId}`);
      return [];
    }

    const studentIds = enrollments.map((e) => e.studentId.toString());
    const users = await this.usersService.findManyByIds(studentIds);
    const userMap = new Map<string, User>(
      users.map((u) => [u._id.toString(), u]),
    );
    const totalLessons = await this.getTotalLessonsForCourse(courseId);

    const leaderboard = enrollments.map((enrollment) => {
      const studentId = enrollment.studentId.toString();
      const user = userMap.get(studentId);
      const completedLessons = enrollment.completedLessons.length;
      return {
        studentId,
        name: user?.name ?? 'Неизвестный',
        completionPercentage:
          totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
        points: enrollment.points || 0,
      };
    });

    const sortedLeaderboard = leaderboard
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
    await this.cacheManager.set(cacheKey, sortedLeaderboard, CACHE_TTL);
    this.logger.debug(`Лидерборд рассчитан для курса ${courseId}`);
    return sortedLeaderboard;
  }

  // Получение списка уроков для курса
  async getLessonsForCourse(courseId: string): Promise<string[]> {
    const course = await this.findCourseById(courseId);
    if (!course.modules.length) return [];

    const modules = await Promise.all(
      course.modules.map((moduleId) =>
        this.moduleModel.findById(moduleId).lean().exec(),
      ),
    );
    return modules.reduce((acc, mod) => {
      const lessonIds = (mod?.lessons || []).map((id) => id.toString());
      return [...acc, ...lessonIds];
    }, []);
  }
}
