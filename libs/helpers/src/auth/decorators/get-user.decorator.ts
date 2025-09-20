import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Customer, Employee } from 'libs/entities';

export const GetEmployee = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Employee => {
    if (ctx.getType() === 'ws') {
      // For WebSocket context, get the request from the guard
      const wsCtx = ctx.switchToWs();
      const client = wsCtx.getClient();
      const request = (client as any).request || {};

      return request.user;
    }

    // For HTTP context
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

export const GetCustomer = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Customer => {
    if (ctx.getType() === 'ws') {
      // For WebSocket context, get the request from the guard
      const wsCtx = ctx.switchToWs();
      const client = wsCtx.getClient();
      const request = (client as any).request || {};
      return request.user;
    }

    // For HTTP context
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
