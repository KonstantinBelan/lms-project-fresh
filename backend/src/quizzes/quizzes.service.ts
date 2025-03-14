import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz, QuizDocument, IQuiz } from './schemas/quiz.schema';
import {
  QuizSubmission,
  QuizSubmissionDocument,
  IQuizSubmission,
} from './schemas/quiz-submission.schema';
import { Lesson, LessonDocument } from '../courses/schemas/lesson.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Module, ModuleDocument } from '../courses/schemas/module.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Inject, forwardRef } from '@nestjs/common';

// Интерфейс для вопроса при создании/обновлении
interface IQuizQuestionInput {
  question: string;
  options?: string[];
  correctAnswers?: number[];
  correctTextAnswer?: string;
  weight?: number;
  hint?: string;
}

// Интерфейс для входных данных обновления викторины
interface IUpdateQuizInput {
  title?: string;
  questions?: IQuizQuestionInput[];
  timeLimit?: number;
}

const CACHE_TTL = parseInt(process.env.CACHE_TTL ?? '3600', 10); // 1 час по умолчанию

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
    this.logger.log('Инициализация сервиса викторин');
  }

  // Создание новой викторины
  async createQuiz(
    lessonId: string,
    title: string,
    questions: IQuizQuestionInput[],
    timeLimit?: number,
  ): Promise<IQuiz> {
    this.logger.log(`Создание викторины для урока ${lessonId}: "${title}"`);
    const quiz = new this.quizModel({
      lessonId: new Types.ObjectId(lessonId),
      title,
      questions,
      timeLimit,
    });
    const savedQuiz = await quiz.save();
    this.logger.log(`Викторина создана с ID: ${savedQuiz._id}`);
    return savedQuiz.toObject();
  }

  // Поиск викторины по ID с кэшированием
  async findQuizById(quizId: string): Promise<IQuiz | null> {
    const cacheKey = `quiz:${quizId}`;
    const cachedQuiz = await this.cacheManager.get<IQuiz>(cacheKey);
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
    this.logger.log(`Викторина ${quizId} сохранена в кэш`);
    return quiz;
  }

  // Поиск всех викторин по уроку
  async findQuizzesByLesson(lessonId: string): Promise<IQuiz[]> {
    const cacheKey = `quizzes:lesson:${lessonId}`;
    const cachedQuizzes = await this.cacheManager.get<IQuiz[]>(cacheKey);
    if (cachedQuizzes) {
      this.logger.debug(`Викторины урока ${lessonId} найдены в кэше`);
      return cachedQuizzes;
    }

    const quizzes = await this.quizModel
      .find({ lessonId: new Types.ObjectId(lessonId) })
      .lean()
      .exec();
    await this.cacheManager.set(cacheKey, quizzes, CACHE_TTL);
    this.logger.log(`Найдено ${quizzes.length} викторин для урока ${lessonId}`);
    return quizzes;
  }

  // Обновление викторины
  async updateQuiz(
    quizId: string,
    updateData: IUpdateQuizInput,
  ): Promise<IQuiz | null> {
    this.logger.log(
      `Обновление викторины ${quizId}: ${JSON.stringify(updateData)}`,
    );
    const quiz = await this.quizModel
      .findByIdAndUpdate(quizId, updateData, { new: true })
      .lean()
      .exec();
    if (!quiz) {
      this.logger.warn(`Викторина ${quizId} не найдена`);
      return null;
    }
    await Promise.all([
      this.cacheManager.del(`quiz:${quizId}`),
      this.cacheManager.del(`quizzes:lesson:${quiz.lessonId}`),
    ]);
    this.logger.log(`Викторина ${quizId} обновлена, кэш очищен`);
    return quiz;
  }

  // Удаление викторины
  async deleteQuiz(quizId: string): Promise<void> {
    this.logger.log(`Удаление викторины ${quizId}`);
    const quiz = await this.quizModel.findById(quizId).lean().exec();
    if (!quiz) {
      this.logger.warn(`Викторина ${quizId} не найдена`);
      return;
    }
    await this.quizModel.deleteOne({ _id: quizId }).exec();
    await Promise.all([
      this.cacheManager.del(`quiz:${quizId}`),
      this.cacheManager.del(`quizzes:lesson:${quiz.lessonId}`),
    ]);
    this.logger.log(`Викторина ${quizId} удалена, кэш очищен`);
  }

  // Отправка ответов на викторину
  async submitQuiz(
    studentId: string,
    quizId: string,
    answers: (number[] | string)[],
  ): Promise<IQuizSubmission> {
    this.logger.log(`Отправка викторины ${quizId} студентом ${studentId}`);

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
        `Ответов: ${answers.length}, вопросов: ${quiz.questions.length}`,
      );
      throw new BadRequestException(
        'Количество ответов не соответствует количеству вопросов',
      );
    }

    if (quiz.timeLimit) {
      const cacheKey = `quiz:start:${quizId}:${studentId}`;
      const quizStartTime = await this.cacheManager.get<number>(cacheKey);
      const now = Date.now();
      if (!quizStartTime) {
        await this.cacheManager.set(cacheKey, now, quiz.timeLimit * 60 * 1000);
        this.logger.debug(`Время начала викторины ${quizId} установлено`);
      } else {
        const elapsedTime = (now - quizStartTime) / (1000 * 60);
        if (elapsedTime > quiz.timeLimit) {
          this.logger.warn(`Превышен лимит времени: ${quiz.timeLimit} мин`);
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
    this.logger.log(`Викторина ${quizId} отправлена, оценка: ${score}%`);

    const [lesson, module, course] = await Promise.all([
      this.lessonModel.findById(quiz.lessonId).lean().exec(),
      this.moduleModel.findOne({ lessons: quiz.lessonId }).lean().exec(),
      this.courseModel
        .findOne({ modules: { $in: [quiz.lessonId] } })
        .lean()
        .exec(),
    ]);

    if (!lesson || !module || !course) {
      this.logger.error(`Не найдены связанные данные для викторины ${quizId}`);
      throw new BadRequestException('Ошибка в связанных данных');
    }

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
    if (updatedEnrollment) {
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
      await this.notificationsService.sendNotificationToUser(
        notification._id.toString(),
        studentId,
      );
      this.logger.log(`Уведомление отправлено студенту ${studentId}`);
    }

    if (quiz.timeLimit) {
      await this.cacheManager.del(`quiz:start:${quizId}:${studentId}`);
    }

    return savedSubmission.toObject();
  }

  // Получение отправки викторины
  async getQuizSubmission(
    quizId: string,
    studentId: string,
  ): Promise<IQuizSubmission | null> {
    this.logger.log(`Поиск отправки ${quizId} для студента ${studentId}`);
    const submission = await this.quizSubmissionModel
      .findOne({
        quizId: new Types.ObjectId(quizId),
        studentId: new Types.ObjectId(studentId),
      })
      .lean()
      .exec();
    return submission || null;
  }

  // Получение подсказок для викторины
  async getQuizHints(
    quizId: string,
  ): Promise<{ question: string; hint?: string }[]> {
    this.logger.log(`Получение подсказок для викторины ${quizId}`);
    const quiz = await this.findQuizById(quizId);
    if (!quiz) {
      this.logger.warn(`Викторина ${quizId} не найдена`);
      throw new NotFoundException('Викторина не найдена');
    }
    return quiz.questions.map((q) => ({ question: q.question, hint: q.hint }));
  }

  // Получение отправок по студенту и курсу
  async getSubmissionsByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<IQuizSubmission[]> {
    this.logger.log(
      `Поиск отправок для студента ${studentId} в курсе ${courseId}`,
    );
    const submissions = await this.quizSubmissionModel
      .find({ studentId })
      .populate({
        path: 'quizId',
        match: { courseId: new Types.ObjectId(courseId) },
      })
      .lean()
      .exec();
    return submissions.filter((s) => s.quizId);
  }
}
