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
import { Role } from '../auth/roles.enum';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(
      createNotificationDto.userId,
      createNotificationDto.message,
    );
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async findByUser(@Param('userId') userId: string) {
    return this.notificationsService.findNotificationsByUser(userId);
  }

  @Put(':id/read')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  @UsePipes(new ValidationPipe())
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.STUDENT, Role.ADMIN, Role.MANAGER])
  async delete(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }

  @Post('test-email')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN]) // Ограничиваем доступ только для администратора
  async testEmail(@Body() body: { userId: string; message: string }) {
    const { userId, message } = body;
    await this.notificationsService.sendEmail(userId, message);
    return { status: 'success', message: 'Test email sent successfully' };
  }

  @Post('test-telegram')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN]) // Ограничиваем доступ только для администратора
  async testTelegram(@Body() body: { message: string }) {
    const { message } = body;
    await this.notificationsService.sendTelegram(message);
    return { status: 'success', message: 'Test Telegram sent successfully' };
  }

  @Post('test-sms')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN]) // Ограничиваем доступ только для администратора
  async testSMS(@Body() body: { userId: string; message: string }) {
    const { userId, message } = body;
    await this.notificationsService.sendSMS(userId, message);
    return { status: 'success', message: 'Test SMS sent successfully' };
  }
}
