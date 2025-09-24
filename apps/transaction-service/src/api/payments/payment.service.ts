// payment.service.ts
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  Bookings,
  BookingStatus,
  Customer,
  Payment,
  PaymentMethod,
  PaymentStatus,
  BookingAdjustments,
  AdjustmentStatus,
} from 'libs/entities';
import { Snap } from 'midtrans-client';
import { DataSource, Not, QueryRunner, Repository } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { generateTokenAccess } from '../../common/helper/paypal-access-token.helper';
import { convertUSDToIDR } from '../../common/helper/currency.helper';
import { AuthRedisService } from './redis.service';
@Injectable()
export class PaymentService {
  constructor(
    @Inject(DataSource)
    private readonly dataSource: DataSource,

    @Inject(ConfigService)
    private readonly configService: ConfigService,

    @InjectRepository(Bookings)
    private readonly bookingRepository: Repository<Bookings>,

    @InjectRepository(BookingAdjustments)
    private readonly bookingAdjustmentRepository: Repository<BookingAdjustments>,

    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    private readonly redisService: AuthRedisService
  ) {}

  public async createTransactionMidtrans(
    payload: Bookings,
    product_name: string,
    total_price: number,
    customer: Customer,
    queryRunner: QueryRunner
  ): Promise<{ redirect_url: string }> {
    try {
      const total_price_idr = await convertUSDToIDR(total_price);

      const snap = new Snap({
        isProduction: false,
        serverKey: this.configService.get('MIDTRANS_SERVER_KEY'),
      });
      const parameter = {
        transaction_details: {
          order_id: payload.id + '-' + crypto.randomUUID(),
          gross_amount: total_price_idr,
        },
        customer_details: {
          first_name: customer.name,
          email: customer.email,
          phone: customer.phone_number,
        },
        item_details: [
          {
            id: payload.id,
            price: total_price_idr,
            quantity: 1,
            name: product_name,
          },
        ],
        credit_card: {
          secure: true,
        },
      };

      const transaction = await snap
        .createTransaction(parameter)
        .then(async (transaction) => {
          await queryRunner.manager.save(Payment, {
            booking: payload,
            payment_method: PaymentMethod.MIDTRANS,
            gross_amount: total_price,
            net_amount: total_price,
            status: PaymentStatus.PENDING,
            payment_gateway_id: transaction.token,
          });
          return {
            redirect_url: transaction.redirect_url,
            token: transaction.token,
          };
        });
      return {
        redirect_url: transaction.redirect_url,
      };
    } catch (error) {
      throw new HttpException(
        `${error.code} ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  public async createTransactionMidtransAdjustment(
    payload: Bookings,
    product_name: string,
    total_price: number,
    adjustment: BookingAdjustments,
    queryRunner: QueryRunner
  ): Promise<{ redirect_url: string }> {
    try {
      const total_price_idr = await convertUSDToIDR(total_price);

      const snap = new Snap({
        isProduction: false,
        serverKey: this.configService.get('MIDTRANS_SERVER_KEY'),
      });
      const parameter = {
        transaction_details: {
          order_id: `${payload.id}-${adjustment.id}-${crypto.randomUUID()}`,
          gross_amount: total_price_idr,
        },
        customer_details: {
          first_name: 'inherit',
          email: 'inherit@inherit.com',
          phone: 'inherit',
        },
        item_details: [
          {
            id: `${payload.id}-${adjustment.id}`,
            price: total_price_idr,
            quantity: 1,
            name: product_name,
          },
        ],
        credit_card: {
          secure: true,
        },
      };

      const transaction = await snap
        .createTransaction(parameter)
        .then(async (transaction) => {
          await queryRunner.manager.save(Payment, {
            booking: payload,
            modification: adjustment,
            payment_method: PaymentMethod.MIDTRANS,
            gross_amount: total_price,
            net_amount: total_price,
            status: PaymentStatus.PENDING,
            payment_gateway_id: transaction.token,
          });
          return {
            redirect_url: transaction.redirect_url,
            token: transaction.token,
          };
        });
      return {
        redirect_url: transaction.redirect_url,
      };
    } catch (error) {
      throw new HttpException(
        `${error.code} ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  public async capturePaymentMidtrans(notificationJson: any): Promise<{}> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const apiClient = new Snap({
        isProduction: false,
        serverKey: this.configService.get('MIDTRANS_SERVER_KEY'),
        clientKey: this.configService.get('MIDTRANS_CLIENT_KEY'),
      });
      const statusResponse = await apiClient.transaction
        .notification(notificationJson)
        .then(async (statusResponse) => {
          let bookingId = statusResponse.order_id.split('-')[0];
          let transactionStatus = statusResponse.transaction_status;
          let fraudStatus = statusResponse.fraud_status;

          console.log(
            `Transaction notification received. Order ID: ${bookingId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`
          );

          if (transactionStatus == 'capture') {
            if (fraudStatus == 'accept') {
              await queryRunner.manager.update(
                Payment,
                { booking: { id: bookingId } },
                { status: PaymentStatus.SUCCESS, payment_date: new Date() }
              );
              await this.updateStatusBookingMidtrans(
                bookingId,
                queryRunner,
                BookingStatus.WAITING_CONFIRMATION,
                true
              );
              await queryRunner.commitTransaction();
              return {
                success: true,
              };
            }
          } else if (transactionStatus == 'settlement') {
            await queryRunner.manager.update(
              Payment,
              { booking: { id: bookingId } },
              { status: PaymentStatus.SUCCESS, payment_date: new Date() }
            );
            await this.updateStatusBookingMidtrans(
              bookingId,
              queryRunner,
              BookingStatus.WAITING_CONFIRMATION,
              true
            );
            await queryRunner.commitTransaction();
            return {
              success: true,
            };
          } else if (
            transactionStatus == 'cancel' ||
            transactionStatus == 'deny' ||
            transactionStatus == 'expire'
          ) {
            await queryRunner.manager.update(
              Payment,
              { booking: { id: bookingId } },
              { status: PaymentStatus.FAILED }
            );
            await this.updateStatusBookingMidtrans(
              bookingId,
              queryRunner,
              BookingStatus.PAYMENT_FAILED,
              false
            );
            await queryRunner.commitTransaction();
            return {
              success: true,
            };
          } else if (transactionStatus == 'pending') {
            await queryRunner.manager.update(
              Payment,
              { booking: { id: bookingId } },
              { status: PaymentStatus.PENDING }
            );
            await this.updateStatusBookingMidtrans(
              bookingId,
              queryRunner,
              BookingStatus.WAITING_PAYMENT,
              false
            );
            await queryRunner.commitTransaction();
            return {
              success: true,
            };
          }
        });
      return statusResponse;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Error processing payment notification',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async updateStatusBookingMidtrans(
    bookingId: string,
    queryRunner: QueryRunner,
    status: BookingStatus,
    isSuccess: boolean
  ) {
    const booking = await queryRunner.manager.findOne(Bookings, {
      where: { id: Number(bookingId) },
      relations: ['booking_adjustments'],
    });
    if (booking.booking_adjustments.length > 0) {
      for (const adjustment of booking.booking_adjustments) {
        if (adjustment.status === AdjustmentStatus.WAITING_PAYMENT) {
          await queryRunner.manager.update(
            BookingAdjustments,
            { id: adjustment.id },
            { status: AdjustmentStatus.WAITING_RECONFIRMATION }
          );
          return;
        }
      }
    }
    if (isSuccess) {
      await queryRunner.manager.update(
        Bookings,
        { id: bookingId },
        { status: BookingStatus.WAITING_CONFIRMATION }
      );
    } else {
      await queryRunner.manager.update(
        Bookings,
        { id: bookingId },
        { status: status }
      );
    }
  }

  public async createOrderPaypal(
    payload: Bookings,
    product_name: string,
    total_price: number,
    customer: Customer,
    queryRunner: QueryRunner
  ) {
    try {
      const access_token = await this.generateAccessToken();
      const response = await axios({
        url: `${this.configService.get('PAYPAL_BASE_URL')}/v2/checkout/orders`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        data: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              items: [
                {
                  name: product_name,
                  quantity: 1,
                  unit_amount: {
                    currency_code: 'USD',
                    value: total_price,
                  },
                },
              ],
              amount: {
                currency_code: 'USD',
                value: total_price,
                breakdown: {
                  item_total: {
                    currency_code: 'USD',
                    value: total_price,
                  },
                },
              },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: 'Bali Travel Ride',
                shipping_preference: 'NO_SHIPPING',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                cancel_url: `${this.configService.get('CLIENT_URL')}/payments/paypal/cancel`,
                return_url: `${this.configService.get('CLIENT_URL')}/payments/paypal/complete`,
                payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              },
            },
          },
        }),
      });
      await queryRunner.manager.save(Payment, {
        booking: payload,
        payment_method: PaymentMethod.PAYPAL,
        gross_amount: total_price,
        status: PaymentStatus.PENDING,
        payment_gateway_id: response.data.id,
      });
      return {
        redirect_url: response.data.links[1].href,
      };
    } catch (error) {
      console.error(
        'Error creating order:',
        error.response?.data || error.message
      );
      throw new HttpException(
        'Failed to create order',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  public async createOrderPaypalAdjustment(
    payload: Bookings,
    product_name: string,
    total_price: number,
    adjustment: BookingAdjustments,
    queryRunner: QueryRunner
  ) {
    try {
      const access_token = await this.generateAccessToken();
      const response = await axios({
        url: `${this.configService.get('PAYPAL_BASE_URL')}/v2/checkout/orders`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        data: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              items: [
                {
                  name: product_name,
                  quantity: 1,
                  unit_amount: {
                    currency_code: 'USD',
                    value: total_price,
                  },
                },
              ],
              amount: {
                currency_code: 'USD',
                value: total_price,
                breakdown: {
                  item_total: {
                    currency_code: 'USD',
                    value: total_price,
                  },
                },
              },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: 'Bali Travel Ride',
                shipping_preference: 'NO_SHIPPING',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                cancel_url: `${this.configService.get('CLIENT_URL')}/payments/paypal/cancel`,
                return_url: `${this.configService.get('CLIENT_URL')}/payments/paypal/complete`,
                payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              },
            },
          },
        }),
      });
      await queryRunner.manager.save(Payment, {
        booking: payload,
        modification: adjustment,
        payment_method: PaymentMethod.PAYPAL,
        gross_amount: total_price,
        status: PaymentStatus.PENDING,
        payment_gateway_id: response.data.id,
      });
      return {
        redirect_url: response.data.links[1].href,
      };
    } catch (error) {
      console.error(
        'Error creating order:',
        error.response?.data || error.message
      );
      throw new HttpException(
        'Failed to create order',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async updateStatusPaypal(response: any, orderId: string) {
    if (response.status === 404) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    if (response.status === 422) {
      throw new HttpException('Order already captured', HttpStatus.BAD_REQUEST);
    }

    if (response.data.status === 'COMPLETED') {
      const payments = response.data.purchase_units[0].payments;
      const { seller_receivable_breakdown } = payments.captures[0];

      const payment = await this.paymentRepository.findOne({
        where: { payment_gateway_id: orderId },
        relations: ['booking', 'modification'],
      });
      const isoDate = new Date();
      const gmtplus8 = new Date(isoDate.getTime() + 8 * 60 * 60 * 1000);
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.SUCCESS,
        net_amount: seller_receivable_breakdown.net_amount.value,
        payment_date: gmtplus8,
      });
      if (payment.modification) {
        await this.bookingAdjustmentRepository.update(
          { id: payment.modification.id },
          { status: AdjustmentStatus.WAITING_RECONFIRMATION }
        );
      } else {
        await this.bookingRepository.update(payment.booking.id, {
          status: BookingStatus.WAITING_CONFIRMATION,
        });
      }

      return {
        success: true,
        data: {
          message: 'Payment completed',
        },
      };
    }
  }

  public async capturePaymentPaypal(orderId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { payment_gateway_id: orderId, status: Not(PaymentStatus.FAILED) },
      relations: ['booking'],
    });
    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }
    try {
      const access_token = await this.generateAccessToken();
      const response = await axios({
        url: `${this.configService.get('PAYPAL_BASE_URL')}/v2/checkout/orders/${orderId}/capture`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      });
      await this.updateStatusPaypal(response, orderId);
      return {
        data: {
          message: 'Payment captured',
        },
      };
    } catch (error) {
      console.error(error.response.data.details[0].issue);
      if (error.status === 422) {
        throw new HttpException(
          error.response.data.details[0].issue,
          error.status || HttpStatus.BAD_REQUEST
        );
      }
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  public async cancelPaymentPaypal(orderId: string) {
    try {
      const payment = await this.paymentRepository.findOne({
        where: {
          payment_gateway_id: orderId,
          status: PaymentStatus.PENDING,
        },
        relations: ['booking', 'modification'],
      });
      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
      });
      if (!payment.modification) {
        await this.bookingRepository.update(payment.booking.id, {
          status: BookingStatus.CANCELLED,
        });
      }
      return {
        data: {
          message: 'Payment cancelled',
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  public async checkOrderPaypal(orderId: string) {
    const access_token = await this.generateAccessToken();
    const response = await axios({
      url: `${this.configService.get('PAYPAL_BASE_URL')}/v2/checkout/orders/${orderId}`,
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
    });
    await this.updateStatusPaypal(response, orderId);
    return response.data;
  }

  public async getPaymentByBookingId(booking_id: number, customer_id: number) {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { booking: { id: booking_id, customer_id: customer_id } },
      });
      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }
      return {
        data: payment,
        message: 'Payment fetched successfully',
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  private async generateAccessToken() {
    let access_token = await this.redisService.getValue('access_token');
    if (!access_token) {
      access_token = await generateTokenAccess(
        this.configService,
        this.redisService
      );
    }
    return access_token;
  }
}
