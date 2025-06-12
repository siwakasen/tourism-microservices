import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Customer } from 'libs/entities/customer/customer.entity';
import { Employee } from 'libs/entities/employees';

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