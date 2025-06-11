import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Employee } from 'libs/entities/employees';

export const GetEmployee = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Employee => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
); 