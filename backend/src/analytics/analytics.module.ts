import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Enrollment,
  EnrollmentSchema,
} from '../enrollments/schemas/enrollment.schema';
import { Course, CourseSchema } from '../courses/schemas/course.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema }, // Схема для записей о зачислении студентов
      { name: Course.name, schema: CourseSchema }, // Схема для курсов
    ]),
    CacheModule.register(), // Модуль для кэширования
  ],
  providers: [AnalyticsService],
  exports: [AnalyticsService], // Экспорт сервиса для использования в других модулях
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
