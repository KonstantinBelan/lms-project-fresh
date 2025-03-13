import { HttpException, HttpStatus } from '@nestjs/common';

// Исключение для случая, когда студент уже зачислен на курс
export class AlreadyEnrolledException extends HttpException {
  constructor() {
    super('Студент уже зачислен на этот курс', HttpStatus.CONFLICT);
  }
}
