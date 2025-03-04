import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { IEnrollmentsService } from './enrollments.service.interface';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AlreadyEnrolledException } from './exceptions/already-enrolled.exception';
import { BatchEnrollmentDto, DateStringDto } from './dto/batch-enrollment.dto';
import { stringify } from 'csv-stringify/sync';
import { CACHE_MANAGER } from '@nestjs/cache-manager'; // Импортируем CACHE_MANAGER
import { Cache } from 'cache-manager'; // Импортируем Cache

@Injectable()
export class EnrollmentsService implements IEnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    private usersService: UsersService,
    private coursesService: CoursesService,
    private notificationsService: NotificationsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // Инжектируем кэш
  ) {
    console.log(
      'EnrollmentsService initialized, notificationsService:',
      this.notificationsService,
    );
  }

  async createEnrollment(
    studentId: string,
    courseId: string,
    deadline?: Date,
  ): Promise<Enrollment> {
    console.log(
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
      .exec();
    if (existingEnrollment) {
      throw new AlreadyEnrolledException();
    }

    const newEnrollment = new this.enrollmentModel({
      studentId: new Types.ObjectId(studentId), // Преобразуем строку в ObjectId
      courseId: new Types.ObjectId(courseId), // Преобразуем строку в ObjectId
      deadline,
    });
    const savedEnrollment: EnrollmentDocument = await newEnrollment.save();
    await this.notificationsService.notifyNewCourse(
      studentId,
      courseId,
      course.title,
    );

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
  ): Promise<Enrollment[]> {
    console.log(
      'Creating batch enrollments:',
      JSON.stringify(batchEnrollmentDto, null, 2),
    );
    const { studentIds, courseIds, deadlines } = batchEnrollmentDto;

    if (studentIds.length !== courseIds.length) {
      throw new Error('Number of studentIds must match number of courseIds');
    }

    const enrollments: Enrollment[] = [];

    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const courseId = courseIds[i];
      const deadlineStr: string | undefined = deadlines?.[i];
      let deadline: Date | undefined;

      console.log('Processing deadline:', {
        index: i,
        deadlineStr,
        type: typeof deadlineStr,
      });

      if (deadlineStr) {
        try {
          deadline = new Date(deadlineStr);
          if (isNaN(deadline.getTime())) {
            console.warn(
              `Invalid date format for deadline ${deadlineStr} at index ${i}, skipping...`,
            );
            deadline = undefined;
          }
        } catch (error) {
          console.error(
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
        console.error(
          `Failed to create enrollment for student ${studentId} and course ${courseId}:`,
          error,
        );
      }
    }

    return enrollments;
  }

  async findEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    return this.enrollmentModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .lean()
      .exec(); // Используем .lean()
  }

  async findEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    return this.enrollmentModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .lean()
      .exec(); // Используем .lean()
  }

  async findEnrollmentById(enrollmentId: string): Promise<Enrollment | null> {
    return this.enrollmentModel.findById(enrollmentId).lean().exec(); // Используем .lean()
  }

  async updateProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<Enrollment | null> {
    const enrollment = await this.enrollmentModel
      .findById(enrollmentId)
      .lean()
      .exec(); // Используем .lean()
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    if (!enrollment.completedModules.includes(moduleId)) {
      enrollment.completedModules.push(moduleId);
    }
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    const updatedEnrollment: EnrollmentDocument = await enrollment.save();
    await this.notificationsService.notifyProgress(
      enrollmentId,
      moduleId,
      lessonId,
    );

    if (updatedEnrollment.deadline) {
      const daysLeft = Math.ceil(
        (updatedEnrollment.deadline.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysLeft <= 7 && daysLeft > 0) {
        const course = await this.coursesService.findCourseById(
          updatedEnrollment.courseId.toString(),
        );
        if (course) {
          await this.notificationsService.notifyDeadline(
            enrollmentId,
            daysLeft,
            course.title,
          );
        }
      }
    }

    return updatedEnrollment;
  }

  async completeCourse(
    enrollmentId: string,
    grade: number,
  ): Promise<Enrollment | null> {
    if (grade < 0 || grade > 100) {
      throw new Error('Grade must be between 0 and 100');
    }

    const enrollment = await this.enrollmentModel.findById(enrollmentId).exec();
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    enrollment.isCompleted = true;
    enrollment.grade = grade;
    const updatedEnrollment: EnrollmentDocument = await enrollment.save();
    return updatedEnrollment;
  }

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    await this.enrollmentModel.findByIdAndDelete(enrollmentId).exec();
  }

  async getStudentProgress(studentId: string): Promise<any> {
    const enrollments = await this.findEnrollmentsByStudent(studentId);
    const progress = enrollments.map((enrollment) => {
      const course = enrollment.courseId.toString(); // Теперь это ObjectId, преобразуем в строку

      return {
        courseId: course,
        courseTitle: (async () => {
          const courseObj = await this.coursesService.findCourseById(course);
          return courseObj?.title || 'Unknown';
        })(),
        completedModules: enrollment.completedModules.length,
        totalModules: (async () => {
          const courseObj = await this.coursesService.findCourseById(course);
          return courseObj?.modules.length || 0;
        })(),
        completedLessons: enrollment.completedLessons.length,
        totalLessons: (async () => {
          const courseObj = await this.coursesService.findCourseById(course);
          const total =
            courseObj?.modules.reduce((sum, moduleId) => {
              return (
                sum +
                ((async () => {
                  const module = await this.coursesService.findModuleById(
                    moduleId.toString(),
                  );
                  return module?.lessons.length || 0;
                })() as any)
              );
            }, 0) || 0;
          return total;
        })(),
        grade: enrollment.grade,
        isCompleted: enrollment.isCompleted,
        deadline: enrollment.deadline
          ? enrollment.deadline.toISOString()
          : null,
      };
    });
    return {
      studentId,
      progress: await Promise.all(
        progress.map(async (p) => ({
          ...p,
          courseTitle: await p.courseTitle,
          totalModules: await p.totalModules,
          totalLessons: await p.totalLessons,
        })),
      ),
    };
  }

  async getDetailedStudentProgress(studentId: string): Promise<any> {
    const enrollments = await this.findEnrollmentsByStudent(studentId);
    const progress = enrollments.map((enrollment) => {
      const course = enrollment.courseId.toString(); // Теперь это ObjectId, преобразуем в строку

      return {
        courseId: course,
        courseTitle: (async () => {
          const courseObj = await this.coursesService.findCourseById(course);
          return courseObj?.title || 'Unknown';
        })(),
        completionPercentage: (async () => {
          const courseObj = await this.coursesService.findCourseById(course);
          const completedModules = enrollment.completedModules.length;
          const totalModules = courseObj?.modules.length || 0;
          return totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
        })(),
        lessonCompletionPercentage: (async () => {
          const courseObj = await this.coursesService.findCourseById(course);
          const completedLessons = enrollment.completedLessons.length;
          const totalLessons =
            courseObj?.modules.reduce((sum, moduleId) => {
              return (
                sum +
                ((async () => {
                  const module = await this.coursesService.findModuleById(
                    moduleId.toString(),
                  );
                  return module?.lessons.length || 0;
                })() as any)
              );
            }, 0) || 0;
          return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        })(),
        completedModules: enrollment.completedModules.length,
        totalModules: (async () => {
          const courseObj = await this.coursesService.findCourseById(course);
          return courseObj?.modules.length || 0;
        })(),
        completedLessons: enrollment.completedLessons.length,
        totalLessons: (async () => {
          const courseObj = await this.coursesService.findCourseById(course);
          const total =
            courseObj?.modules.reduce((sum, moduleId) => {
              return (
                sum +
                ((async () => {
                  const module = await this.coursesService.findModuleById(
                    moduleId.toString(),
                  );
                  return module?.lessons.length || 0;
                })() as any)
              );
            }, 0) || 0;
          return total;
        })(),
        grade: enrollment.grade,
        isCompleted: enrollment.isCompleted,
        deadline: enrollment.deadline
          ? enrollment.deadline.toISOString()
          : null,
      };
    });
    return {
      studentId,
      progress: await Promise.all(
        progress.map(async (p) => ({
          ...p,
          courseTitle: await p.courseTitle,
          completionPercentage: Number(
            (await p.completionPercentage).toFixed(2),
          ),
          lessonCompletionPercentage: Number(
            (await p.lessonCompletionPercentage).toFixed(2),
          ),
          totalModules: await p.totalModules,
          totalLessons: await p.totalLessons,
        })),
      ),
    };
  }

  async notifyProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void> {
    await this.notificationsService.notifyProgress(
      enrollmentId,
      moduleId,
      lessonId,
    );
  }

  async exportEnrollmentsToCsv(): Promise<string> {
    console.log('Exporting enrollments to CSV');
    const enrollments = (await this.enrollmentModel
      .find()
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

    return stringify(csvData, { header: true });
  }
}
