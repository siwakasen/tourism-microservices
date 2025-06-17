import { Controller, Get, Body, Post, Query, UseGuards } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { BookingService } from "../bookings/booking.service";
import { CapturePaymentPaypalDto } from "./payment.dto";
import { JwtAuthGuard } from "@app/helpers/auth/user/auth.guard";
import { Roles, UserType } from "@app/helpers/auth/decorators/auth.decorator";
import { ApiBearerAuth } from "@nestjs/swagger";


@Controller('payments')
@ApiBearerAuth()
export class PaymentController {
    constructor(private readonly paymentService: PaymentService, private readonly bookingService: BookingService) {}
    
    @Post('notification-handler')
    async midtransCallback(@Body() body: any) {
        console.log(body);
        const statusResponse = await this.paymentService.paymentNotificationHandler(body);
        return statusResponse;
    }

    @Post('capture-paypal')
    async capturePaymentPaypal(@Body() body: CapturePaymentPaypalDto) {
        return await this.paymentService.capturePaymentPaypal(body.orderId);
    }

    @Post('check-order-paypal')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.CUSTOMER)
    @ApiBearerAuth()
    async checkOrderPaypal(@Body() body:CapturePaymentPaypalDto) {
        const data = await this.paymentService.checkOrderPaypal(body.orderId);
        return data;
    }
}