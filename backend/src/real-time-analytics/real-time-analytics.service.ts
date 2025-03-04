import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollments/schemas/enrollment.schema';
import {
  Homework,
  HomeworkDocument,
} from '../homeworks/schemas/homework.schema';
import {
  Submission,
  SubmissionDocument,
} from '../homeworks/schemas/submission.schema';
import { Types } from 'mongoose';

@Injectable()
export class RealTimeAnalyticsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Homework.name) private homeworkModel: Model<HomeworkDocument>,
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
  ) {}

  async getStudentProgress(studentId: string): Promise<any> {
    const objectId = new Types.ObjectId(studentId);
    const enrollments = await this.enrollmentModel
      .find({ studentId: objectId })
      .lean()
      .exec();

    const progress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseId = enrollment.courseId.toString();
        const course = await this.getCourseDetails(courseId);
        return {
          courseId,
          courseTitle: course?.title || 'Unknown',
          completedModules: enrollment.completedModules.length,
          totalModules: course?.modules.length || 0,
          completedLessons: enrollment.completedLessons.length,
          totalLessons: await this.getTotalLessons(courseId),
          grade: enrollment.grade,
          isCompleted: enrollment.isCompleted,
        };
      }),
    );

    return { studentId, progress };
  }

  async getCourseActivity(courseId: string): Promise<any> {
    const objectId = new Types.ObjectId(courseId);
    const enrollments = await this.enrollmentModel
      .find({ courseId: objectId })
      .lean()
      .exec();
    const homeworks = await this.homeworkModel
      .find({ lessonId: { $in: await this.getLessonsForCourse(courseId) } })
      .lean()
      .exec();
    const submissions = await this.submissionModel
      .find({ homeworkId: { $in: homeworks.map((h) => h._id) } })
      .lean()
      .exec();

    return {
      courseId,
      totalEnrollments: enrollments.length,
      activeHomeworks: homeworks.filter((h) => h.isActive).length,
      totalSubmissions: submissions.length,
      recentActivity: submissions
        .sort(
          (a, b) =>
            (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime(),
        )
        .slice(0, 5), // Явно указываем тип Date
    };
  }

  private async getCourseDetails(courseId: string): Promise<any> {
    return this.enrollmentModel.db
      .collection('courses')
      .findOne({ _id: new Types.ObjectId(courseId) });
  }

  private async getTotalLessons(courseId: string): Promise<number> {
    const course = await this.getCourseDetails(courseId);
    if (!course || !course.modules) return 0;
    const lessons = await Promise.all(
      course.modules.map((moduleId: string) =>
        this.enrollmentModel.db
          .collection('modules')
          .findOne({ _id: new Types.ObjectId(moduleId) }),
      ),
    );
    return lessons.reduce(
      (sum, lesson) => sum + (lesson?.lessons?.length || 0),
      0,
    );
  }

  private async getLessonsForCourse(courseId: string): Promise<string[]> {
    const course = await this.getCourseDetails(courseId);
    if (!course || !course.modules) return [];
    const modules = await Promise.all(
      course.modules.map((moduleId: string) =>
        this.enrollmentModel.db
          .collection('modules')
          .findOne({ _id: new Types.ObjectId(moduleId) }),
      ),
    );
    return modules.reduce(
      (acc, module) => [...acc, ...(module?.lessons || [])],
      [],
    );
  }
}
