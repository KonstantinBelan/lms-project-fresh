import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), // Регистрация модели пользователя
    GroupsModule, // Импорт модуля групп для работы с группами
  ],
  controllers: [UsersController], // Контроллеры модуля
  providers: [UsersService], // Сервисы модуля
  exports: [UsersService], // Экспорт сервиса для других модулей
})
export class UsersModule {}
