import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

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

  const config = new DocumentBuilder()
    .setTitle('Deasy LMS API')
    .setDescription(
      'API для управления курсами, зачислениями и домашними заданиями',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log('Server running on port 3000 with WebSocket support');
}
bootstrap();
