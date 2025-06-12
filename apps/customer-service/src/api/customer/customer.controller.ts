import { Controller, Get, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('customers')
@ApiBearerAuth()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @Roles(UserType.CUSTOMER)
  @UseGuards(AuthGuard('user'))
  getHello(): string {
    return this.customerService.getHello();
  }
}
