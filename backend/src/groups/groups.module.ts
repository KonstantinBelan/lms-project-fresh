// backend/src/groups/groups.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupSchema } from './schemas/group.schema';
import { UsersModule } from '../users/users.module'; // Импортируем UsersModule

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Group', schema: GroupSchema }]), // Модель группы
    forwardRef(() => UsersModule), // Добавляем для доступа к UsersService
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
