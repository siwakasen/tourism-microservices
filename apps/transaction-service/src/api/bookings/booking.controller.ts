import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingRegisterReqDto, BookingRegisterResDto, BookingResDto, BookingWithoutRegisterResDto, PaginationDto } from './booking.dto';
import { GetCustomer } from '@app/helpers/auth/decorators/get-user.decorator';
import { Customer } from 'libs/entities'; 
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';


@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER)
  @ApiBearerAuth()
  async getBookings(@GetCustomer() customer: Customer, @Query() query: PaginationDto) : Promise<BookingResDto>  {
   return this.bookingService.getBookings(customer.id, query);
  }

  @Post('/with-register')
  async bookingWithRegister(@Body() body: BookingRegisterReqDto) : Promise<BookingRegisterResDto> {
      const {token, customer_id} = await this.bookingService.registerCustomerGrpc(body);
      const result = await this.bookingService.createBooking(body, customer_id);
      return {
        success: result.success,
        data: {
          message: 'Booking success',
          token: token
        }
      }
    }

  @Post('/without-register')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER)
  @ApiBearerAuth()
  async bookingWithoutRegister(@Body() body: BookingRegisterReqDto, @GetCustomer() customer: Customer) : Promise<BookingWithoutRegisterResDto> {
    const result = await this.bookingService.createBooking(body, customer.id);
    return {
      success: result.success,
      data: {
        message: 'Booking success'
      }
    }
  }
}
