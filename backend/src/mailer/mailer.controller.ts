import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiBody,
} from '@nestjs/swagger';
import { MailerService } from './mailer.service';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { BulkMailDto } from './dto/bulk-mail.dto';
import { Logger } from '@nestjs/common';

@ApiTags('Рассылки')
@Controller('mailer')
export class MailerController {
  private readonly logger = new Logger(MailerController.name);

  constructor(private readonly mailerService: MailerService) {}

  @Post('bulk')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Массовая рассылка писем' })
  @ApiBody({ type: BulkMailDto, description: 'Данные для массовой рассылки' })
  @ApiResponse({
    status: 202,
    description: 'Рассылка поставлена в очередь',
    content: {
      'application/json': {
        example: { message: 'Рассылка поставлена в очередь' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
    type: ErrorResponseDto,
    content: {
      'application/json': {
        example: { statusCode: 401, message: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Внутренняя ошибка сервера',
    type: ErrorResponseDto,
    content: {
      'application/json': {
        example: { statusCode: 500, message: 'Internal server error' },
      },
    },
  })
  async sendBulkMail(@Body(ValidationPipe) body: BulkMailDto) {
    this.logger.log(
      `Получен запрос на массовую рассылку для ${body.recipients.length} получателей`,
    );

    try {
      await this.mailerService.sendBulkMail(
        body.recipients,
        body.subject,
        body.template,
      );
      this.logger.log('Рассылка успешно поставлена в очередь');
      return { message: 'Рассылка поставлена в очередь' };
    } catch (error) {
      this.logger.error(
        `Ошибка при постановке рассылки в очередь: ${error.message}`,
      );
      throw error;
    }
  }
}
