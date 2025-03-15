import { Homework, HomeworkDocument } from './schemas/homework.schema';
import { Submission, SubmissionDocument } from './schemas/submission.schema';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

/**
 * Интерфейс сервиса для работы с домашними заданиями и их решениями
 */
export interface IHomeworksService {
  /**
   * Создаёт новое домашнее задание
   * @param createHomeworkDto Данные для создания домашнего задания
   * @returns Созданное домашнее задание
   */
  createHomework(
    createHomeworkDto: CreateHomeworkDto,
  ): Promise<HomeworkDocument>;

  /**
   * Обновляет существующее домашнее задание
   * @param id Идентификатор домашнего задания
   * @param updateHomeworkDto Данные для обновления
   * @returns Обновлённое домашнее задание или null, если не найдено
   */
  updateHomework(
    id: string,
    updateHomeworkDto: UpdateHomeworkDto,
  ): Promise<Homework | null>;

  /**
   * Удаляет домашнее задание
   * @param id Идентификатор домашнего задания
   */
  deleteHomework(id: string): Promise<void>;

  /**
   * Находит домашнее задание по идентификатору
   * @param id Идентификатор домашнего задания
   * @returns Найденное домашнее задание или null
   */
  findHomeworkById(id: string): Promise<Homework | null>;

  /**
   * Находит все домашние задания для указанного урока
   * @param lessonId Идентификатор урока
   * @returns Массив домашних заданий
   */
  findHomeworksByLesson(lessonId: string): Promise<Homework[]>;

  /**
   * Создаёт новое решение для домашнего задания
   * @param createSubmissionDto Данные для создания решения
   * @returns Созданное решение
   */
  createSubmission(
    createSubmissionDto: CreateSubmissionDto,
  ): Promise<SubmissionDocument>;

  /**
   * Обновляет существующее решение
   * @param id Идентификатор решения
   * @param updateSubmissionDto Данные для обновления
   * @returns Обновлённое решение или null, если не найдено
   */
  updateSubmission(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<Submission | null>;

  /**
   * Находит решение по идентификатору
   * @param id Идентификатор решения
   * @returns Найденное решение или null
   */
  findSubmissionById(id: string): Promise<Submission | null>;

  /**
   * Находит все решения для указанного домашнего задания
   * @param homeworkId Идентификатор домашнего задания
   * @returns Массив решений
   */
  findSubmissionsByHomework(homeworkId: string): Promise<Submission[]>;

  /**
   * Находит все решения указанного студента
   * @param studentId Идентификатор студента
   * @returns Массив решений
   */
  findSubmissionsByStudent(studentId: string): Promise<Submission[]>;

  /**
   * Создает несколько домашних заданий одновременно
   * @param createHomeworkDtos Массив данных для создания домашних заданий
   * @returns Массив созданных домашних заданий
   */
  createMultipleHomeworks(
    createHomeworkDtos: CreateHomeworkDto[],
  ): Promise<HomeworkDocument[]>;
}
