import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import {
  QuizSubmission,
  QuizSubmissionDocument,
} from './schemas/quiz-submission.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Types } from 'mongoose';
import { EnrollmentsService } from '../enrollments/enrollments.service';

const CACHE_TTL = parseInt(process.env.CACHE_TTL ?? '3600', 10); // 1 час

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    @InjectModel(QuizSubmission.name)
    private quizSubmissionModel: Model<QuizSubmissionDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private enrollmentsService: EnrollmentsService,
  ) {}

  async createQuiz(
    lessonId: string,
    title: string,
    questions: { question: string; options: string[]; correctAnswer: number }[],
  ): Promise<Quiz> {
    const quiz = new this.quizModel({
      lessonId: new Types.ObjectId(lessonId),
      title,
      questions,
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
        options: string[];
        correctAnswer: number;
      }[];
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

  async submitQuiz(
    studentId: string,
    quizId: string,
    answers: number[],
  ): Promise<QuizSubmission> {
    const existingSubmission = await this.quizSubmissionModel
      .findOne({
        quizId: new Types.ObjectId(quizId),
        studentId: new Types.ObjectId(studentId),
      })
      .lean()
      .exec();
    if (existingSubmission) {
      throw new Error('You have already submitted this quiz');
    }

    const quiz = await this.findQuizById(quizId);
    if (!quiz) throw new Error('Quiz not found');

    let correctCount = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) correctCount++;
    });
    const score = (correctCount / quiz.questions.length) * 100;

    const submission = new this.quizSubmissionModel({
      quizId: new Types.ObjectId(quizId),
      studentId: new Types.ObjectId(studentId),
      answers,
      score,
    });
    const savedSubmission = await submission.save();

    const lesson = await this.lessonModel.findById(quiz.lessonId).lean().exec();
    const course = await this.courseModel
      .findOne({ 'modules.lessons': quiz.lessonId })
      .lean()
      .exec();
    if (!course) throw new Error('Course not found for this lesson');

    await this.enrollmentsService.updateStudentProgress(
      studentId,
      course._id.toString(),
      null,
      quiz.lessonId.toString(),
    );

    return savedSubmission.toObject();
  }

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
}
