import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StreamsService } from './streams.service';
import { StreamsController } from './streams.controller';
import { Stream, StreamSchema } from './schemas/stream.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Stream.name, schema: StreamSchema }]), // Регистрация схемы потока в Mongoose
  ],
  controllers: [StreamsController], // Контроллеры модуля
  providers: [StreamsService], // Сервисы модуля
  exports: [StreamsService], // Экспорт сервиса для использования в других модулях
})
export class StreamsModule {}
