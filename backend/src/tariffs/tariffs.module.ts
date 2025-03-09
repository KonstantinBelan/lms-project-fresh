// src/tariffs/tariffs.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TariffsService } from './tariffs.service';
import { TariffsController } from './tariffs.controller';
import { Tariff, TariffSchema } from './schemas/tariff.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tariff.name, schema: TariffSchema }]),
  ],
  controllers: [TariffsController],
  providers: [TariffsService],
  exports: [TariffsService],
})
export class TariffsModule {}
