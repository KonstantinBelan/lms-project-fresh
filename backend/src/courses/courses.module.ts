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
import { CacheModule } from '@nestjs/cache-manager'; // Добавляем для консистентности
import { UsersModule } from '../users/users.module'; // Для UsersService

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: ModuleSchema.name, schema: ModuleSchemaDefinition },
      { name: Lesson.name, schema: LessonSchema },
    ]),
    CacheModule.register(), // Убеждаемся, что кэш доступен
    AuthModule,
    UsersModule,
    forwardRef(() => EnrollmentsModule),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService, MongooseModule],
})
export class CoursesModule {
  constructor() {
    console.log('CoursesModule initialized, imports:', [
      'MongooseModule',
      'CacheModule',
      'AuthModule',
      'UsersModule',
      'EnrollmentsModule',
    ]);
  }
}
