import {
  IStudentProgress,
  ICourseActivity,
} from '../real-time-analytics.service'; // Импорт экспортированных интерфейсов

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
        grade: p.grade ?? 0, // Устанавливаем 0, если grade undefined
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
        _id: submission._id,
        homeworkId: submission.homeworkId,
        studentId: submission.studentId,
        createdAt: submission.createdAt,
      })),
    };
  }
}
