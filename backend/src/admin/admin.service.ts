import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollments/schemas/enrollment.schema';
import {
  Notification,
  NotificationDocument,
} from '../notifications/schemas/notification.schema';
import { Types } from 'mongoose';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async getUsers(role?: string): Promise<User[]> {
    const query = role ? { role } : {};
    return this.userModel.find(query).lean().exec();
  }

  async getCourses(): Promise<Course[]> {
    return this.courseModel.find().lean().exec();
  }

  async getEnrollments(courseId?: string): Promise<Enrollment[]> {
    const query = courseId ? { courseId: new Types.ObjectId(courseId) } : {};
    return this.enrollmentModel.find(query).lean().exec();
  }

  async getNotifications(userId?: string): Promise<Notification[]> {
    const query = userId ? { userId: new Types.ObjectId(userId) } : {};
    return this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async getActivity(): Promise<any> {
    const [users, courses, enrollments, notifications] = await Promise.all([
      this.userModel.countDocuments().lean().exec(),
      this.courseModel.countDocuments().lean().exec(),
      this.enrollmentModel.countDocuments().lean().exec(),
      this.notificationModel.countDocuments().lean().exec(),
    ]);
    return {
      totalUsers: users,
      totalCourses: courses,
      totalEnrollments: enrollments,
      totalNotifications: notifications,
      recentEnrollments: await this.enrollmentModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),
      recentNotifications: await this.notificationModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),
    };
  }
}
