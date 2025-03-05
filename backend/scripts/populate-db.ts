import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { CoursesService } from '../src/courses/courses.service';
import { EnrollmentsService } from '../src/enrollments/enrollments.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const coursesService = app.get(CoursesService);
  const enrollmentsService = app.get(EnrollmentsService);

  // Создание 10,000 студентов
  for (let i = 0; i < 10000; i++) {
    await usersService.create({
      email: `student${i}@example.com`,
      password: 'password',
      name: `Student ${i}`,
    });
  }

  // Создание 100 курсов
  for (let i = 0; i < 100; i++) {
    await coursesService.createCourse({
      title: `Course ${i}`,
      description: `Description for Course ${i}`,
    });
  }

  // Создание зачислений
  const students = await usersService.findAll();
  const courses = await coursesService.findAllCourses();
  for (const student of students.slice(0, 1000) as unknown as {
    _id: string;
  }[]) {
    // Двойное приведение через unknown
    for (const course of courses.slice(0, 10)) {
      await enrollmentsService.createEnrollment(
        student._id.toString(),
        course._id.toString(),
      );
    }
  }

  console.log('Database populated');
  await app.close();
}

bootstrap();
