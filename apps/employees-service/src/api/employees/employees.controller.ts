import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  LoginReqDto,
  LoginResponseDto,
  PaginationEmployeeDto,
  RegisterOwnerDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  requestResetPasswordDto,
  ResetPasswordDto,
  TokenDto,
  AvailableEmployeesDto,
} from './employees.dto';
import { EmployeeService } from './employees.service';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import {
  GetCustomer,
  GetEmployee,
} from '@app/helpers/auth/decorators/get-user.decorator';

@ApiTags('Employee Controller')
@ApiBearerAuth()
@Controller('employees')
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  @ApiResponse({ status: 200, description: 'Token valid' })
  @ApiBadRequestResponse({ description: 'Token Invalid' })
  @Post('register-owner')
  private async registerOwner(@Body() body: RegisterOwnerDto) {
    return await this.service.registerOwner(body);
  }

  @ApiResponse({ status: 201, description: 'Success change Password' })
  @ApiBadRequestResponse({
    description: 'Token Invalid OR password not strong enough',
  })
  @Post('change-password')
  private async resetPassword(@Body() body: ResetPasswordDto) {
    return await this.service.changePassword(body);
  }

  @ApiResponse({
    status: 200,
    description: 'Success Login.',
    type: LoginResponseDto,
  })
  @Post('login')
  @HttpCode(200)
  private async login(@Body() body: LoginReqDto) {
    const response = await this.service.login(body);
    return response;
  }

  @Post('forget-password')
  async requestResetPasswords(@Body() body: requestResetPasswordDto) {
    await this.service.requestResetPassword(body);
    return { message: 'Email sent successfully!' };
  }

  @Get()
  @Roles(UserType.OWNER)
  @UseGuards(JwtAuthGuard)
  public async getAllEmployees(@Query() query: PaginationEmployeeDto) {
    console.log(query);
    return await this.service.getAllEmployees(query);
  }

  @Get('me')
  @Roles(UserType.OWNER, UserType.ADMIN)
  @UseGuards(JwtAuthGuard)
  public async getMyProfile(@GetEmployee() employee) {
    return await this.service.getEmployeeById(employee.id);
  }

  @Get('available')
  @Roles(UserType.OWNER, UserType.ADMIN)
  @UseGuards(JwtAuthGuard)
  public async getAvailableEmployees(@Query() query: AvailableEmployeesDto) {
    return await this.service.getAvailableEmployees(query);
  }

  @Get(':id')
  @Roles(UserType.OWNER)
  @UseGuards(JwtAuthGuard)
  public async getEmployeeById(@Param('id') id: number) {
    return await this.service.getEmployeeById(id);
  }

  @Post('')
  @Roles(UserType.OWNER)
  @UseGuards(JwtAuthGuard)
  public async createEmployee(@Body() body: CreateEmployeeDto) {
    return await this.service.createEmployee(body);
  }

  @Patch(':id')
  @Roles(UserType.OWNER)
  @UseGuards(JwtAuthGuard)
  public async updateEmployee(
    @Param('id') id: number,
    @Body() body: UpdateEmployeeDto,
  ) {
    if (Object.keys(body).length === 0) {
      throw new HttpException(
        'Request body cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.service.updateEmployee(id, body);
  }

  @Delete(':id')
  @Roles(UserType.OWNER)
  @UseGuards(JwtAuthGuard)
  public async deleteEmployee(@Param('id') id: number) {
    return await this.service.deleteEmployee(id);
  }

  @Post('verify-token')
  public async verifyToken(@Body() body: TokenDto) {
    return await this.service.verifyToken(body.token);
  }
}
