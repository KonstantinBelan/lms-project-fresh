import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import {
  QuizSubmission,
  QuizSubmissionDocument,
} from './schemas/quiz-submission.schema';
import { Lesson, LessonDocument } from '../courses/schemas/lesson.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Module, ModuleDocument } from '../courses/schemas/module.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Types } from 'mongoose';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

const CACHE_TTL = parseInt(process.env.CACHE_TTL ?? '3600', 10); // 1 час

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    @InjectModel(QuizSubmission.name)
    private quizSubmissionModel: Model<QuizSubmissionDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Module.name) private moduleModel: Model<ModuleDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => EnrollmentsService))
    private enrollmentsService: EnrollmentsService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  async createQuiz(
    lessonId: string,
    title: string,
    questions: {
      question: string;
      options?: string[];
      correctAnswers?: number[];
      correctTextAnswer?: string;
      weight?: number;
      hint?: string;
    }[],
    timeLimit?: number,
  ): Promise<Quiz> {
    const quiz = new this.quizModel({
      lessonId: new Types.ObjectId(lessonId),
      title,
      questions,
      timeLimit,
    });
    const savedQuiz = await quiz.save();
    return savedQuiz.toObject();
  }

  async findQuizById(quizId: string): Promise<Quiz | null> {
    const cacheKey = `quiz:${quizId}`;
    const cachedQuiz = await this.cacheManager.get<Quiz>(cacheKey);
    if (cachedQuiz) return cachedQuiz;

    const quiz = await this.quizModel.findById(quizId).lean().exec();
    if (quiz) await this.cacheManager.set(cacheKey, quiz, CACHE_TTL);
    return quiz;
  }

  async findQuizzesByLesson(lessonId: string): Promise<Quiz[]> {
    const cacheKey = `quizzes:lesson:${lessonId}`;
    const cachedQuizzes = await this.cacheManager.get<Quiz[]>(cacheKey);
    if (cachedQuizzes) return cachedQuizzes;

    const quizzes = await this.quizModel
      .find({ lessonId: new Types.ObjectId(lessonId) })
      .lean()
      .exec();
    await this.cacheManager.set(cacheKey, quizzes, CACHE_TTL);
    return quizzes;
  }

  async updateQuiz(
    quizId: string,
    updateData: {
      title?: string;
      questions?: {
        question: string;
        options?: string[];
        correctAnswers?: number[];
        correctTextAnswer?: string;
        weight?: number;
        hint?: string;
      }[];
      timeLimit?: number;
    },
  ): Promise<Quiz | null> {
    const quiz = await this.quizModel
      .findByIdAndUpdate(quizId, updateData, { new: true })
      .lean()
      .exec();
    if (quiz) {
      await this.cacheManager.del(`quiz:${quizId}`);
      await this.cacheManager.del(`quizzes:lesson:${quiz.lessonId}`);
    }
    return quiz;
  }

  async deleteQuiz(quizId: string): Promise<void> {
    const quiz = await this.quizModel.findById(quizId).lean().exec();
    if (quiz) {
      await this.quizModel.deleteOne({ _id: quizId }).exec();
      await this.cacheManager.del(`quiz:${quizId}`);
      await this.cacheManager.del(`quizzes:lesson:${quiz.lessonId}`);
    }
  }

  // async submitQuiz(
  //   studentId: string,
  //   quizId: string,
  //   answers: (number[] | string)[],
  // ): Promise<QuizSubmission> {
  //   this.logger.log(`Submitting quiz ${quizId} for student ${studentId}`);
  //   const existingSubmission = await this.quizSubmissionModel
  //     .findOne({
  //       quizId: new Types.ObjectId(quizId),
  //       studentId: new Types.ObjectId(studentId),
  //     })
  //     .lean()
  //     .exec();
  //   if (existingSubmission) {
  //     throw new BadRequestException('You have already submitted this quiz');
  //   }

  //   const quiz = await this.findQuizById(quizId);
  //   if (!quiz) throw new BadRequestException('Quiz not found');

  //   if (quiz.timeLimit) {
  //     const quizStartTime = await this.cacheManager.get<number>(
  //       `quiz:start:${quizId}:${studentId}`,
  //     );
  //     const now = Date.now();
  //     if (!quizStartTime) {
  //       await this.cacheManager.set(
  //         `quiz:start:${quizId}:${studentId}`,
  //         now,
  //         quiz.timeLimit * 60 * 1000,
  //       );
  //     } else {
  //       const elapsedTime = (now - quizStartTime) / (1000 * 60);
  //       if (elapsedTime > quiz.timeLimit) {
  //         throw new BadRequestException('Time limit exceeded');
  //       }
  //     }
  //   }

  //   let totalScore = 0;
  //   let maxScore = 0;
  //   quiz.questions.forEach((q, index) => {
  //     const studentAnswer = answers[index];
  //     let isCorrect = false;

  //     if (q.correctAnswers && Array.isArray(studentAnswer)) {
  //       isCorrect =
  //         q.correctAnswers.length === studentAnswer.length &&
  //         q.correctAnswers.every((answer) => studentAnswer.includes(answer));
  //     } else if (q.correctTextAnswer && typeof studentAnswer === 'string') {
  //       isCorrect =
  //         q.correctTextAnswer.trim().toLowerCase() ===
  //         studentAnswer.trim().toLowerCase();
  //     }

  //     totalScore += isCorrect ? q.weight || 1 : 0;
  //     maxScore += q.weight || 1;
  //   });
  //   const score = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  //   const submission = new this.quizSubmissionModel({
  //     quizId: new Types.ObjectId(quizId),
  //     studentId: new Types.ObjectId(studentId),
  //     answers,
  //     score,
  //   });
  //   const savedSubmission = await submission.save();

  //   const lesson = await this.lessonModel.findById(quiz.lessonId).lean().exec();
  //   if (!lesson) throw new BadRequestException('Lesson not found');

  //   const module = await this.moduleModel
  //     .findOne({ lessons: quiz.lessonId })
  //     .lean()
  //     .exec();
  //   if (!module)
  //     throw new BadRequestException('Module not found for this lesson');

  //   const course = await this.courseModel
  //     .findOne({ modules: module._id })
  //     .lean()
  //     .exec();
  //   if (!course)
  //     throw new BadRequestException('Course not found for this module');

  //   const moduleId = module._id.toString();
  //   const courseId = course._id.toString();

  //   await this.enrollmentsService.updateStudentProgress(
  //     studentId,
  //     courseId,
  //     moduleId,
  //     quiz.lessonId.toString(),
  //   );

  //   // Начисляем баллы через EnrollmentsService
  //   const updatedEnrollment = await this.enrollmentsService.awardPoints(
  //     studentId,
  //     courseId,
  //     totalScore,
  //   );
  //   if (updatedEnrollment) {
  //     this.logger.debug(`Awarded ${totalScore} points for quiz ${quizId}`);
  //     await this.notificationsService.notifyProgress(
  //       updatedEnrollment._id.toString(),
  //       moduleId,
  //       quiz.lessonId.toString(),
  //       `You earned ${totalScore} points for completing quiz "${quiz.title}"!`,
  //     );
  //   }

  //   if (quiz.timeLimit) {
  //     await this.cacheManager.del(`quiz:start:${quizId}:${studentId}`);
  //   }

  //   return savedSubmission.toObject();
  // }

  async submitQuiz(
    studentId: string,
    quizId: string,
    answers: (number[] | string)[],
  ): Promise<QuizSubmission> {
    this.logger.log(`Submitting quiz ${quizId} for student ${studentId}`);
    const existingSubmission = await this.quizSubmissionModel
      .findOne({
        quizId: new Types.ObjectId(quizId),
        studentId: new Types.ObjectId(studentId),
      })
      .lean()
      .exec();
    if (existingSubmission) {
      throw new BadRequestException('You have already submitted this quiz');
    }

    const quiz = await this.findQuizById(quizId);
    if (!quiz) throw new BadRequestException('Quiz not found');

    if (quiz.timeLimit) {
      const quizStartTime = await this.cacheManager.get<number>(
        `quiz:start:${quizId}:${studentId}`,
      );
      const now = Date.now();
      if (!quizStartTime) {
        await this.cacheManager.set(
          `quiz:start:${quizId}:${studentId}`,
          now,
          quiz.timeLimit * 60 * 1000,
        );
      } else {
        const elapsedTime = (now - quizStartTime) / (1000 * 60);
        if (elapsedTime > quiz.timeLimit) {
          throw new BadRequestException('Time limit exceeded');
        }
      }
    }

    let totalScore = 0;
    let maxScore = 0;
    quiz.questions.forEach((q, index) => {
      const studentAnswer = answers[index];
      let isCorrect = false;

      if (q.correctAnswers && Array.isArray(studentAnswer)) {
        isCorrect =
          q.correctAnswers.length === studentAnswer.length &&
          q.correctAnswers.every((answer) => studentAnswer.includes(answer));
      } else if (q.correctTextAnswer && typeof studentAnswer === 'string') {
        isCorrect =
          q.correctTextAnswer.trim().toLowerCase() ===
          studentAnswer.trim().toLowerCase();
      }

      totalScore += isCorrect ? q.weight || 1 : 0;
      maxScore += q.weight || 1;
    });
    const score = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    const submission = new this.quizSubmissionModel({
      quizId: new Types.ObjectId(quizId),
      studentId: new Types.ObjectId(studentId),
      answers,
      score,
    });
    const savedSubmission = await submission.save();

    const lesson = await this.lessonModel.findById(quiz.lessonId).lean().exec();
    if (!lesson) throw new BadRequestException('Lesson not found');

    const module = await this.moduleModel
      .findOne({ lessons: quiz.lessonId })
      .lean()
      .exec();
    if (!module)
      throw new BadRequestException('Module not found for this lesson');

    const course = await this.courseModel
      .findOne({ modules: module._id })
      .lean()
      .exec();
    if (!course)
      throw new BadRequestException('Course not found for this module');

    const moduleId = module._id.toString();
    const courseId = course._id.toString();

    await this.enrollmentsService.updateStudentProgress(
      studentId,
      courseId,
      moduleId,
      quiz.lessonId.toString(),
    );

    const updatedEnrollment = await this.enrollmentsService.awardPoints(
      studentId,
      courseId,
      totalScore,
    );
    // if (updatedEnrollment) {
    //   this.logger.debug(`Awarded ${totalScore} points for quiz ${quizId}`);

    //   // Получаем настройки пользователя
    //   const student = await this.usersService.findById(studentId);
    //   if (!student) throw new NotFoundException('Student not found');

    //   await this.notificationsService.notifyProgress(
    //     studentId, // Используем studentId вместо enrollment._id
    //     `You earned ${totalScore} points for completing quiz "${quiz.title}"!`,
    //     student.settings, // Передаём настройки уведомлений
    //   );
    // }

    if (updatedEnrollment) {
      this.logger.debug(`Awarded ${totalScore} points for quiz ${quizId}`);
      const template =
        await this.notificationsService.getNotificationByKey('quiz_submission');
      const message = this.notificationsService.replacePlaceholders(
        template.message,
        {
          points: totalScore,
          quizTitle: quiz.title,
        },
      );
      const notification = await this.notificationsService.createNotification({
        userId: studentId,
        message,
        title: template.title,
      });
      if (!notification._id) throw new Error('Notification ID is missing');
      await this.notificationsService.sendNotificationToUser(
        notification._id.toString(),
        studentId,
      );
    }

    if (quiz.timeLimit) {
      await this.cacheManager.del(`quiz:start:${quizId}:${studentId}`);
    }

    return savedSubmission.toObject();
  }

  // async awardPoints(
  //   studentId: string,
  //   courseId: string,
  //   points: number,
  // ): Promise<EnrollmentDocument | null> {
  //   const enrollment = await this.enrollmentModel
  //     .findOne({
  //       studentId: new Types.ObjectId(studentId),
  //       courseId: new Types.ObjectId(courseId),
  //     })
  //     .exec();
  //   if (!enrollment || enrollment.isCompleted) return null;

  //   enrollment.points = (enrollment.points || 0) + points;
  //   await this.cacheManager.del(`enrollment:${enrollment._id.toString()}`);
  //   await this.cacheManager.del(`enrollments:student:${studentId}`);
  //   await this.cacheManager.del(`enrollments:course:${courseId}`);
  //   this.logger.debug(
  //     `Awarded ${points} points to enrollment ${enrollment._id}`,
  //   );
  //   return enrollment.save();
  // }

  async getQuizSubmission(
    quizId: string,
    studentId: string,
  ): Promise<QuizSubmission | null> {
    return this.quizSubmissionModel
      .findOne({
        quizId: new Types.ObjectId(quizId),
        studentId: new Types.ObjectId(studentId),
      })
      .lean()
      .exec();
  }

  // Новый метод для получения подсказок
  async getQuizHints(
    quizId: string,
  ): Promise<{ question: string; hint?: string }[]> {
    const quiz = await this.findQuizById(quizId);
    if (!quiz) throw new BadRequestException('Quiz not found');
    return quiz.questions.map((q) => ({ question: q.question, hint: q.hint }));
  }

  async getSubmissionsByStudentAndCourse(studentId: string, courseId: string) {
    const submissions = await this.quizSubmissionModel
      .find({ studentId })
      .populate({
        path: 'quizId',
        match: { courseId: new Types.ObjectId(courseId) },
      })
      .lean()
      .exec();
    return submissions.filter((s) => s.quizId); // Убираем null из-за match
  }
}
