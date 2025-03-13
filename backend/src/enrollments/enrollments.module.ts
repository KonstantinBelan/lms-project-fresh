import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Enrollment, EnrollmentSchema } from './schemas/enrollment.schema';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { HomeworksModule } from '../homeworks/homeworks.module';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { StreamsModule } from '../streams/streams.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '../mailer/mailer.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
    CacheModule.register(), // Регистрация модуля кэширования
    UsersModule,
    forwardRef(() => CoursesModule),
    AuthModule,
    forwardRef(() => NotificationsModule),
    BullModule.forRoot({
      redis: { host: 'localhost', port: 6379 }, // Настройки Redis
    }),
    BullModule.registerQueue({ name: 'notifications' }), // Очередь для уведомлений
    forwardRef(() => HomeworksModule),
    forwardRef(() => QuizzesModule),
    forwardRef(() => StreamsModule),
    forwardRef(() => TariffsModule),
    MailerModule,
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService, MongooseModule],
})
export class EnrollmentsModule {}
