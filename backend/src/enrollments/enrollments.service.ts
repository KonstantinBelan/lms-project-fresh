import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { IEnrollmentsService } from './enrollments.service.interface';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AlreadyEnrolledException } from './exceptions/already-enrolled.exception';
import { BatchEnrollmentDto } from './dto/batch-enrollment.dto';
import { stringify } from 'csv-stringify/sync';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class EnrollmentsService implements IEnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    private usersService: UsersService,
    private coursesService: CoursesService,
    private notificationsService: NotificationsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.debug(
      'EnrollmentsService initialized, notificationsService:',
      this.notificationsService,
    );
  }

  async createEnrollment(
    studentId: string,
    courseId: string,
    deadline?: Date,
    skipNotifications = false,
  ): Promise<EnrollmentDocument> {
    this.logger.debug(
      'Creating enrollment for studentId:',
      studentId,
      'courseId:',
      courseId,
      'deadline:',
      deadline,
    );
    const student = await this.usersService.findById(studentId);
    const course = await this.coursesService.findCourseById(courseId);

    if (!student || !course) {
      throw new Error('Student or course not found');
    }

    const existingEnrollment = await this.enrollmentModel
      .findOne({ studentId, courseId })
      .lean()
      .exec();
    if (existingEnrollment) {
      throw new AlreadyEnrolledException();
    }

    const newEnrollment = new this.enrollmentModel({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      deadline,
      completedModules: [],
      completedLessons: [],
      isCompleted: false,
    });
    const savedEnrollment: EnrollmentDocument = await newEnrollment.save();

    if (!skipNotifications) {
      await this.notificationsService.notifyNewCourse(
        studentId,
        courseId,
        course.title,
      );
    }

    await this.cacheManager.del(`enrollment:${savedEnrollment._id.toString()}`);
    await this.cacheManager.del(`enrollments:student:${studentId}`);
    await this.cacheManager.del(`enrollments:course:${courseId}`);

    if (deadline) {
      const daysLeft = Math.ceil(
        (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysLeft <= 7 && daysLeft > 0) {
        await this.notificationsService.notifyDeadline(
          savedEnrollment._id.toString(),
          daysLeft,
          course.title,
        );
      }
    }

    return savedEnrollment;
  }

  async createBatchEnrollments(
    batchEnrollmentDto: BatchEnrollmentDto,
  ): Promise<EnrollmentDocument[]> {
    this.logger.debug(
      'Creating batch enrollments:',
      JSON.stringify(batchEnrollmentDto, null, 2),
    );
    const { studentIds, courseIds, deadlines } = batchEnrollmentDto;

    if (studentIds.length !== courseIds.length) {
      throw new Error('Number of studentIds must match number of courseIds');
    }

    const enrollments: EnrollmentDocument[] = [];

    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const courseId = courseIds[i];
      const deadlineStr: string | undefined = deadlines?.[i];
      let deadline: Date | undefined;

      this.logger.debug('Processing deadline:', {
        index: i,
        deadlineStr,
        type: typeof deadlineStr,
      });

      if (deadlineStr) {
        try {
          deadline = new Date(deadlineStr);
          if (isNaN(deadline.getTime())) {
            this.logger.warn(
              `Invalid date format for deadline ${deadlineStr} at index ${i}, skipping...`,
            );
            deadline = undefined;
          }
        } catch (error) {
          this.logger.error(
            `Failed to parse deadline ${deadlineStr} at index ${i}:`,
            error,
          );
          deadline = undefined;
        }
      }

      try {
        const enrollment = await this.createEnrollment(
          studentId,
          courseId,
          deadline,
        );
        enrollments.push(enrollment);
      } catch (error) {
        this.logger.error(
          `Failed to create enrollment for student ${studentId} and course ${courseId}:`,
          error,
        );
      }
    }

    return enrollments;
  }

  async findEnrollmentsByStudent(
    studentId: string,
  ): Promise<EnrollmentDocument[]> {
    const cacheKey = `enrollments:student:${studentId}`;
    const cachedEnrollments =
      await this.cacheManager.get<EnrollmentDocument[]>(cacheKey);
    if (cachedEnrollments) {
      this.logger.debug(
        'Enrollments found in cache for student:',
        cachedEnrollments,
      );
      return cachedEnrollments;
    }

    const objectId = new Types.ObjectId(studentId);
    const enrollments = await this.enrollmentModel
      .find({ studentId: objectId })
      .lean()
      .exec();
    this.logger.debug('Enrollments found in DB for student:', enrollments);
    if (enrollments.length > 0)
      await this.cacheManager.set(cacheKey, enrollments, 3600); // Кэшируем на 1 час
    return enrollments;
  }

  // async findEnrollmentsByStudent(
  //   studentId: string,
  // ): Promise<EnrollmentDocument[]> {
  //   const objectId = new Types.ObjectId(studentId);
  //   const enrollments = await this.enrollmentModel
  //     .find({ studentId: objectId })
  //     .lean()
  //     .exec();
  //   this.logger.debug('Enrollments found in DB for student:', enrollments);
  //   return enrollments;
  // }

  async findEnrollmentByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentDocument | null> {
    return this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .lean()
      .exec();
  }

  async findEnrollmentsByCourse(
    courseId: string,
  ): Promise<EnrollmentDocument[]> {
    const cacheKey = `enrollments:course:${courseId}`;
    const cachedEnrollments =
      await this.cacheManager.get<EnrollmentDocument[]>(cacheKey);
    if (cachedEnrollments) {
      this.logger.debug(
        'Enrollments found in cache for course:',
        cachedEnrollments,
      );
      return cachedEnrollments;
    }

    const objectId = new Types.ObjectId(courseId);
    const enrollments = await this.enrollmentModel
      .find({ courseId: objectId })
      .lean()
      .exec();
    this.logger.debug('Enrollments found in DB for course:', enrollments);
    if (enrollments.length > 0)
      await this.cacheManager.set(cacheKey, enrollments, 3600); // Кэшируем на 1 час
    return enrollments;
  }

  async findEnrollmentById(
    enrollmentId: string,
  ): Promise<EnrollmentDocument | null> {
    const cacheKey = `enrollment:${enrollmentId}`;
    const cachedEnrollment =
      await this.cacheManager.get<EnrollmentDocument>(cacheKey);
    if (cachedEnrollment) {
      this.logger.debug('Enrollment found in cache:', cachedEnrollment);
      return cachedEnrollment;
    }

    const enrollment = await this.enrollmentModel
      .findById(enrollmentId)
      .lean()
      .exec();
    this.logger.debug('Enrollment found in DB:', enrollment);
    if (enrollment) await this.cacheManager.set(cacheKey, enrollment, 3600); // Кэшируем на 1 час
    return enrollment;
  }

  async updateStudentProgress(
    studentId: string,
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument | null> {
    const cacheKey = `enrollment:student:${studentId}:course:${courseId}`;
    await this.cacheManager.del(cacheKey); // Очищаем кэш для этой записи
    await this.cacheManager.del(`enrollments:student:${studentId}`);
    await this.cacheManager.del(`enrollments:course:${courseId}`);

    const enrollment = await this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .lean()
      .exec();
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const updatedEnrollment = await this.enrollmentModel
      .findByIdAndUpdate(
        enrollment._id,
        {
          $addToSet: {
            completedLessons: new Types.ObjectId(lessonId),
            completedModules: new Types.ObjectId(moduleId),
          },
        },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    this.logger.debug('Updated student progress:', updatedEnrollment);

    // Уведомляем о прогрессе, передаём enrollment._id вместо studentId
    await this.notificationsService.notifyProgress(
      enrollment._id.toString(), // Исправлено: передаём enrollmentId
      moduleId,
      lessonId,
    );

    if (updatedEnrollment?.deadline) {
      const daysLeft = Math.ceil(
        (updatedEnrollment.deadline.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysLeft <= 7 && daysLeft > 0) {
        const course = await this.coursesService.findCourseById(courseId);
        if (course) {
          await this.notificationsService.notifyDeadline(
            updatedEnrollment._id.toString(),
            daysLeft,
            course.title,
          );
        }
      }
    }

    return updatedEnrollment;
  }

  async getStudentProgress(studentId: string, courseId: string): Promise<any> {
    const cacheKey = `progress:student:${studentId}:course:${courseId}`;
    const cachedProgress = await this.cacheManager.get<any>(cacheKey);
    if (cachedProgress) {
      this.logger.debug('Progress found in cache:', cachedProgress);
      return cachedProgress;
    }

    const enrollment = await this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .lean()
      .exec();
    if (!enrollment) throw new Error('Enrollment not found');

    const course = await this.coursesService.findCourseById(courseId);
    if (!course) throw new Error('Course not found');

    const totalModules = course.modules.length || 0;
    const totalLessons =
      await this.coursesService.getTotalLessonsForCourse(courseId);

    const progress = {
      studentId,
      courseId,
      completedModules: enrollment.completedModules.length,
      totalModules,
      completedLessons: enrollment.completedLessons.length,
      totalLessons,
      completionPercentage:
        totalModules > 0
          ? Math.round(
              (enrollment.completedModules.length / totalModules) * 100,
            )
          : 0,
    };

    await this.cacheManager.set(cacheKey, progress, 3600); // Кэшируем на 1 час
    this.logger.debug('Calculated student progress:', progress);
    return progress;
  }

  async getDetailedStudentProgress(studentId: string): Promise<any> {
    const cacheKey = `detailed-progress:student:${studentId}`;
    const cachedProgress = await this.cacheManager.get<any>(cacheKey);
    if (cachedProgress) {
      this.logger.debug(
        'Detailed student progress found in cache:',
        cachedProgress,
      );
      return cachedProgress;
    }

    const enrollments = await this.findEnrollmentsByStudent(studentId);
    const progress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseId = enrollment.courseId.toString();
        const course = await this.coursesService.findCourseById(courseId);

        const totalModules = course?.modules.length || 0;
        const totalLessons =
          await this.coursesService.getTotalLessonsForCourse(courseId);

        return {
          courseId,
          courseTitle: course?.title || 'Unknown',
          completionPercentage:
            totalModules > 0
              ? Math.round(
                  (enrollment.completedModules.length / totalModules) * 100,
                )
              : 0,
          lessonCompletionPercentage:
            totalLessons > 0
              ? Math.round(
                  (enrollment.completedLessons.length / totalLessons) * 100,
                )
              : 0,
          completedModules: enrollment.completedModules.length,
          totalModules,
          completedLessons: enrollment.completedLessons.length,
          totalLessons,
          grade: enrollment.grade,
          isCompleted: enrollment.isCompleted,
          deadline: enrollment.deadline
            ? enrollment.deadline.toISOString()
            : null,
        };
      }),
    );

    const result = {
      studentId,
      progress,
    };
    await this.cacheManager.set(cacheKey, result, 3600); // Кэшируем детальный прогресс на 1 час
    this.logger.debug('Calculated detailed student progress:', result);
    return result;
  }

  async updateProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument | null> {
    const enrollment = await this.findEnrollmentById(enrollmentId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    return this.updateStudentProgress(
      enrollment.studentId.toString(),
      enrollment.courseId.toString(),
      moduleId,
      lessonId,
    );
  }

  async completeCourse(
    enrollmentId: string,
    grade: number,
  ): Promise<EnrollmentDocument | null> {
    if (grade < 0 || grade > 100) {
      throw new Error('Grade must be between 0 and 100');
    }

    const cacheKey = `enrollment:${enrollmentId}`;
    await this.cacheManager.del(cacheKey); // Очищаем кэш для этой записи
    await this.cacheManager.del(`enrollments:student:*`);
    await this.cacheManager.del(`enrollments:course:*`);

    const enrollment = await this.enrollmentModel.findById(enrollmentId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    enrollment.isCompleted = true;
    enrollment.grade = grade;
    const updatedEnrollment: EnrollmentDocument | null =
      await enrollment.save();

    if (!updatedEnrollment) {
      this.logger.warn('Enrollment save returned null, returning null');
      return null;
    }
    this.logger.debug('Enrollment updated successfully:', updatedEnrollment);
    return updatedEnrollment;
  }

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    await this.cacheManager.del(`enrollment:${enrollmentId}`); // Очищаем кэш для этой записи
    await this.cacheManager.del(`enrollments:student:*`);
    await this.cacheManager.del(`enrollments:course:*`);
    await this.enrollmentModel.findByIdAndDelete(enrollmentId).exec();
  }

  async notifyProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void> {
    const enrollment = await this.findEnrollmentById(enrollmentId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    await this.cacheManager.del(`enrollment:${enrollmentId}`); // Очищаем кэш для этой записи
    await this.cacheManager.del(
      `enrollments:student:${enrollment.studentId.toString()}`,
    );
    await this.cacheManager.del(
      `enrollments:course:${enrollment.courseId.toString()}`,
    );

    await this.notificationsService.notifyProgress(
      enrollment.studentId.toString(),
      moduleId,
      lessonId,
    );
  }

  async exportEnrollmentsToCsv(): Promise<string> {
    const cacheKey = 'enrollments:csv';
    const cachedCsv = await this.cacheManager.get<string>(cacheKey);
    if (cachedCsv) {
      this.logger.debug('CSV found in cache:', cachedCsv);
      return cachedCsv;
    }

    this.logger.debug('Exporting enrollments to CSV');
    const enrollments = (await this.enrollmentModel
      .find()
      .lean()
      .exec()) as EnrollmentDocument[];

    const csvData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = await this.usersService.findById(
          enrollment.studentId.toString(),
        );
        const course = await this.coursesService.findCourseById(
          enrollment.courseId.toString(),
        );

        return {
          enrollmentId: enrollment._id.toString(),
          studentId: enrollment.studentId.toString(),
          studentEmail: student?.email || 'Unknown',
          courseId: enrollment.courseId.toString(),
          courseTitle: course?.title || 'Unknown',
          completedModules: enrollment.completedModules.join(','),
          completedLessons: enrollment.completedLessons.join(','),
          isCompleted: enrollment.isCompleted,
          grade: enrollment.grade || 'N/A',
          deadline: enrollment.deadline
            ? enrollment.deadline.toISOString()
            : 'N/A',
        };
      }),
    );

    const csv = stringify(csvData, { header: true });
    await this.cacheManager.set(cacheKey, csv, 3600); // Кэшируем CSV на 1 час
    return csv;
  }
}
