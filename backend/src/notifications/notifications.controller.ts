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
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { Role } from '../auth/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
// import { MailerService } from '../mailer/mailer.service'; // Добавляем MailerService

// Тип для запроса с пользователем из JWT
interface RequestWithUser extends Request {
  user: { sub?: string; _id?: string };
}

@ApiTags('Уведомления')
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  private logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    // private readonly mailerService: MailerService, // Добавляем MailerService
  ) {}

  @Post()
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Создание нового уведомления' })
  @ApiResponse({
    status: 201,
    description: 'Уведомление успешно создано',
    type: CreateNotificationDto,
  })
  @ApiResponse({ status: 400, description: 'Неверный запрос' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    this.logger.log(
      `Создание уведомления: ${JSON.stringify(createNotificationDto)}`,
    );
    const notification = await this.notificationsService.createNotification(
      createNotificationDto,
    );
    this.logger.log(`Уведомление создано: ${notification._id}`);
    return notification;
  }

  @Put(':id/read')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Отметить уведомление как прочитанное' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор уведомления',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Уведомление отмечено как прочитанное',
  })
  @ApiResponse({ status: 404, description: 'Уведомление не найдено' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
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
    this.logger.log(`Отметка уведомления ${id} как прочитанного`);
    const result = await this.notificationsService.markAsRead(id);
    if (!result) {
      this.logger.warn(`Уведомление ${id} не найдено`);
      throw new NotFoundException(`Уведомление ${id} не найдено`);
    }
    return result;
  }

  @Delete(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Удалить уведомление' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор уведомления',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Уведомление удалено',
    schema: {
      example: { message: 'Уведомление удалено' },
    },
  })
  @ApiResponse({ status: 404, description: 'Уведомление не найдено' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.STUDENT, Role.ADMIN, Role.MANAGER])
  async delete(@Param('id') id: string) {
    this.logger.log(`Удаление уведомления ${id}`);
    await this.notificationsService.deleteNotification(id);
    return { message: 'Уведомление удалено' };
  }

  // @Post('test-email')
  // @ApiOperation({ summary: 'Отправить тестовое email-уведомление' })
  // @ApiBody({
  //   schema: {
  //     example: {
  //       userId: '507f1f77bcf86cd799439011',
  //       message: 'Тестовое сообщение',
  //     },
  //   },
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Тестовое email успешно отправлено',
  // })
  // @ApiResponse({ status: 400, description: 'Неверный запрос' })
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @SetMetadata('roles', [Role.ADMIN])
  // async testEmail(@Body() body: { userId: string; message: string }) {
  //   const { userId, message } = body;
  //   this.logger.log(`Отправка тестового email пользователю ${userId}`);
  //   await this.mailerService.sendInstantMail(
  //     userId,
  //     'Тестовое письмо',
  //     'welcome',
  //     { name: 'User', message },
  //   );
  //   this.logger.log(`Тестовое email отправлено пользователю ${userId}`);
  //   return { status: 'success', message: 'Тестовое email успешно отправлено' };
  // }

  @Post('test-telegram')
  @ApiOperation({ summary: 'Отправить тестовое Telegram-уведомление' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Привет, это тестовое сообщение для Telegram!',
          description: 'Сообщение для отправки в Telegram',
        },
      },
      required: ['message'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Сообщение Telegram отправлено',
    content: {
      'application/json': {
        example: { message: 'Telegram-уведомление отправлено' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос - отсутствует сообщение или userId',
  })
  @ApiSecurity('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  async testTelegram(
    @Req() req: RequestWithUser,
    @Body() body: { message: string },
  ) {
    const userId = req.user?.sub || req.user?._id;
    const { message } = body;

    if (!userId) {
      this.logger.warn('Идентификатор пользователя не найден в токене');
      throw new BadRequestException(
        'Идентификатор пользователя не найден в токене',
      );
    }

    if (!message || message.trim() === '') {
      this.logger.warn(
        `Отсутствует или пустое сообщение для пользователя ${userId}`,
      );
      throw new BadRequestException('Сообщение обязательно для отправки');
    }

    this.logger.log(
      `Отправка тестового Telegram пользователю ${userId} с сообщением: "${message}"`,
    );
    await this.notificationsService.sendTelegram(userId, message);
    this.logger.log(
      `Тестовое Telegram успешно отправлено пользователю ${userId}`,
    );
    return { message: 'Telegram-уведомление отправлено' };
  }

  @Post('test-sms')
  @ApiOperation({ summary: 'Отправить тестовое SMS-уведомление' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
          description: 'Идентификатор пользователя',
        },
        message: {
          type: 'string',
          example: 'Привет, это тестовое SMS!',
          description: 'Сообщение для отправки через SMS',
        },
      },
      required: ['userId', 'message'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Тестовое SMS успешно отправлено',
    content: {
      'application/json': {
        example: {
          status: 'success',
          message: 'Тестовое SMS успешно отправлено',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос - отсутствует userId или сообщение',
  })
  @ApiSecurity('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN])
  async testSMS(@Body() body: { userId: string; message: string }) {
    const { userId, message } = body;

    if (!userId) {
      this.logger.warn('Отсутствует userId в теле запроса');
      throw new BadRequestException(
        'Требуется идентификатор пользователя (userId)',
      );
    }

    if (!message || message.trim() === '') {
      this.logger.warn(
        `Отсутствует или пустое сообщение для пользователя ${userId}`,
      );
      throw new BadRequestException('Сообщение обязательно для отправки');
    }

    this.logger.log(
      `Отправка тестового SMS пользователю ${userId} с сообщением: "${message}"`,
    );
    await this.notificationsService.sendSMS(userId, message);
    this.logger.log(`Тестовое SMS успешно отправлено пользователю ${userId}`);
    return { status: 'success', message: 'Тестовое SMS успешно отправлено' };
  }

  @Post('bulk')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Создать массовое уведомление' })
  @ApiResponse({
    status: 201,
    description: 'Массовое уведомление создано и отправлено',
  })
  @ApiResponse({ status: 400, description: 'Неверный запрос' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async createBulkNotification(
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    this.logger.log(
      `Создание массового уведомления: ${JSON.stringify(createNotificationDto)}`,
    );
    const notification = await this.notificationsService.createBulkNotification(
      createNotificationDto,
    );
    if (!notification) {
      this.logger.error('Не удалось создать или обновить массовое уведомление');
      throw new BadRequestException(
        'Не удалось создать или обновить массовое уведомление',
      );
    }
    this.logger.log(`Массовое уведомление создано: ${notification._id}`);
    return notification;
  }

  @Put(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Обновить уведомление' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор уведомления',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Уведомление обновлено' })
  @ApiResponse({ status: 404, description: 'Уведомление не найдено' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async updateNotification(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    this.logger.log(
      `Обновление уведомления ${id}: ${JSON.stringify(updateNotificationDto)}`,
    );
    const updatedNotification =
      await this.notificationsService.updateNotification(
        id,
        updateNotificationDto,
      );
    if (!updatedNotification) {
      this.logger.warn(`Уведомление ${id} не найдено`);
      throw new NotFoundException(`Уведомление с ID ${id} не найдено`);
    }
    this.logger.log(`Уведомление обновлено: ${id}`);
    return updatedNotification;
  }

  @Get('user/:userId')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить уведомления по ID пользователя' })
  @ApiParam({
    name: 'userId',
    description: 'Идентификатор пользователя',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Уведомления успешно получены',
  })
  @ApiResponse({ status: 404, description: 'Уведомления не найдены' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async findByUser(@Param('userId') userId: string) {
    this.logger.log(`Получение уведомлений для пользователя ${userId}`);
    const notifications =
      await this.notificationsService.findNotificationsByUser(userId);
    if (!notifications.length) {
      this.logger.log(`Уведомления для пользователя ${userId} не найдены`);
    }
    return notifications;
  }

  @Post(':id/send')
  @ApiSecurity('JWT-auth')
  @HttpCode(200)
  @ApiOperation({ summary: 'Отправить уведомление одному пользователю' })
  @ApiBody({
    description: 'Идентификатор пользователя для отправки уведомления',
    type: SendNotificationDto,
    examples: {
      example1: {
        value: {
          userId: '67c92217f30e0a8bcd56bf86',
        },
        summary: 'Пример тела запроса',
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор уведомления',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description:
      'Уведомление успешно поставлено в очередь для отправки пользователю',
    type: CreateNotificationDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос - некорректные данные уведомления',
  })
  @ApiResponse({ status: 404, description: 'Уведомление не найдено' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async sendNotificationToUser(
    @Param('id') notificationId: string,
    @Body() sendNotificationDto: SendNotificationDto, // Используем DTO
  ) {
    const { userId } = sendNotificationDto; // Теперь body типизировано
    this.logger.log(
      `Отправка уведомления ${notificationId} пользователю ${userId}`,
    );
    const notification = await this.notificationsService.sendNotificationToUser(
      notificationId,
      userId,
    );
    if (!notification) {
      this.logger.warn(`Уведомление ${notificationId} не найдено`);
      throw new NotFoundException(
        `Уведомление с ID ${notificationId} не найдено`,
      );
    }
    this.logger.log(
      `Уведомление ${notificationId} отправлено пользователю ${userId}`,
    );
    return notification;
  }

  @Post(':id/send-bulk')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Отправить уведомление нескольким пользователям' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор уведомления',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Уведомление успешно отправлено всем получателям',
  })
  @ApiResponse({ status: 400, description: 'Неверный запрос' })
  @ApiResponse({ status: 404, description: 'Уведомление не найдено' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async sendNotificationToBulk(
    @Param('id') notificationId: string,
    @Body() body: { recipientIds?: string[] },
  ) {
    const { recipientIds } = body;
    this.logger.log(
      `Отправка массового уведомления ${notificationId} для ${recipientIds?.length || 'всех'} получателей`,
    );
    const notification = await this.notificationsService.sendNotificationToBulk(
      notificationId,
      recipientIds,
    );
    if (!notification) {
      this.logger.warn(`Уведомление ${notificationId} не найдено`);
      throw new NotFoundException(
        `Уведомление с ID ${notificationId} не найдено`,
      );
    }
    this.logger.log(`Массовое уведомление ${notificationId} отправлено`);
    return notification;
  }
}
