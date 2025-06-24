import { HttpException, HttpStatus, Injectable } from "@nestjs/common";    
import { Bookings, Payment, PaymentMethod, RefundMetod, Refunds, RefundStatus } from "libs/entities";
import { DataSource, In, QueryRunner } from "typeorm";
import { PaginationDto } from "./refund.dto";


@Injectable()
    export class RefundService {
        constructor(
            private readonly dataSource: DataSource,
        ) {}

    public async createRefund(booking: Bookings, reason: string, queryRunner: QueryRunner) : Promise<Refunds> {
        const payment = await queryRunner.manager.find(Payment, { where: { booking: { id: booking.id } } });
        
        let amount: number = 0;
        for(const p of payment){
            amount += p.gross_amount;
        }
        const refund_amount = amount * 0.7; // 70% refund amount (30% fee)
        const refund = queryRunner.manager.create(Refunds, {
            booking: booking,
            amount: refund_amount,
            method: payment[0].payment_method === PaymentMethod.PAYPAL ? RefundMetod.PAYPAL : RefundMetod.BANK_TRANSFER,
            reason,
            status: RefundStatus.WAITING_FORM,
        });
        await queryRunner.manager.save(refund);
        return refund;
    }

    public async getAllRefund(paginationDto: PaginationDto) {
        try {
            const { page, limit, search } = paginationDto;
            const queryBuilder = this.dataSource.manager.createQueryBuilder(Refunds, 'refunds')
            .leftJoinAndSelect('refunds.booking', 'bookings')
            .orderBy('refunds.created_at', 'DESC');

            const conditions = [];
            const parameters: Record<string, any> = {};

            if(search){
                conditions.push('CAST(refunds.status AS TEXT) ILIKE :search');
                conditions.push('CAST(refunds.method AS TEXT) ILIKE :search');
                conditions.push('refunds.reason ILIKE :search');
                parameters['search'] = `%${search}%`;
            }

            if(conditions.length){
                queryBuilder.where(conditions.join(' OR '), parameters);
            }

            const [result, total] = await queryBuilder.skip((page - 1) * limit).take(limit).getManyAndCount();
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;

            return {
                data: result,
                meta: {
                    totalItems: total,
                    currentPage: page,
                    totalPages,
                    limit,
                    hasNextPage,
                    hasPrevPage: page > 1,
                },
            };
        } catch (error) {
            throw new HttpException(
                {
                  message: [error.message || 'Internal Server Error'],
                  error: 'Internal Server Error',
                  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
        }
    }
    
}