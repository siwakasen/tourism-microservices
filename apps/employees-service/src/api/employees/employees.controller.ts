import {
  Body,
  Controller,
  Get,
  Post,
  Request,
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
  RegisterDto,
  requestResetPasswordDto,
  ResetPasswordDto,
  TokenDto,
} from './employees.dto';
import { EmployeeService } from './employees.service';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';

@ApiTags('Employee Controller')
@ApiBearerAuth() 
@Controller('employees')
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  @ApiResponse({ status: 200, description: 'Token valid' })
  @ApiBadRequestResponse({ description: 'Token Invalid' })
  @Post('verify-token')
  private async verifyToken(@Body() body: TokenDto): Promise<boolean> {
    return await this.service.verifyToken(body.token);
  }

  @ApiResponse({ status: 200, description: 'Token valid' })
  @ApiBadRequestResponse({ description: 'Token Invalid' })
  @Post('register')
  private async register(@Body() body: RegisterDto) {
    return await this.service.register(body);
  }

  @ApiResponse({ status: 201, description: 'Success change Password' })
  @ApiBadRequestResponse({
    description: 'Token Invalid OR password not strong enough',
  })
  @Post('reset-password')
  private async resetPassword(@Body() body: ResetPasswordDto) {
    return await this.service.changePassword(body);
  }

  @ApiResponse({
    status: 200,
    description: 'Success Login.',
    type: LoginResponseDto,
  })
  @Post('login')
  private async login(@Body() body: LoginReqDto) {
    const response = await this.service.login(body);
    return response;
  }

  @Get('test')
  @Roles(UserType.OWNER, UserType.ADMIN)
  @UseGuards(JwtAuthGuard)
  private async test(@Request() req: any): Promise<void> {
    console.log("test: ", req.user);
  }

  @Get('test2')
  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard)
  private async test2(@Request() req: any): Promise<void> {
    console.log("test2: ", req.user);
  }

  @Post('request-reset-password')
  async requestResetPasswords(@Body() body: requestResetPasswordDto) {
    await this.service.requestResetPassword(body);
    return { message: 'Email sent successfully!' };
  }
}
