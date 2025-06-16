import { Controller, Get, Body, Post } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { BookingService } from "../bookings/booking.service";
import { PaymentNotificationDto } from "./payment.dto";


@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService, private readonly bookingService: BookingService) {}

    @Post('notification-handler')
    
    async midtransCallback(@Body() body: PaymentNotificationDto) {
        const statusResponse = await this.paymentService.paymentNotificationHandler(body);
        const bookingStatus = await this.bookingService.updatePaymentStatus(statusResponse.order_id, statusResponse.payment_status);
        console.log(statusResponse);
        return statusResponse;
    }

    
}