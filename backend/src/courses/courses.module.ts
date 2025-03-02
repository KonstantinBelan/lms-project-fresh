import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schemas/course.schema';
import {
  Module as ModuleSchema,
  ModuleSchema as ModuleSchemaDefinition,
} from './schemas/module.schema';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { AuthModule } from '../auth/auth.module'; // Добавляем AuthModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: ModuleSchema.name, schema: ModuleSchemaDefinition },
      { name: Lesson.name, schema: LessonSchema },
    ]),
    AuthModule, // Импортируем для RolesGuard
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
