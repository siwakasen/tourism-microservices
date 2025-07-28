import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import {
  LoginReqDto,
  LoginResDto,
  RegisterCustomerDto,
  requestResetPasswordDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
  UploadIdentityFileDto,
} from './customer.dto';
import { GetCustomer } from '@app/helpers/auth/decorators/get-user.decorator';
import { Customer } from 'libs/entities';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { diskStorage } from 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';

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

  @ApiBody({
    type: UploadIdentityFileDto,
  })
  @Post('upload-identity-file')
  @ApiResponse({
    status: 200,
    description: 'Identity file uploaded successfully',
  })
  @UseInterceptors(
    FilesInterceptor('identity-file', 2, {
      storage: diskStorage({
        destination: './dist/apps/customer-service/public/identity-files',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new HttpException(
              {
                message: ['Invalid file type. Only images are allowed.'],
                error: 'Not Acceptable',
                statusCode: HttpStatus.NOT_ACCEPTABLE,
              },
              HttpStatus.NOT_ACCEPTABLE,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER)
  @ApiConsumes('multipart/form-data')
  public async uploadIdentityFile(
    @GetCustomer() customer: Customer,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (files.length < 2) {
      return {
        message: 'Please upload both the driver license and identity card',
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
    return this.customerService.uploadIdentityFile(files, customer.id);
  }

  @Post('login')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Customer logged in successfully' })
  @ApiBadRequestResponse({ description: 'Customer not found' })
  public async login(@Body() body: LoginReqDto): Promise<LoginResDto> {
    return this.customerService.login(body);
  }

  @Get('me')
  @ApiResponse({
    status: 200,
    description: 'Customer data retrieved successfully',
  })
  @ApiBadRequestResponse({ description: 'Customer not found' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER)
  public async getMyData(@GetCustomer() customer: Customer) {
    return this.customerService.getCustomerById(customer.id);
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Customer data retrieved successfully',
  })
  @ApiBadRequestResponse({ description: 'Customer not found' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  public async getCustomerById(@Param('id') id: number) {
    return this.customerService.getCustomerById(id);
  }

  @Post('forgot-password')
  @ApiResponse({
    status: 200,
    description: 'Link to reset password has been sent to your email',
  })
  @ApiBadRequestResponse({ description: 'Customer not found' })
  public async requestResetPassword(@Body() body: requestResetPasswordDto) {
    return this.customerService.requestResetPassword(body);
  }

  @Post('change-password')
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Token Invalid' })
  public async changePassword(@Body() body: ResetPasswordRequestDto) {
    return this.customerService.changePassword(body);
  }
}
