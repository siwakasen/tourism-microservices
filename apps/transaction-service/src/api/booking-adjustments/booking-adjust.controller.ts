import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { BookingAdjustmentService } from "./booking-adjust.service";
import { JwtAuthGuard } from "@app/helpers/auth/user/auth.guard";
import { Roles, UserType } from "@app/helpers/auth/decorators/auth.decorator";
import { GetCustomer } from "@app/helpers/auth/decorators/get-user.decorator";
import { Customer } from "libs/entities";
import { ApprovementRescheduleDto, ApproveRejectCancellationDto, CancelBookingReqDto, PaginationDto, RescheduleBookingReqDto } from "./booking-adjust.dto";

@ApiBearerAuth()
@ApiTags('Booking Controller')
@Controller('bookings')
export class BookingAdjustmentController {
    constructor(private readonly bookingAdjustmentService: BookingAdjustmentService) {}

    @Post('/cancel/:booking_id')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.CUSTOMER)
    async cancelBooking(@Param('booking_id') booking_id: number, @GetCustomer() customer: Customer, @Body() body: CancelBookingReqDto) {
      return this.bookingAdjustmentService.cancelBooking(booking_id, customer.id, body.reason);
    }

    @Get('/adjustments/all')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.ADMIN)
    async getAdjustment(@Query() query: PaginationDto) {
      return this.bookingAdjustmentService.getAdjustments(query);
    }

    @Patch('/aprrovement-cancellation/:id')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.ADMIN)
    async approvementCancellation(@Param('id') id: number, @Body() body: ApproveRejectCancellationDto) {
      return this.bookingAdjustmentService.approvementCancellation(id, body.status);
    }

    @Post('/reschedule/:booking_id')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.CUSTOMER)
    async rescheduleBooking(@Param('booking_id') booking_id: number, @GetCustomer() customer: Customer, @Body() body: RescheduleBookingReqDto) {
      
      return this.bookingAdjustmentService.rescheduleBooking(booking_id, customer.id, body);
    }

    @Patch('/approvement-reschedule/:id')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.ADMIN)
    async approvementReschedule(@Param('id') id: number, @Body() body: ApprovementRescheduleDto) {
      return this.bookingAdjustmentService.approvementReschedule(id, body);
    }
}