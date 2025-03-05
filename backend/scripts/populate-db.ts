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

  console.time('Total database population'); // Начало замера общего времени

  // Создание 10,000 студентов
  console.time('Create students');
  for (let i = 0; i < 10000; i++) {
    await usersService.create({
      email: `student${i}@example.com`,
      password: 'password',
      name: `Student ${i}`,
    });
  }
  console.timeEnd('Create students');

  // Создание 100 курсов
  console.time('Create courses');
  for (let i = 0; i < 100; i++) {
    await coursesService.createCourse({
      title: `Course ${i}`,
      description: `Description for Course ${i}`,
    });
  }
  console.timeEnd('Create courses');

  // Создание зачислений
  console.time('Create enrollments');
  const students = await usersService.findAll();
  const courses = await coursesService.findAllCourses();
  for (const student of students.slice(0, 1000) as unknown as {
    _id: string;
  }[]) {
    for (const course of courses.slice(0, 10)) {
      await enrollmentsService.createEnrollment(
        student._id.toString(),
        course._id.toString(),
      );
    }
  }
  console.timeEnd('Create enrollments');

  console.log('Database populated');
  console.timeEnd('Total database population'); // Конец замера общего времени

  await app.close();
}

bootstrap();
