import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Inject, forwardRef } from '@nestjs/common';

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
  ) {
    this.logger.log('Инициализация QuizzesService');
  }

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
    this.logger.log(
      `Создание викторины для урока ${lessonId} с названием "${title}"`,
    );
    const quiz = new this.quizModel({
      lessonId: new Types.ObjectId(lessonId),
      title,
      questions,
      timeLimit,
    });
    const savedQuiz = await quiz.save();
    this.logger.log(`Викторина успешно создана: ${savedQuiz._id}`);
    return savedQuiz.toObject();
  }

  async findQuizById(quizId: string): Promise<Quiz | null> {
    const cacheKey = `quiz:${quizId}`;
    const cachedQuiz = await this.cacheManager.get<Quiz>(cacheKey);
    if (cachedQuiz) {
      this.logger.debug(`Викторина ${quizId} найдена в кэше`);
      return cachedQuiz;
    }

    const quiz = await this.quizModel.findById(quizId).lean().exec();
    if (!quiz) {
      this.logger.warn(`Викторина с ID ${quizId} не найдена`);
      return null;
    }
    await this.cacheManager.set(cacheKey, quiz, CACHE_TTL);
    this.logger.log(`Викторина ${quizId} найдена и сохранена в кэш`);
    return quiz;
  }

  async findQuizzesByLesson(lessonId: string): Promise<Quiz[]> {
    const cacheKey = `quizzes:lesson:${lessonId}`;
    const cachedQuizzes = await this.cacheManager.get<Quiz[]>(cacheKey);
    if (cachedQuizzes) {
      this.logger.debug(`Викторины для урока ${lessonId} найдены в кэше`);
      return cachedQuizzes;
    }

    const quizzes = await this.quizModel
      .find({ lessonId: new Types.ObjectId(lessonId) })
      .lean()
      .exec();
    await this.cacheManager.set(cacheKey, quizzes, CACHE_TTL);
    this.logger.log(
      `Найдено ${quizzes.length} викторин для урока ${lessonId}, сохранено в кэш`,
    );
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
    this.logger.log(
      `Обновление викторины ${quizId} с данными: ${JSON.stringify(updateData)}`,
    );
    const quiz = await this.quizModel
      .findByIdAndUpdate(quizId, updateData, { new: true })
      .lean()
      .exec();
    if (!quiz) {
      this.logger.warn(`Викторина ${quizId} не найдена для обновления`);
      return null;
    }
    await this.cacheManager.del(`quiz:${quizId}`);
    await this.cacheManager.del(`quizzes:lesson:${quiz.lessonId}`);
    this.logger.log(`Викторина ${quizId} обновлена, кэш очищен`);
    return quiz;
  }

  async deleteQuiz(quizId: string): Promise<void> {
    this.logger.log(`Удаление викторины ${quizId}`);
    const quiz = await this.quizModel.findById(quizId).lean().exec();
    if (!quiz) {
      this.logger.warn(`Викторина ${quizId} не найдена для удаления`);
      return;
    }
    await this.quizModel.deleteOne({ _id: quizId }).exec();
    await this.cacheManager.del(`quiz:${quizId}`);
    await this.cacheManager.del(`quizzes:lesson:${quiz.lessonId}`);
    this.logger.log(`Викторина ${quizId} удалена, кэш очищен`);
  }

  async submitQuiz(
    studentId: string,
    quizId: string,
    answers: (number[] | string)[],
  ): Promise<QuizSubmission> {
    this.logger.log(`Отправка викторины ${quizId} от студента ${studentId}`);

    const existingSubmission = await this.quizSubmissionModel
      .findOne({
        quizId: new Types.ObjectId(quizId),
        studentId: new Types.ObjectId(studentId),
      })
      .lean()
      .exec();
    if (existingSubmission) {
      this.logger.warn(`Студент ${studentId} уже отправил викторину ${quizId}`);
      throw new BadRequestException('Вы уже отправили эту викторину');
    }

    const quiz = await this.findQuizById(quizId);
    if (!quiz) {
      this.logger.warn(`Викторина ${quizId} не найдена`);
      throw new NotFoundException('Викторина не найдена');
    }

    if (answers.length !== quiz.questions.length) {
      this.logger.warn(
        `Количество ответов (${answers.length}) не соответствует количеству вопросов (${quiz.questions.length}) для викторины ${quizId}`,
      );
      throw new BadRequestException(
        'Количество ответов должно соответствовать количеству вопросов',
      );
    }

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
        this.logger.debug(
          `Установлено время начала викторины ${quizId} для ${studentId}`,
        );
      } else {
        const elapsedTime = (now - quizStartTime) / (1000 * 60);
        if (elapsedTime > quiz.timeLimit) {
          this.logger.warn(
            `Превышено время (${elapsedTime} мин) для викторины ${quizId}, лимит: ${quiz.timeLimit} мин`,
          );
          throw new BadRequestException('Превышен лимит времени');
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
    this.logger.log(
      `Викторина ${quizId} отправлена, оценка: ${score}% (totalScore: ${totalScore}, maxScore: ${maxScore})`,
    );

    const lesson = await this.lessonModel.findById(quiz.lessonId).lean().exec();
    if (!lesson) {
      this.logger.error(
        `Урок ${quiz.lessonId} не найден для викторины ${quizId}`,
      );
      throw new BadRequestException('Урок не найден');
    }

    const module = await this.moduleModel
      .findOne({ lessons: quiz.lessonId })
      .lean()
      .exec();
    if (!module) {
      this.logger.error(
        `Модуль не найден для урока ${quiz.lessonId} в викторине ${quizId}`,
      );
      throw new BadRequestException('Модуль не найден');
    }

    const course = await this.courseModel
      .findOne({ modules: module._id })
      .lean()
      .exec();
    if (!course) {
      this.logger.error(
        `Курс не найден для модуля ${module._id} в викторине ${quizId}`,
      );
      throw new BadRequestException('Курс не найден');
    }

    const moduleId = module._id.toString();
    const courseId = course._id.toString();

    await this.enrollmentsService.updateStudentProgress(
      studentId,
      courseId,
      moduleId,
      quiz.lessonId.toString(),
    );
    this.logger.debug(
      `Прогресс студента ${studentId} обновлен для курса ${courseId}`,
    );

    const updatedEnrollment = await this.enrollmentsService.awardPoints(
      studentId,
      courseId,
      totalScore,
    );
    if (updatedEnrollment) {
      this.logger.debug(
        `Начислено ${totalScore} баллов за викторину ${quizId}`,
      );
      const template =
        await this.notificationsService.getNotificationByKey('quiz_submission');
      const message = this.notificationsService.replacePlaceholders(
        template.message,
        {
          points: totalScore,
          quizTitle: quiz.title,
          lessonTitle: lesson.title,
        },
      );
      const notification = await this.notificationsService.createNotification({
        userId: studentId,
        message,
        title: template.title,
      });
      if (!notification._id) {
        this.logger.error(
          'Не удалось создать уведомление для студента ${studentId}',
        );
        throw new Error('Notification ID is missing');
      }
      await this.notificationsService.sendNotificationToUser(
        notification._id.toString(),
        studentId,
      );
      this.logger.log(`Уведомление отправлено студенту ${studentId}`);
    }

    if (quiz.timeLimit) {
      await this.cacheManager.del(`quiz:start:${quizId}:${studentId}`);
      this.logger.debug(`Время начала викторины ${quizId} очищено из кэша`);
    }

    return savedSubmission.toObject();
  }

  async getQuizSubmission(
    quizId: string,
    studentId: string,
  ): Promise<QuizSubmission | null> {
    this.logger.log(
      `Получение отправки викторины ${quizId} для студента ${studentId}`,
    );
    const submission = await this.quizSubmissionModel
      .findOne({
        quizId: new Types.ObjectId(quizId),
        studentId: new Types.ObjectId(studentId),
      })
      .lean()
      .exec();
    if (!submission) {
      this.logger.warn(
        `Отправка викторины ${quizId} для студента ${studentId} не найдена`,
      );
    }
    return submission;
  }

  async getQuizHints(
    quizId: string,
  ): Promise<{ question: string; hint?: string }[]> {
    this.logger.log(`Получение подсказок для викторины ${quizId}`);
    const quiz = await this.findQuizById(quizId);
    if (!quiz) {
      this.logger.warn(
        `Викторина ${quizId} не найдена для получения подсказок`,
      );
      throw new NotFoundException('Викторина не найдена');
    }
    const hints = quiz.questions.map((q) => ({
      question: q.question,
      hint: q.hint,
    }));
    this.logger.log(`Подсказки для викторины ${quizId} успешно получены`);
    return hints;
  }

  async getSubmissionsByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<QuizSubmission[]> {
    this.logger.log(
      `Получение отправок викторин для студента ${studentId} в курсе ${courseId}`,
    );
    const submissions = await this.quizSubmissionModel
      .find({ studentId })
      .populate({
        path: 'quizId',
        match: { courseId: new Types.ObjectId(courseId) },
      })
      .lean()
      .exec();
    const filteredSubmissions = submissions.filter((s) => s.quizId); // Убираем null из-за match
    this.logger.log(
      `Найдено ${filteredSubmissions.length} отправок для студента ${studentId} в курсе ${courseId}`,
    );
    return filteredSubmissions;
  }
}
