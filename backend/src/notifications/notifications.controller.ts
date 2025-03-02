import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student']) // Доступ только для студентов
  @UsePipes(new ValidationPipe())
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(
      createNotificationDto.userId,
      createNotificationDto.message,
    );
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student']) // Доступ только для студентов
  async findByUser(@Param('userId') userId: string) {
    return this.notificationsService.findNotificationsByUser(userId);
  }

  @Put(':id/read')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student']) // Доступ только для студентов
  @UsePipes(new ValidationPipe())
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student']) // Доступ только для студентов
  async delete(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }
}
