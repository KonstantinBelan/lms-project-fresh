import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schemas/course.schema';
import {
  Module as ModuleSchema,
  ModuleSchema as ModuleSchemaDefinition,
} from './schemas/module.schema';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { AuthModule } from '../auth/auth.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { CacheModule } from '@nestjs/cache-manager';
import { UsersModule } from '../users/users.module';
import { HomeworksModule } from '../homeworks/homeworks.module';

// Модуль курсов
@Module({
  imports: [
    // Подключение моделей MongoDB
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema }, // Модель курса
      { name: ModuleSchema.name, schema: ModuleSchemaDefinition }, // Модель модуля
      { name: Lesson.name, schema: LessonSchema }, // Модель урока
    ]),
    CacheModule.register(), // Подключение модуля кэширования
    AuthModule, // Модуль авторизации
    UsersModule, // Модуль пользователей
    forwardRef(() => EnrollmentsModule), // Модуль записей на курсы с циклической зависимостью
    forwardRef(() => HomeworksModule), // Модуль домашних заданий
  ],
  controllers: [CoursesController], // Контроллер курсов
  providers: [CoursesService], // Сервис курсов
  exports: [CoursesService, MongooseModule], // Экспорт сервиса и моделей
})
export class CoursesModule {}
