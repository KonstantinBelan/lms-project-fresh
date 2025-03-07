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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created',
    type: CreateNotificationDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
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
  @ApiOperation({ summary: 'Get notifications by user ID' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Notifications not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted',
    schema: {
      example: { message: 'Notification deleted' },
    },
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.STUDENT, Role.ADMIN, Role.MANAGER])
  async delete(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }

  @Post('test-email')
  @ApiOperation({ summary: 'Send a test email notification' })
  @ApiResponse({
    status: 200,
    description: 'Test email sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN]) // Ограничиваем доступ только для администратора
  async testEmail(@Body() body: { userId: string; message: string }) {
    const { userId, message } = body;
    await this.notificationsService.sendEmail(userId, 'Test Email', message);
    return { status: 'success', message: 'Test email sent successfully' };
  }

  @Post('test-telegram')
  @ApiOperation({ summary: 'Send a test Telegram notification' })
  @ApiResponse({
    status: 200,
    description: 'Test Telegram sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN]) // Ограничиваем доступ только для администратора
  async testTelegram(@Body() body: { message: string }) {
    const { message } = body;
    await this.notificationsService.sendTelegram(message);
    return { status: 'success', message: 'Test Telegram sent successfully' };
  }

  @Post('test-sms')
  @ApiOperation({ summary: 'Send a test SMS notification' })
  @ApiResponse({
    status: 200,
    description: 'Test SMS sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN]) // Ограничиваем доступ только для администратора
  async testSMS(@Body() body: { userId: string; message: string }) {
    const { userId, message } = body;
    await this.notificationsService.sendSMS(userId, message);
    return { status: 'success', message: 'Test SMS sent successfully' };
  }
}
