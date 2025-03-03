import { PartialType } from 'class-transformer';
import { CreateHomeworkDto } from './create-homework.dto';

export class UpdateHomeworkDto extends PartialType(CreateHomeworkDto) {}
