import { SetMetadata } from '@nestjs/common';
import { Role } from '../roles.enum';

// Ключ для хранения ролей в метаданных
export const ROLES_KEY = 'roles';

// Декоратор для указания требуемых ролей
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
