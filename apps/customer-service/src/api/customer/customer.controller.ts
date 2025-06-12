import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { ApiBadRequestResponse, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LoginReqDto, RegisterCustomerDto } from './customer.dto';
import { GetCustomer } from '@app/helpers/auth/decorators/get-user.decorator';
import { Customer } from 'libs/entities/customer/customer.entity';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';

@Controller('customers')
@ApiBearerAuth()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('register')
  @ApiResponse({ status: 200, description: 'Customer registered successfully' })
  @ApiBadRequestResponse({ description: 'Customer already exists' })
  public async registerCustomer(@Body() body: RegisterCustomerDto) {
    return this.customerService.registerCustomer(body);
  } 

  @Post('login')
  @ApiResponse({ status: 200, description: 'Customer logged in successfully' })
  @ApiBadRequestResponse({ description: 'Customer not found' })
  public async login(@Body() body: LoginReqDto) {
    return this.customerService.login(body);
  }

  @Get('my-data')
  @ApiResponse({ status: 200, description: 'Customer data retrieved successfully' })
  @ApiBadRequestResponse({ description: 'Customer not found' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER)
  public async getMyData(@GetCustomer() customer: Customer) {
    return this.customerService.getMyData(customer.id);
  }
}
