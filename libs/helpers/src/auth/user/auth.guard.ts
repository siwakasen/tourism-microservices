import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard as Guard, IAuthGuard } from '@nestjs/passport';
import { Customer, Employee } from 'libs/entities';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserType } from '../decorators/auth.decorator';
@Injectable()
export class JwtAuthGuard extends Guard('user') implements IAuthGuard {
  constructor(private reflector: Reflector) {
    super();
  }

  public handleRequest(err: unknown, user: Employee | Customer): any { 
    if (err || !user) {
      throw new UnauthorizedException('Invalid token or user not found');
    }
    return user;
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);


    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Handle customer type
    if (requiredRoles.includes(UserType.CUSTOMER)) {
      if(user && !user.role_id) {
        return true;
      }
    }

    // Handle employee types (owner and admin)
    if (user && user.role_id) {
      if (requiredRoles.includes(UserType.OWNER) && user.role_id === 1) {
        return true;
      }
      if (requiredRoles.includes(UserType.ADMIN) && user.role_id === 2) {
        return true;
      }
    }

    return false;
  }
}
