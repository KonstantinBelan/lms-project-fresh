import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { CoursesService } from '../src/courses/courses.service';
import { EnrollmentsService } from '../src/enrollments/enrollments.service';
import { HomeworksService } from '../src/homeworks/homeworks.service';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Course } from '../src/courses/schemas/course.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const coursesService = app.get(CoursesService);
  const enrollmentsService = app.get(EnrollmentsService);
  const homeworksService = app.get(HomeworksService);
  const connection = app.get<Connection>(getConnectionToken());

  console.time('Total database population');

  // Не очищаем коллекции, чтобы сохранить существующие данные
  console.log('Starting population, skipping existing records...');

  // Создание 10,000 студентов
  console.time('Create students');
  for (let i = 0; i < 10000; i++) {
    const email = `student${i}@example.com`;
    const existingUser = await usersService.findByEmail(email);
    if (!existingUser) {
      await usersService.create({
        email,
        password: 'password',
        name: `Student ${i}`,
      });
    }
  }
  console.timeEnd('Create students');

  // Создание 100 курсов с модулями, уроками и домашними заданиями
  console.time('Create courses with modules, lessons, and homeworks');
  const courses: Course[] = [];
  for (let i = 0; i < 100; i++) {
    const title = `Course ${i}`;
    let course = await coursesService.findCourseById(
      (await coursesService.findAllCourses())
        .find((c) => c.title === title)
        ?._id?.toString() || '',
    );
    if (!course) {
      course = await coursesService.createCourse({
        title,
        description: `Description for Course ${i}`,
      });
    }
    courses.push(course);

    // Создание 2 модулей для курса
    for (let j = 0; j < 2; j++) {
      const moduleTitle = `Module ${j} for Course ${i}`;
      let module = await coursesService.findModuleById(
        course.modules
          .find((m) => m.toString() === moduleTitle)
          ?._id?.toString() || '',
      );
      if (!module) {
        module = await coursesService.createModule(course._id.toString(), {
          title: moduleTitle,
        });
      }

      // Создание 2 уроков для модуля
      for (let k = 0; k < 2; k++) {
        const lessonTitle = `Lesson ${k} for Module ${j} in Course ${i}`;
        let lesson = await coursesService.findLessonById(
          module.lessons
            .find((l) => l.toString() === lessonTitle)
            ?._id?.toString() || '',
        );
        if (!lesson) {
          lesson = await coursesService.createLesson(
            course._id.toString(),
            module._id.toString(),
            {
              title: lessonTitle,
              content: `Content for Lesson ${k}`,
            },
          );
        }

        // Создание 1 домашнего задания для урока
        const homeworkDescription = `Homework for Lesson ${k} in Module ${j} of Course ${i}`;
        const existingHomework = await homeworksService.findHomeworksByLesson(
          lesson._id.toString(),
        );
        if (
          !existingHomework.some((hw) => hw.description === homeworkDescription)
        ) {
          await homeworksService.createHomework({
            lessonId: lesson._id.toString(),
            description: homeworkDescription,
            deadline: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            isActive: true,
          });
        }
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
      const existingEnrollment = await enrollmentsService
        .findEnrollmentsByStudent(student._id.toString())
        .then((enrollments) =>
          enrollments.some(
            (e) => e.courseId.toString() === course._id.toString(),
          ),
        );
      if (!existingEnrollment) {
        await enrollmentsService.createEnrollment(
          student._id.toString(),
          course._id.toString(),
          undefined,
          true,
        ); // Пропускаем уведомления
        successfulEnrollments++;
      }
    }
  }
  console.log(`Successfully created ${successfulEnrollments} enrollments`);
  console.timeEnd('Create enrollments');

  console.log('Database populated');
  console.timeEnd('Total database population');

  await app.close();
}

bootstrap();
