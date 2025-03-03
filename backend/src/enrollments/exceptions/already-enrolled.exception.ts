import { HttpException, HttpStatus } from '@nestjs/common';

export class AlreadyEnrolledException extends HttpException {
  constructor() {
    super('Student is already enrolled in this course', HttpStatus.CONFLICT);
  }
}
