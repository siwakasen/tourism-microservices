import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Bookings, BookingStatus, Customer, Payment, PaymentMethod, PaymentStatus } from "libs/entities";
import {Snap } from "midtrans-client";
import { DataSource, QueryRunner, Repository } from "typeorm";
import axios from 'axios';
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
@Injectable()
export class PaymentService {

    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,

        @InjectRepository(Bookings)
        private readonly bookingRepository: Repository<Bookings>,

        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
    ) {}

    private async convertUSDToIDR(usdAmount: number): Promise<number> {
        try {
            const response = await axios.get(process.env.EXCHANGE_RATE_API);
            const rate = response.data.rates.IDR;
            return Math.round(usdAmount * rate);
        } catch (error) {
            console.error('Currency conversion error:', error.response?.data || error.message);
            throw new HttpException('Failed to convert currency', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async createTransactionMidtrans(payload: Bookings, product_name: string, total_price: number, customer: Customer, queryRunner: QueryRunner) : Promise<{redirect_url: string}> {
        try {
            const total_price_idr = await this.convertUSDToIDR(total_price);

            const snap = new Snap({
                isProduction: false,
                serverKey: this.configService.get('MIDTRANS_SERVER_KEY'),
            });
            const parameter = {
                transaction_details: {
                    order_id: payload.id,
                    gross_amount: total_price_idr,
                },
                customer_details: {
                    first_name: customer.name,
                    email: customer.email,
                    phone: customer.phone_number,
                },
                item_details: [{
                    id: payload.id,
                    price: total_price_idr,
                    quantity: 1,
                    name: product_name,
                }],
                credit_card: {
                    secure: true,
                },
            }


             const transaction = await snap.createTransaction(parameter).then(async (transaction) => {
                await queryRunner.manager.save(Payment, {
                    booking_id: payload.id,
                    payment_method: PaymentMethod.MIDTRANS,
                    amount: total_price,
                    status: PaymentStatus.PENDING,
                    payment_gateway_id: transaction.token,
                })
                return{
                    redirect_url: transaction.redirect_url,
                    token: transaction.token,
                }
            });
            return {
                redirect_url: transaction.redirect_url,
            }
        } catch (error) {
            throw new HttpException(`${error.code} ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async paymentNotificationHandler(notificationJson: any) : Promise<{
        success: boolean,
    }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    try{
        const apiClient = new Snap({
            isProduction: false,
            serverKey: this.configService.get('MIDTRANS_SERVER_KEY'),
            clientKey: this.configService.get('MIDTRANS_CLIENT_KEY'),
        });
        const statusResponse = await apiClient.transaction.notification(notificationJson)
        .then(async (statusResponse)=>{
            let orderId = statusResponse.order_id;
            let transactionStatus = statusResponse.transaction_status;
            let fraudStatus = statusResponse.fraud_status;

        console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`);

        // Sample transactionStatus handling logic
        if (transactionStatus == 'capture'){
            if (fraudStatus == 'accept'){
                    await queryRunner.manager.update(Payment, {booking_id: orderId}, {status: PaymentStatus.SUCCESS});
                    await queryRunner.manager.update(Bookings, {id: orderId}, {status: BookingStatus.WAITING_CONFIRMATION});
                    await queryRunner.commitTransaction();
                    return {
                        success: true,
                    }
            }
        } else if (transactionStatus == 'settlement'){
            await queryRunner.manager.update(Payment, {booking_id: orderId}, {status: PaymentStatus.SUCCESS});
            await queryRunner.manager.update(Bookings, {id: orderId}, {status: BookingStatus.WAITING_CONFIRMATION});
            await queryRunner.commitTransaction();
            return {
                success: true,
            }
        } else if (transactionStatus == 'cancel' ||
          transactionStatus == 'deny' ||
          transactionStatus == 'expire'){
            await queryRunner.manager.update(Payment, {booking_id: orderId}, {status: PaymentStatus.FAILED});
            await queryRunner.manager.update(Bookings, {id: orderId}, {status: BookingStatus.PAYMENT_FAILED});
            await queryRunner.commitTransaction();
            return {
                success: true,
            }
        } else if (transactionStatus == 'pending'){
            await queryRunner.manager.update(Payment, {booking_id: orderId}, {status: PaymentStatus.PENDING});
            await queryRunner.manager.update(Bookings, {id: orderId}, {status: BookingStatus.WAITING_PAYMENT});
            await queryRunner.commitTransaction();
            return {
                success: true,
            }
        }
        });
        return statusResponse;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new HttpException('Error processing payment notification', HttpStatus.INTERNAL_SERVER_ERROR);
        }finally{
            await queryRunner.release();
        }
    }

    private async generateTokenAccess() : Promise<string>{
            const response = await axios({
                url: this.configService.get('PAYPAL_BASE_URL')+ '/v1/oauth2/token',
                method: 'post',
                data: 'grant_type=client_credentials',
                auth: {
                    username: this.configService.get('PAYPAL_CLIENT_ID'),
                    password: this.configService.get('PAYPAL_CLIENT_SECRET')
                }
            });

            return response.data.access_token;
    }

    public async createOrderPaypal(payload: Bookings, product_name: string, total_price: number, customer: Customer, queryRunner: QueryRunner) {
        try{
        const access_token = await this.generateTokenAccess();
        const  response = await axios({
            url: `${this.configService.get('PAYPAL_BASE_URL')}/v2/checkout/orders`,
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`,
            },
            data:JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    items: [{
                        name: product_name,
                        quantity: 1,
                        unit_amount: {
                            currency_code: 'USD',
                            value: total_price,
                        },
                    }],
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
                }],
                payment_source: {
                    paypal:{
                        experience_context: {
                            brand_name: 'Ride Bali Explore',
                            shipping_preference: 'NO_SHIPPING',
                            landing_page: 'NO_PREFERENCE',
                            user_action: 'PAY_NOW',
                            cancel_url: `${this.configService.get('BASE_URL')}/payments/paypal-cancel`,
                            return_url: `${this.configService.get('BASE_URL')}/payments/paypal-complete`,
                            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
                            }
                        }
                    }
            })
            })
            await queryRunner.manager.save(Payment, {
                booking_id: payload.id,
                payment_method: PaymentMethod.PAYPAL,
                amount: total_price,
                status: PaymentStatus.PENDING,
                payment_gateway_id: response.data.id,
            })
            return {
                redirect_url: response.data.links[1].href,
            }
        } catch (error) {
            console.error('Error creating order:', error.response?.data || error.message);
            throw new HttpException('Failed to create order', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async updateStatusPayment(response: any, orderId: string) {
        if(response.status  === 404){
            throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
        }
        if(response.status  === 422){
            throw new HttpException('Order already captured', HttpStatus.BAD_REQUEST);
        }

        if(response.data.status === 'COMPLETED'){
            const payment = await this.paymentRepository.findOne({where: {payment_gateway_id: orderId}});
            await this.paymentRepository.update(payment.id, {status: PaymentStatus.SUCCESS});
             await this.bookingRepository.update(payment.booking_id, {status: BookingStatus.WAITING_CONFIRMATION});
            return {
                success: true,
                data:{
                    message: 'Payment completed',
                }

            }
        }
    }

    public async capturePaymentPaypal(orderId: string) {
        try {
            const access_token = await this.generateTokenAccess();
            const response = await axios({
                url: `${this.configService.get('PAYPAL_BASE_URL')}/v2/checkout/orders/${orderId}/capture`,
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
            });
            await this.updateStatusPayment(response, orderId);
            return{
                success: true,
                data:{
                    message: 'Payment captured',
                }
            }
        } catch (error) {
            console.error('Error capturing payment:', error.response?.data || error.message);
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async checkOrderPaypal(orderId: string) {
        const access_token = await this.generateTokenAccess();
        const response = await axios({
            url: `${this.configService.get('PAYPAL_BASE_URL')}/v2/checkout/orders/${orderId}`,
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`,
            },
        });
        await this.updateStatusPayment(response, orderId);
        return response.data;
    }
  
}