import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { IEnrollmentsService } from './enrollments.service.interface';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AlreadyEnrolledException } from './exceptions/already-enrolled.exception'; // Импортируем исключение

@Injectable()
export class EnrollmentsService implements IEnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    private usersService: UsersService,
    private coursesService: CoursesService,
    private notificationsService: NotificationsService,
  ) {
    console.log(
      'EnrollmentsService initialized, notificationsService:',
      this.notificationsService,
    );
  }

  async createEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<Enrollment> {
    const student = await this.usersService.findById(studentId);
    const course = await this.coursesService.findCourseById(courseId);

    if (!student || !course) {
      throw new Error('Student or course not found');
    }

    const existingEnrollment = await this.enrollmentModel
      .findOne({ studentId, courseId })
      .exec();
    if (existingEnrollment) {
      throw new AlreadyEnrolledException(); // Используем кастомное исключение
    }

    const newEnrollment = new this.enrollmentModel({ studentId, courseId });
    const savedEnrollment = await newEnrollment.save();
    await this.notificationsService.notifyNewCourse(
      studentId,
      courseId,
      course.title,
    );
    return savedEnrollment;
  }

  async findEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    return this.enrollmentModel.find({ studentId }).populate('courseId').exec();
  }

  async findEnrollmentById(enrollmentId: string): Promise<Enrollment | null> {
    return this.enrollmentModel
      .findById(enrollmentId)
      .populate('courseId')
      .exec();
  }

  async updateProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<Enrollment | null> {
    const enrollment = await this.enrollmentModel.findById(enrollmentId).exec();
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    if (!enrollment.completedModules.includes(moduleId)) {
      enrollment.completedModules.push(moduleId);
    }
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    const updatedEnrollment = await enrollment.save();
    await this.notificationsService.notifyProgress(
      enrollmentId,
      moduleId,
      lessonId,
    );
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
    const updatedEnrollment = await enrollment.save();
    return updatedEnrollment;
  }

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    await this.enrollmentModel.findByIdAndDelete(enrollmentId).exec();
  }

  async getStudentProgress(studentId: string): Promise<any> {
    const enrollments = await this.findEnrollmentsByStudent(studentId);
    const progress = enrollments.map((enrollment) => {
      const course = enrollment.courseId as any;
      const courseDoc = course?._doc || {};

      return {
        courseId: course?._id?.toString() || 'Unknown',
        courseTitle: courseDoc.title || 'Unknown',
        completedModules: enrollment.completedModules.length,
        totalModules: courseDoc.modules?.length || 0,
        completedLessons: enrollment.completedLessons.length,
        totalLessons:
          courseDoc.modules?.reduce(
            (sum: number, module: any) => sum + (module?.lessons?.length || 0),
            0,
          ) || 0,
        grade: enrollment.grade,
        isCompleted: enrollment.isCompleted,
      };
    });
    return { studentId, progress };
  }

  async getDetailedStudentProgress(studentId: string): Promise<any> {
    const enrollments = await this.findEnrollmentsByStudent(studentId);
    const progress = enrollments.map((enrollment) => {
      const course = enrollment.courseId as any;
      const courseDoc = course?._doc || {};

      const totalModules = courseDoc.modules?.length || 0;
      const completedModules = enrollment.completedModules.length;
      const totalLessons =
        courseDoc.modules?.reduce(
          (sum: number, module: any) => sum + (module?.lessons?.length || 0),
          0,
        ) || 0;
      const completedLessons = enrollment.completedLessons.length;

      const completionPercentage =
        totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
      const lessonCompletionPercentage =
        totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      return {
        courseId: course?._id?.toString() || 'Unknown',
        courseTitle: courseDoc.title || 'Unknown',
        completionPercentage: Number(completionPercentage.toFixed(2)),
        lessonCompletionPercentage: Number(
          lessonCompletionPercentage.toFixed(2),
        ),
        completedModules,
        totalModules,
        completedLessons,
        totalLessons,
        grade: enrollment.grade,
        isCompleted: enrollment.isCompleted,
      };
    });
    return { studentId, progress };
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
}
