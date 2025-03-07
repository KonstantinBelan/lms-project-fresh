import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Request,
  Req,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  SetMetadata,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Role } from '../auth/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

// Определяем тип RequestWithUser
interface RequestWithUser extends Request {
  user: { sub?: string; _id?: string }; // Тип зависит от твоего JWT payload
}

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
  @ApiOperation({ summary: 'Test Telegram notification' })
  @ApiResponse({ status: 200, description: 'Telegram message sent' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async testTelegram(
    @Req() req: RequestWithUser,
    @Body() body: { message: string },
  ) {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }
    await this.notificationsService.sendTelegram(userId, body.message);
    return { message: 'Telegram notification sent' };
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
