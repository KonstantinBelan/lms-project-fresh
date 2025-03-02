import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IRolesGuard } from './roles.guard.interface';

@Injectable()
export class RolesGuard extends AuthGuard('jwt') implements IRolesGuard {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: any): boolean | Promise<boolean> {
    const activate = super.canActivate(context);
    if (!activate) {
      return false;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    return roles.some((role) => user?.role === role);
  }
}
