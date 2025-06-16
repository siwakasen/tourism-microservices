import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Bookings, Customer, Payment, PaymentMethod, PaymentStatus } from "libs/entities";
import {Snap } from "midtrans-client";
import { DataSource } from "typeorm";
import axios from 'axios';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PaymentService {

    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,
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

    public async createTransactionMidtrans(payload: Bookings, product_name: string, total_price: number, customer: Customer) : Promise<{redirect_url: string}> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        console.log(customer);
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
                await queryRunner.commitTransaction();  
                return{
                    redirect_url: transaction.redirect_url,
                    token: transaction.token,
                }
            });
            console.log(transaction);
            return transaction;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new HttpException(`${error.code} ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            await queryRunner.release();
        }
    }

    public async paymentNotificationHandler(notificationJson: any) : Promise<{
        success: boolean,
        order_id: number,
        payment_status: PaymentStatus,
        message: string,
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
                    await queryRunner.commitTransaction();
                    return {
                        success: true,
                        order_id: orderId,
                        payment_status: PaymentStatus.SUCCESS,
                        message: 'Payment successful',
                    }
            }
        } else if (transactionStatus == 'settlement'){
            await queryRunner.manager.update(Payment, {booking_id: orderId}, {status: PaymentStatus.SUCCESS});
            await queryRunner.commitTransaction();
            return {
                success: true,
                order_id: orderId,
                payment_status: PaymentStatus.SUCCESS,
                message: 'Payment successful',
            }
        } else if (transactionStatus == 'cancel' ||
          transactionStatus == 'deny' ||
          transactionStatus == 'expire'){
            await queryRunner.manager.update(Payment, {booking_id: orderId}, {status: PaymentStatus.FAILED});
            await queryRunner.commitTransaction();
            return {
                success: true,
                order_id: orderId,
                payment_status: PaymentStatus.FAILED,
                message: 'Payment failed',
            }
        } else if (transactionStatus == 'pending'){
            await queryRunner.manager.update(Payment, {booking_id: orderId}, {status: PaymentStatus.PENDING});
            await queryRunner.commitTransaction();
            return {
                success: true,
                order_id: orderId,
                payment_status: PaymentStatus.PENDING,
                message: 'Payment pending',
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
  
}