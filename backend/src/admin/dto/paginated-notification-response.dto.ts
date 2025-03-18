import { ApiProperty } from '@nestjs/swagger';
import { Notification } from '../../notifications/schemas/notification.schema';
import { NotificationResponseDto } from '../../notifications/dto/notification-response.dto';
import { PaginatedFilterTotalDto } from 'src/common/dto/paginated-filter.dto';

export class PaginatedNotificationDto extends PaginatedFilterTotalDto {
  @ApiProperty({
    type: [Notification],
    description: 'Массив записей о зачислении',
  })
  data: Notification[];
}

export class PaginatedNotificationResponseDto extends PaginatedFilterTotalDto {
  @ApiProperty({
    type: [NotificationResponseDto],
    description: 'Массив записей о зачислении',
  })
  data: NotificationResponseDto[];
}
