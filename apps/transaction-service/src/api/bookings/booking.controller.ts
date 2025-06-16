import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingRegisterReqDto, BookingRegisterResDto, BookingReqDto, BookingResDto, BookingWithoutRegisterResDto, PaginationDto } from './booking.dto';
import { GetCustomer } from '@app/helpers/auth/decorators/get-user.decorator';
import { Customer, PaymentMethod } from 'libs/entities'; 
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from '../payments/payment.service';


@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService, private readonly paymentService: PaymentService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER)
  @ApiBearerAuth()
  async getBookings(@GetCustomer() customer: Customer, @Query() query: PaginationDto) : Promise<BookingResDto>  {
   return this.bookingService.getBookings(customer.id, query);
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
  @ApiBearerAuth()
  async bookingWithoutRegister(@Body() body: BookingReqDto, @GetCustomer() customer: Customer)  {
    this.bookingValidation(body);

    const result = await this.bookingService.createBooking(body, customer);
    const {redirect_url} = await this.paymentService.createTransactionMidtrans(result.booking, result.product_name, result.total_price, customer);
    return {
      success: result.success,
      data: {
        message: 'Booking success',
        redirect_url: redirect_url,
      }
    }
    
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


      const {total_price, product_name, booking, success} = await this.bookingService.createBooking(body, customer);
      if(body.payment_method === PaymentMethod.MIDTRANS){
        const transaction = await this.paymentService.createTransactionMidtrans(booking, product_name, total_price, customer);
        return {
          success: success,
          data: {
            message: 'Booking success',
            token: token,
            redirect_url: transaction.redirect_url,
          }
        }
      }else{
        
      }
    }

  
}
