import { Controller, Body, Post, UseGuards, Patch } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CapturePaymentPaypalDto, CancelPaymentPaypalDto } from './payment.dto';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('payments')
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('notification-handler')
  async midtransCallback(@Body() body: any) {
    const statusResponse =
      await this.paymentService.paymentNotificationHandler(body);
    return statusResponse;
  }

  @Post('capture-paypal')
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
}
