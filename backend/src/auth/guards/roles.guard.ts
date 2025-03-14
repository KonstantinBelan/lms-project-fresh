import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Интерфейс пользователя в запросе
interface RequestUser {
  _id: string;
  email: string;
  roles: Role[];
}

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      this.logger.debug('Роли не указаны, доступ разрешен');
      return true; // Если роли не указаны, доступ разрешен
    }

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user || !user.roles) {
      this.logger.warn('Пользователь не аутентифицирован или роли отсутствуют');
      return false;
    }

    this.logger.debug(
      `Проверка ролей: требуется [${requiredRoles}], у пользователя [${user.roles}]`,
    );
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      this.logger.warn(`Доступ запрещен: недостаточно прав для ${user.email}`);
    } else {
      this.logger.debug(`Доступ разрешен для ${user.email}`);
    }
    return hasRole;
  }
}
