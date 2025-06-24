import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { BookingAdjustmentService } from "./booking-adjust.service";
import { JwtAuthGuard } from "@app/helpers/auth/user/auth.guard";
import { Roles, UserType } from "@app/helpers/auth/decorators/auth.decorator";
import { GetCustomer } from "@app/helpers/auth/decorators/get-user.decorator";
import { AdjustmentStatus, Customer } from "libs/entities";
import { ApproveRejectAdjustmentDto, CancelBookingReqDto, PaginationDto } from "./booking-adjust.dto";


@ApiTags('Booking Adjustment Controller')
@ApiBearerAuth()
@Controller('')
export class BookingAdjustmentController {
    constructor(private readonly bookingAdjustmentService: BookingAdjustmentService) {}

    @Post('/cancel/:booking_id')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.CUSTOMER)
    async cancelBooking(@Param('booking_id') booking_id: number, @GetCustomer() customer: Customer, @Body() body: CancelBookingReqDto) {
      return this.bookingAdjustmentService.cancelBooking(booking_id, customer.id, body.reason);
    }

    @Get('/adjustments')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.ADMIN)
    async getAdjustment(@Query() paginationDto: PaginationDto) {
      return this.bookingAdjustmentService.getAdjustments(paginationDto);
    }

    @Patch('/adjustments/approvement/:id')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.ADMIN)
    async approveRejectAdjustment(@Param('id') id: number, @Body() body: ApproveRejectAdjustmentDto) {
      return this.bookingAdjustmentService.approveRejectAdjustment(id, body.status);
    }
}