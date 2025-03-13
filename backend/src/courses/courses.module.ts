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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema }, // Модель курса
      { name: ModuleSchema.name, schema: ModuleSchemaDefinition }, // Модель модуля
      { name: Lesson.name, schema: LessonSchema }, // Модель урока
    ]),
    CacheModule.register(), // Модуль кэширования
    AuthModule, // Модуль авторизации
    UsersModule, // Модуль пользователей
    forwardRef(() => EnrollmentsModule), // Модуль записей на курсы
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService, MongooseModule],
})
export class CoursesModule {}
