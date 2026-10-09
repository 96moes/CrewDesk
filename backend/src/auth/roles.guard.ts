// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole, User } from '../users/entities/user.entity';
import { ROLES_KEY } from './roles.decorator';

// Extend the Express Request type to include the user property
interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true; // no role restriction
    }
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user } = request;
    return requiredRoles.includes(user.role);
  }
}
