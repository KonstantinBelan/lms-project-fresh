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
  NotFoundException,
  Logger,
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
  private logger = new Logger('notificationsService');

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
    const notification = await this.notificationsService.createNotification(
      createNotificationDto,
    );
    return notification; // Возвращаем созданное уведомление, а не список
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

  @Post('bulk')
  @ApiOperation({ summary: 'Create a bulk notification' })
  @ApiResponse({
    status: 201,
    description: 'Bulk notification created and sent',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async createBulkNotification(
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    const notification = await this.notificationsService.createBulkNotification(
      createNotificationDto,
    );
    if (!notification) {
      throw new BadRequestException(
        'Failed to create or update bulk notification',
      );
    }
    return notification;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async updateNotification(
    @Param('id') id: string,
    @Body() updateNotificationDto: CreateNotificationDto,
  ) {
    const updatedNotification =
      await this.notificationsService.updateNotification(
        id,
        updateNotificationDto,
      );
    if (!updatedNotification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return updatedNotification;
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
    const notifications =
      await this.notificationsService.findNotificationsByUser(userId);
    if (!notifications.length) {
      this.logger.log(`No notifications found for userId: ${userId}`);
    }
    return notifications;
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send a notification to a single user' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async sendNotificationToUser(
    @Param('id') notificationId: string,
    @Body() body: { userId: string },
  ) {
    const { userId } = body;
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const notification = await this.notificationsService.sendNotificationToUser(
      notificationId,
      userId,
    );
    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }
    return notification;
  }

  @Post(':id/send-bulk')
  @ApiOperation({ summary: 'Send a notification to multiple users' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully to all recipients',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async sendNotificationToBulk(
    @Param('id') notificationId: string,
    @Body() body: { recipientIds?: string[] },
  ) {
    const { recipientIds } = body; // Опционально, если не указано — используем recipients из уведомления
    const notification = await this.notificationsService.sendNotificationToBulk(
      notificationId,
      recipientIds,
    );
    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }
    return notification;
  }
}
