import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MailerService } from './mailer.service';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { BulkMailDto } from './dto/bulk-mail.dto';

@ApiTags('Mailer')
@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Post('bulk')
  @ApiOperation({ summary: 'Массовая рассылка писем' })
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
  async sendBulkMail(
    @Body(ValidationPipe) body: BulkMailDto, // Используем ValidationPipe для валидации
  ) {
    await this.mailerService.sendBulkMail(
      body.recipients,
      body.subject,
      body.template,
    );
    return { message: 'Рассылка поставлена в очередь' };
  }
}
