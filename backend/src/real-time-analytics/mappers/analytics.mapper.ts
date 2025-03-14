import {
  IStudentProgress,
  ICourseActivity,
  IRecentActivity,
} from '../real-time-analytics.service';

// Маппер для аналитики
export class AnalyticsMapper {
  static toStudentProgressResponse(data: IStudentProgress): IStudentProgress {
    return {
      studentId: data.studentId,
      progress: data.progress.map((p) => ({
        courseId: p.courseId,
        courseTitle: p.courseTitle,
        completedModules: p.completedModules,
        totalModules: p.totalModules,
        completedLessons: p.completedLessons,
        totalLessons: p.totalLessons,
        grade: p.grade ?? 0,
        isCompleted: p.isCompleted,
      })),
    };
  }

  static toCourseActivityResponse(data: ICourseActivity): ICourseActivity {
    return {
      courseId: data.courseId,
      totalEnrollments: data.totalEnrollments,
      activeHomeworks: data.activeHomeworks,
      totalSubmissions: data.totalSubmissions,
      recentActivity: data.recentActivity.map((submission) => ({
        _id: submission._id.toString(), // Преобразуем ObjectId в строку
        homeworkId: submission.homeworkId.toString(), // Преобразуем ObjectId в строку
        studentId: submission.studentId.toString(), // Преобразуем ObjectId в строку
        createdAt: submission.createdAt, // Оставляем как Date
      })),
    };
  }
}
