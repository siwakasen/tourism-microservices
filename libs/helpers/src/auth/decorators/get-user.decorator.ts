import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Customer, Employee } from 'libs/entities';

export const GetEmployee = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Employee => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
); 


export const GetCustomer = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Customer => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
); 