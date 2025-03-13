import { Logger, Injectable, Inject, forwardRef } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CoursesService } from '../courses/courses.service';
import { HomeworksService } from '../homeworks/homeworks.service';

@WebSocketGateway({ cors: { origin: '*' } }) // Глобальный шлюз без пространства имен
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  private logger = new Logger('NotificationsGateway');
  private subscriptions = new Map<string, string>(); // userId -> socketId

  constructor(
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => EnrollmentsService))
    private readonly enrollmentsService: EnrollmentsService,
    @Inject(forwardRef(() => CoursesService))
    private readonly coursesService: CoursesService,
    @Inject(forwardRef(() => HomeworksService))
    private readonly homeworksService: HomeworksService,
  ) {
    this.logger.log('Инициализация NotificationsGateway');
    this.logger.log(`NotificationsService: ${!!this.notificationsService}`);
    this.logger.log(`EnrollmentsService: ${!!this.enrollmentsService}`);
    this.logger.log(`CoursesService: ${!!this.coursesService}`);
    this.logger.log(`HomeworksService: ${!!this.homeworksService}`);
  }

  // Инициализация WebSocket-сервера
  afterInit() {
    this.logger.log('WebSocket-сервер инициализирован');
  }

  // Обработка подключения клиента
  handleConnection(client: Socket) {
    this.logger.log(`Клиент подключился: ${client.id}`);
  }

  // Обработка отключения клиента
  handleDisconnect(client: Socket) {
    const userId = [...this.subscriptions.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];
    if (userId) {
      this.subscriptions.delete(userId);
      this.logger.log(`Клиент отписался: ${userId}`);
    }
    this.logger.log(`Клиент отключился: ${client.id}`);
  }

  // Подписка клиента на уведомления
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.subscriptions.set(data.userId, client.id);
    this.logger.log(`Клиент подписался на уведомления: ${data.userId}`);
  }

  // Подписка на обновления прогресса
  @SubscribeMessage('subscribe-progress')
  async handleSubscribeProgress(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Подписка на прогресс для пользователя: ${data.userId}`);
    try {
      const enrollments = await this.enrollmentsService.getEnrollmentsByStudent(
        data.userId,
      );
      const progress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const courseId = enrollment.courseId.toString();
          const progressData = await this.enrollmentsService.getStudentProgress(
            data.userId,
            courseId,
          );
          return {
            courseTitle:
              (await this.coursesService.findCourseById(courseId))?.title ||
              'Неизвестно',
            ...progressData,
          };
        }),
      );
      this.server
        .to(data.userId)
        .emit('progress-update', { userId: data.userId, progress });
      this.logger.debug(`Прогресс отправлен пользователю: ${data.userId}`);
    } catch (error) {
      this.logger.error(`Ошибка в subscribe-progress: ${error.message}`);
      this.server.to(data.userId).emit('error', {
        message: 'Не удалось получить прогресс',
        error: error.message,
      });
    }
  }

  // Подписка на активность курса
  @SubscribeMessage('subscribe-activity')
  async handleSubscribeActivity(
    @MessageBody() data: { courseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Подписка на активность для курса: ${data.courseId}`);
    try {
      const enrollments = await this.enrollmentsService.getEnrollmentsByCourse(
        data.courseId,
      );
      const homeworks = await this.homeworksService.getHomeworksByCourse(
        data.courseId,
      );
      const submissions = await this.homeworksService.getSubmissionsByCourse(
        data.courseId,
      );
      const activity = {
        courseId: data.courseId,
        totalEnrollments: enrollments.length,
        activeHomeworks: homeworks.filter((h) => h.isActive).length,
        totalSubmissions: submissions.length,
        recentActivity: submissions.slice(0, 5),
      };
      this.server.to(data.courseId).emit('activity-update', activity);
      this.logger.debug(`Активность отправлена для курса: ${data.courseId}`);
    } catch (error) {
      this.logger.error(`Ошибка в subscribe-activity: ${error.message}`);
      this.server.to(data.courseId).emit('error', {
        message: 'Не удалось получить активность',
        error: error.message,
      });
    }
  }

  // Отправка уведомления пользователю через WebSocket
  notifyUser(userId: string, message: string) {
    const socketId = this.subscriptions.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', {
        message,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(
        `Уведомление отправлено пользователю ${userId}: ${message}`,
      );
    } else {
      this.logger.warn(`Пользователь ${userId} не подписан на WebSocket`);
    }
  }
}
