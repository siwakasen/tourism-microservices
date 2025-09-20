import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard as Guard, IAuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserType } from '../decorators/auth.decorator';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { AuthHelper } from './auth.helper';

@Injectable()
export class JwtAuthGuard extends Guard('user') implements IAuthGuard {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private authHelper: AuthHelper
  ) {
    super();
  }

  // Ensure Passport gets the right request object for both HTTP and WS
  // so it can extract the token and attach user
  public getRequest(context: ExecutionContext): any {
    if (context.getType() === 'ws') {
      const wsCtx = context.switchToWs();
      const client = wsCtx.getClient<Socket>();
      const data = wsCtx.getData();
      const headers = { ...(client.handshake?.headers || {}) } as Record<
        string,
        string
      >;
      const query = client.handshake?.query || {};

      // Support token via Socket.IO auth or query if Authorization header missing
      if (!headers.authorization && query.token) {
        headers.authorization = `Bearer ${query.token}`;
      }

      return {
        headers,
        query,
        body: data,
        client,
      };
    }
    return context.switchToHttp().getRequest();
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch (e) {
      if (context.getType() === 'ws') {
        throw new WsException('Unauthorized');
      }
      throw e;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const request: any = this.getRequest(context);

    // In WebSocket context, manually attach user to request
    if (context.getType() === 'ws' && !request.user) {
      try {
        // Extract JWT from Authorization header
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const payload = this.jwtService.verify(token);

          // Use injected AuthHelper to get user
          const user = await this.authHelper.validateUser(payload);
          if (user) {
            request.user = user;
          }
          context.switchToWs().getClient().request.user = request.user;
          console.log(
            'WebSocket user:',
            context.switchToWs().getClient().request.user
          );
        }
      } catch (error) {}
    }

    const user = request.user;
    if (!user) {
      if (context.getType() === 'ws') {
        throw new WsException('Unauthorized');
      }
      throw new UnauthorizedException('User not found');
    }

    // Handle customer type
    if (requiredRoles.includes(UserType.CUSTOMER)) {
      if (user && !user.role_id) {
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

    if (context.getType() === 'ws') {
      throw new WsException('Forbidden');
    }
    return false;
  }
}
