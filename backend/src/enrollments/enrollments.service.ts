import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { EnrollmentsService } from './enrollments.service.interface';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class EnrollmentsService implements EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    private usersService: UsersService,
    private coursesService: CoursesService,
  ) {}

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
      throw new Error('Student is already enrolled in this course');
    }

    const newEnrollment = new this.enrollmentModel({ studentId, courseId });
    return newEnrollment.save();
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

    return enrollment.save();
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
    return enrollment.save();
  }

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    await this.enrollmentModel.findByIdAndDelete(enrollmentId).exec();
  }
}
