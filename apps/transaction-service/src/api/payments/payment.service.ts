import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Bookings, BookingStatus, Customer, Payment, PaymentMethod, PaymentStatus } from "libs/entities";
import {Snap } from "midtrans-client";
import { DataSource, QueryRunner, Repository } from "typeorm";
import axios from 'axios';
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { generateTokenAccess } from "../../common/helper/paypal-access-token.helper";
import { convertUSDToIDR } from "../../common/helper/currency.helper";
@Injectable()
export class PaymentService {

    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,

        
        @Inject(ConfigService)
        private readonly configService: ConfigService,

        @InjectRepository(Bookings)
        private readonly bookingRepository: Repository<Bookings>,

        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
    ) {}

    

    public async createTransactionMidtrans(payload: Bookings, product_name: string, total_price: number, customer: Customer, queryRunner: QueryRunner) : Promise<{redirect_url: string}> {
        try {
            const total_price_idr = await convertUSDToIDR(total_price);

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
                    gross_amount: total_price,
                    net_amount: total_price,
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
                    await queryRunner.manager.update(Payment, {booking_id: orderId}, {status: PaymentStatus.SUCCESS, payment_date: new Date()});
                    await queryRunner.manager.update(Bookings, {id: orderId}, {status: BookingStatus.WAITING_CONFIRMATION});
                    await queryRunner.commitTransaction();
                    return {
                        success: true,
                    }
            }
        } else if (transactionStatus == 'settlement'){
            await queryRunner.manager.update(Payment, {booking_id: orderId}, {status: PaymentStatus.SUCCESS, payment_date: new Date()});
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

    

    public async createOrderPaypal(payload: Bookings, product_name: string, total_price: number, customer: Customer, queryRunner: QueryRunner) {
        try{
            
        const access_token = await generateTokenAccess(this.configService);
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
                booking: payload,
                payment_method: PaymentMethod.PAYPAL,
                gross_amount: total_price,
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
            const payments = response.data.purchase_units[0].payments;
            const {seller_receivable_breakdown} = payments.captures[0];


            const payment = await this.paymentRepository.findOne({where: {payment_gateway_id: orderId}, relations: ['booking']});
            await this.paymentRepository.update(payment.id, {status: PaymentStatus.SUCCESS, net_amount: seller_receivable_breakdown.net_amount.value, payment_date: new Date()});
             await this.bookingRepository.update(payment.booking.id, {status: BookingStatus.WAITING_CONFIRMATION});
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
            const access_token = await generateTokenAccess(this.configService);
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
        const access_token = await generateTokenAccess(this.configService);
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