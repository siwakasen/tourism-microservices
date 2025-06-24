import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { AssignEmployeeDto, BookingRegisterReqDto, BookingRegisterResDto, BookingReqDto, BookingResDto, PaginationDto } from './booking.dto';
import { GetCustomer } from '@app/helpers/auth/decorators/get-user.decorator';
import { Customer } from 'libs/entities'; 
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from '../payments/payment.service';
import { ApiTags } from '@nestjs/swagger';


@ApiTags('Booking Controller')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService, private readonly paymentService: PaymentService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER)
  async getBookings(@GetCustomer() customer: Customer, @Query() query: PaginationDto) : Promise<BookingResDto>  {
   return this.bookingService.getBookings(customer.id, query);
  }

  @Get('/all')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  async getAllBookings(@Query() query: PaginationDto) : Promise<BookingResDto> {
    return this.bookingService.getAllBookings(query);
  }

  private bookingValidation(payload: BookingReqDto) {
    
    if(!payload.package_id && !payload.car_id){
      throw new HttpException('Package or car is required', HttpStatus.BAD_REQUEST);
    }
    if(payload.package_id && payload.car_id){
      throw new HttpException('Cannot booking both package and car at the same time', HttpStatus.BAD_REQUEST);
    }

    if(payload.package_id && !payload.number_of_persons){
      throw new HttpException('Number of persons is required', HttpStatus.BAD_REQUEST);
    }

  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER)
  async bookingWithoutRegister(@Body() body: BookingReqDto, @GetCustomer() customer: Customer)  {
    this.bookingValidation(body);
    return this.bookingService.createBooking(body, customer, false);
  }

  @Post('/and-register')
  async bookingWithRegister(@Body() body: BookingRegisterReqDto) : Promise<BookingRegisterResDto> {
    this.bookingValidation(body);

      const {token, customer_id} = await this.bookingService.registerCustomerGrpc(body);
      const customer = new Customer();
      customer.id = customer_id;
      customer.name = body.name;
      customer.email = body.email;
      customer.phone_number = body.phone_number;

      const result = await this.bookingService.createBooking(body, customer, true);
      return {
        success: true,
        data: {
          message: 'Booking success',
          redirect_url: result.data.redirect_url,
          token: token,
        }
      }
    }

  @Post('/assign-employee')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  async assignEmployee(@Body() body: AssignEmployeeDto) {
    return this.bookingService.assignEmployee(body.booking_id, body.employee_id);
  }
}
