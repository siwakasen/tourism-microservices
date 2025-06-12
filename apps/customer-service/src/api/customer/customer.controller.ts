import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { ApiBadRequestResponse, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LoginReqDto, RegisterCustomerDto, requestResetPasswordDto } from './customer.dto';
import { GetCustomer } from '@app/helpers/auth/decorators/get-user.decorator';
import { Customer } from 'libs/entities/customer/customer.entity';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { ResetPasswordDto } from 'apps/employees-service/src/api/employees/employees.dto';

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

  @Post('request-reset-password')
  @ApiResponse({ status: 200, description: 'Link to reset password has been sent to your email' })
  @ApiBadRequestResponse({ description: 'Customer not found' })
  public async requestResetPassword(@Body() body: requestResetPasswordDto) {
    return this.customerService.requestResetPassword(body);
  }

  @Post('change-password')
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiBadRequestResponse({ description: 'Token Invalid' })
  public async changePassword(@Body() body: ResetPasswordDto) {
    return this.customerService.changePassword(body);
  }

  @Post('register-via-grpc')
  @ApiResponse({ status: 200, description: 'Customer registered successfully' })
  @ApiBadRequestResponse({ description: 'Customer already exists' })
  public async registerViaGrpc(@Body() body: RegisterCustomerDto) {
    try {
      return this.customerService.registerCustomerGrpc(body);
    } catch (error) {
      throw error;
    }
  }
}
