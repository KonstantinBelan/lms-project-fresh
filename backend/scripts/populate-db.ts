import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { CoursesService } from '../src/courses/courses.service';
import { EnrollmentsService } from '../src/enrollments/enrollments.service';
import { HomeworksService } from '../src/homeworks/homeworks.service';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Course } from '../src/courses/schemas/course.schema'; // Импортируем тип Course

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const coursesService = app.get(CoursesService);
  const enrollmentsService = app.get(EnrollmentsService);
  const homeworksService = app.get(HomeworksService);
  const connection = app.get<Connection>(getConnectionToken());

  console.time('Total database population');

  // Очистка всех коллекций
  console.log('Dropping collections...');
  await Promise.all([
    connection.collection('users').drop(),
    connection.collection('courses').drop(),
    connection.collection('enrollments').drop(),
    connection.collection('modules').drop(),
    connection.collection('lessons').drop(),
    connection.collection('homeworks').drop(),
    connection.collection('submissions').drop(),
  ]).catch((err) =>
    console.log('Some collections may not exist:', err.message),
  );
  console.log('Collections dropped');

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

  // Создание 100 курсов с модулями, уроками и домашними заданиями
  console.time('Create courses with modules, lessons, and homeworks');
  const courses: Course[] = []; // Явно указываем тип Course[]
  for (let i = 0; i < 100; i++) {
    const course = await coursesService.createCourse({
      title: `Course ${i}`,
      description: `Description for Course ${i}`,
    });
    courses.push(course);

    // Создание 2 модулей для курса
    for (let j = 0; j < 2; j++) {
      const module = await coursesService.createModule(course._id.toString(), {
        title: `Module ${j} for Course ${i}`,
      });

      // Создание 2 уроков для модуля
      for (let k = 0; k < 2; k++) {
        const lesson = await coursesService.createLesson(
          course._id.toString(),
          module._id.toString(),
          {
            title: `Lesson ${k} for Module ${j} in Course ${i}`,
            content: `Content for Lesson ${k}`,
          },
        );

        // Создание 1 домашнего задания для урока
        await homeworksService.createHomework({
          lessonId: lesson._id.toString(),
          description: `Homework for Lesson ${k} in Module ${j} of Course ${i}`,
          deadline: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(), // Преобразуем Date в строку
          isActive: true,
        });
      }
    }
  }
  console.timeEnd('Create courses with modules, lessons, and homeworks');

  // Создание зачислений
  console.time('Create enrollments');
  const students = await usersService.findAll();
  let successfulEnrollments = 0;
  for (const student of students.slice(0, 1000) as unknown as {
    _id: string;
  }[]) {
    for (const course of courses.slice(0, 10)) {
      await enrollmentsService.createEnrollment(
        student._id.toString(),
        course._id.toString(),
      );
      successfulEnrollments++;
    }
  }
  console.log(`Successfully created ${successfulEnrollments} enrollments`);
  console.timeEnd('Create enrollments');

  console.log('Database populated');
  console.timeEnd('Total database population');

  await app.close();
}

bootstrap();
