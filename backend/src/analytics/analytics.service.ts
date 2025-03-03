import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollments/schemas/enrollment.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async getCourseAnalytics(courseId: string): Promise<any> {
    const enrollments = await this.enrollmentModel
      .find({ courseId })
      .populate('studentId')
      .exec();
    const totalStudents = enrollments.length;
    const completedStudents = enrollments.filter((e) => e.isCompleted).length;
    const averageGrade =
      enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + (e.grade || 0), 0) /
          enrollments.length
        : 0;

    const course = await this.courseModel.findById(courseId).exec();
    const courseTitle = course?.title || 'Unknown';

    return {
      courseId,
      courseTitle,
      totalStudents,
      completedStudents,
      completionRate:
        totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0,
      averageGrade: Number(averageGrade.toFixed(2)),
    };
  }

  async getOverallAnalytics(): Promise<any> {
    const enrollments = await this.enrollmentModel
      .find()
      .populate('courseId')
      .exec();
    const courses = await this.courseModel.find().exec();
    const totalStudents = enrollments.length;
    const completedStudents = enrollments.filter((e) => e.isCompleted).length;
    const averageGrade =
      totalStudents > 0
        ? enrollments.reduce((sum, e) => sum + (e.grade || 0), 0) /
          totalStudents
        : 0;

    return {
      totalStudents,
      completedStudents,
      completionRate:
        totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0,
      averageGrade: Number(averageGrade.toFixed(2)),
      totalCourses: courses.length,
    };
  }
}
