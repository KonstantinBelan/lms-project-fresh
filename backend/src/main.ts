import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Разрешить все источники для тестов, в продакшене уточни домены
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false, // Согласовать с WebSocket
  });
  await app.listen(3000);
  console.log('Server running on port 3000 with WebSocket support');
}
bootstrap();
