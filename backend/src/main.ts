import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { ArrayOrStringValidator } from './validators/array-of-arrays.validator';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Разрешить все источники для тестов, в продакшене уточни домены
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false, // Согласовать с WebSocket
  });
  if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', true); // Включаем дебаг
  }

  // Регистрируем кастомные валидаторы
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Преобразуем данные в типы DTO
      whitelist: true, // Удаляем лишние поля
      forbidNonWhitelisted: true, // Ошибка на лишние поля
    }),
  );
  useContainer(app.select(AppModule), { fallbackOnErrors: true }); // Для DI кастомных валидаторов

  const config = new DocumentBuilder()
    .setTitle('Deasy LMS API')
    .setDescription(
      'API для управления курсами, зачислениями и домашними заданиями',
    )
    .setVersion('1.0')
    // .addBearerAuth()
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth', // Имя для авторизации в Swagger
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log('Server running on port 3000 with WebSocket support');
}
bootstrap();
