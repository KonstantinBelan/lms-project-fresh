import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '../roles.enum';

@Injectable()
export class RolesGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const activate = super.canActivate(context);

    if (!activate) {
      return false;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ['roles'],
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('Checking roles:', { userRoles: user?.roles, requiredRoles });

    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}
