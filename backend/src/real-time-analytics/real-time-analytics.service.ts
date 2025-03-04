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
    console.log('Starting getStudentProgress for userId:', studentId);
    try {
      let objectId: Types.ObjectId;
      try {
        objectId = new Types.ObjectId(studentId);
      } catch (error) {
        console.error('Invalid ObjectId for userId:', studentId, error);
        throw new Error('Invalid user ID format');
      }

      console.log('Searching enrollments for studentId:', objectId);
      const enrollments = await this.enrollmentModel
        .find({ studentId: objectId })
        .lean()
        .exec();

      console.log('Found enrollments:', enrollments.length);
      if (!enrollments.length) {
        console.warn('No enrollments found for userId:', studentId);
        return { studentId, progress: [] };
      }

      const progress = await Promise.all(
        enrollments.map(async (enrollment) => {
          console.log(
            'Processing enrollment for courseId:',
            enrollment.courseId.toString(),
          );
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

      const result = { studentId, progress };
      console.log('Completed getStudentProgress:', result);
      return result;
    } catch (error) {
      console.error('Failed to get student progress:', error);
      throw error;
    }
  }

  async getCourseActivity(courseId: string): Promise<any> {
    console.log('Starting getCourseActivity for courseId:', courseId);
    try {
      let objectId: Types.ObjectId;
      try {
        objectId = new Types.ObjectId(courseId);
      } catch (error) {
        console.error('Invalid ObjectId for courseId:', courseId, error);
        throw new Error('Invalid course ID format');
      }

      console.log('Searching enrollments for courseId:', objectId);
      const enrollments = await this.enrollmentModel
        .find({ courseId: objectId })
        .lean()
        .exec();
      console.log('Found enrollments:', enrollments.length);

      console.log('Searching homeworks for courseId:', courseId);
      const homeworks = await this.homeworkModel
        .find({ lessonId: { $in: await this.getLessonsForCourse(courseId) } })
        .lean()
        .exec();
      console.log('Found homeworks:', homeworks.length);

      console.log(
        'Searching submissions for homeworks:',
        homeworks.map((h) => h._id),
      );
      const submissions = await this.submissionModel
        .find({ homeworkId: { $in: homeworks.map((h) => h._id) } })
        .lean()
        .exec();
      console.log('Found submissions:', submissions.length);

      const result = {
        courseId,
        totalEnrollments: enrollments.length,
        activeHomeworks: homeworks.filter((h) => h.isActive).length,
        totalSubmissions: submissions.length,
        recentActivity: submissions
          .sort(
            (a, b) =>
              (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime(),
          )
          .slice(0, 5),
      };
      console.log('Completed getCourseActivity:', result);
      return result;
    } catch (error) {
      console.error('Failed to get course activity:', error);
      throw error;
    }
  }

  private async getCourseDetails(courseId: string): Promise<any> {
    console.log('Getting course details for courseId:', courseId);
    return this.enrollmentModel.db
      .collection('courses')
      .findOne({ _id: new Types.ObjectId(courseId) });
  }

  private async getTotalLessons(courseId: string): Promise<number> {
    console.log('Calculating total lessons for courseId:', courseId);
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
    console.log('Getting lessons for courseId:', courseId);
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
