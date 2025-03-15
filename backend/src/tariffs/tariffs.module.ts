import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { TariffsService } from './tariffs.service';
import { TariffsController } from './tariffs.controller';
import { Tariff, TariffSchema } from './schemas/tariff.schema';

@Module({
  imports: [
    CacheModule.register({ ttl: 600 }), // Кеш на 10 минут
    MongooseModule.forFeature([{ name: Tariff.name, schema: TariffSchema }]), // Регистрация схемы тарифа
  ],
  controllers: [TariffsController], // Контроллеры модуля
  providers: [TariffsService], // Сервисы модуля
  exports: [TariffsService], // Экспорт сервиса для других модулей
})
export class TariffsModule {}
