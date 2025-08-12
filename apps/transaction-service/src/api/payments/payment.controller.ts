import { Controller, Body, Post, UseGuards, Patch, Param, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CapturePaymentPaypalDto, CancelPaymentPaypalDto } from './payment.dto';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { GetCustomer } from '@app/helpers/auth/decorators/get-user.decorator';
import { Customer } from 'libs/entities'; 

@Controller('payments')
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('notification-handler')
  async midtransCallback(@Body() body: any) {
    const statusResponse =
      await this.paymentService.capturePaymentMidtrans(body);
    return statusResponse;
  }

  @Post('capture-paypal')
  @ApiResponse({ status: 422, description: 'Unprocessable Entity' })
  async capturePaymentPaypal(@Body() body: CapturePaymentPaypalDto) {
    return await this.paymentService.capturePaymentPaypal(body.orderId);
  }

  @Patch('cancel-paypal')
  async cancelPaymentPaypal(@Body() body: CancelPaymentPaypalDto) {
    return await this.paymentService.cancelPaymentPaypal(body.orderId);
  }

  @Post('check-order-paypal')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER, UserType.ADMIN)
  @ApiBearerAuth()
  async checkOrderPaypal(@Body() body: CapturePaymentPaypalDto) {
    const data = await this.paymentService.checkOrderPaypal(body.orderId);
    return data;
  }

  @Get('/:booking_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER)
  @ApiBearerAuth()
  async getPaymentByBookingId(@GetCustomer() customer: Customer, @Param('booking_id') booking_id: number) {
    const data = await this.paymentService.getPaymentByBookingId(booking_id, customer.id);
    return data;
  }
}
