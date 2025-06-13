import { Controller, Get, Post } from '@nestjs/common';
import { BookingService } from './booking.service';

@Controller()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  bookingTravelPackage(): Promise<any> {
    return this.bookingService.bookingTravelPackage();
  }
}
