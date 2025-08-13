import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { AssignEmployeeDto, BookingRegisterReqDto, BookingRegisterResDto, BookingReqDto, BookingResDto, FinishBookingDto, PaginationDto } from './booking.dto';
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
  async getBookingsByCustomer(@GetCustomer() customer: Customer, @Query() query: PaginationDto) : Promise<BookingResDto>  {
   return this.bookingService.getBookingsByCustomer(customer.id, query);
  }

  @Get('/all')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN, UserType.OWNER)
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

  @Get('/emp/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  async getBookingAsEmployeeById  (@Param('id') id: number) {
    return this.bookingService.getBookingAsEmployeeById(id);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER)
  async getBookingById(@GetCustomer() customer: Customer,@Param('id') id: number) {
    return this.bookingService.getBookingById(id, customer.id);
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
        data: {
          message: 'Booking success',
          redirect_url: result.data.redirect_url,
          token: token,
        }
      }
    }

  @Patch('/assign-employee/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  async assignEmployee(@Param('id') id: number, @Body() body: AssignEmployeeDto) {
    return this.bookingService.assignEmployee(id, body.employee_id);
  }

  @Patch('/finish/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  async finishBooking(@Param('id') id: number, @Body() body: FinishBookingDto) {
    return this.bookingService.finishBooking(id, body.status);
  }

  @Patch('/confirm-without-driver/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  async confirmCarBookingWithoutDriver(@Param('id') id: number) {
    return this.bookingService.confirmCarBookingWithoutDriver(id);
  }
}
