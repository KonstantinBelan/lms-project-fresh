import { PartialType } from '@nestjs/class-transformer';
import { CreateHomeworkDto } from './create-homework.dto';

export class UpdateHomeworkDto extends PartialType(CreateHomeworkDto) {}
