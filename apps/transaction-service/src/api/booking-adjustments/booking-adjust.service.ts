import { AdjustmentStatus, BookingAdjustments, Payment, Refunds, RequestType } from "libs/entities/transactions";
import { DataSource, In, Repository } from "typeorm";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Bookings, BookingStatus } from "libs/entities/transactions/bookings.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationDto } from "./booking-adjust.dto";
import { RefundService } from "../refunds/refund.service";

@Injectable()
export class BookingAdjustmentService {
    constructor(
        @InjectRepository(BookingAdjustments)
        private readonly repository: Repository<BookingAdjustments>,
        private readonly dataSource: DataSource,
        private readonly refundService: RefundService,

        @InjectRepository(Bookings)
        private readonly bookingRepository: Repository<Bookings>,
        
    ) {}
    
    public async  cancelBooking(booking_id: number, customer_id : number, reason: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const booking = await this.dataSource.manager.findOne(Bookings,{ where: 
                { 
                  id: booking_id, 
                  customer_id, 
                  status: In([BookingStatus.WAITING_PAYMENT, BookingStatus.WAITING_CONFIRMATION, BookingStatus.CONFIRMED])
                },
              });
            if(!booking){
              throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
            }
            if(booking.status === BookingStatus.WAITING_PAYMENT){
        
              // ada case untuk reporting : status cancelled dengan payment PENDING tidak dihitung
              await this.dataSource.manager.update(Bookings, { id: booking_id }, { status: BookingStatus.CANCELLED });
              return {
                success: true,
                message: 'Booking cancelled',
              };
            }
            

            console.log(new Date(booking.start_date).getTime() - new Date().getTime());
            // if booking starts in 24 hours or less then cannot cancel
            if(new Date(booking.start_date).getTime() - new Date().getTime() <= 1000 * 60 * 60 * 24){
              return{
                success: false,
                message: 'Booking cannot be cancelled within 24 hours of the start date',
              }
            }
            const hasAdjustment = await queryRunner.manager.findOne(BookingAdjustments, { where: { booking: {id: booking_id}, request_type: RequestType.CANCELLATION } });
            if(hasAdjustment){
                throw new HttpException('Booking adjustment already exists', HttpStatus.BAD_REQUEST);
            }
            console.log(booking);
            const bookingAdjustment = this.repository.create({
                booking: booking,
                request_type: RequestType.CANCELLATION,
                status: AdjustmentStatus.PENDING,
                reason: reason,
                new_start_date: null,
                new_end_date: null,
                additional_price: 0,
            })

            await queryRunner.manager.save(bookingAdjustment);
            await queryRunner.commitTransaction();
            return {
                data: bookingAdjustment,
                message: 'Booking adjustment created successfully',
            };
            
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            await queryRunner.release();
        }
    }

    public async getAdjustments(paginationDto: PaginationDto) {
      const { page = 1, limit = 10, search = '' } = paginationDto;
      try {
        const queryBuilder = this.repository.createQueryBuilder('booking_adjustments')
        .leftJoinAndSelect('booking_adjustments.booking', 'bookings')
        .orderBy('booking_adjustments.created_at', 'DESC');


        const conditions = [];
        const parameters: Record<string, any> = {};

        if (search) {
          conditions.push('CAST(booking_adjustments.request_type AS TEXT) ILIKE :search');
          conditions.push('CAST(booking_adjustments.status AS TEXT) ILIKE :search');
          conditions.push('booking_adjustments.reason ILIKE :search');
          parameters['search'] = `%${search}%`;
        }

        if (conditions.length) {
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
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async approveRejectAdjustment(id: number, status: AdjustmentStatus.APPROVED | AdjustmentStatus.REJECTED) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const adjustment = await queryRunner.manager.findOne(BookingAdjustments, { where: { id }, relations: ['booking'] });
      if(!adjustment){
        throw new HttpException('Booking adjustment not found', HttpStatus.NOT_FOUND);
      }
      if(adjustment.status === AdjustmentStatus.APPROVED || adjustment.status === AdjustmentStatus.REJECTED){
        throw new HttpException(`Booking adjustment already ${adjustment.status}`, HttpStatus.BAD_REQUEST);
      }


      let refund_data : Refunds;
      // approve cancellation
      if(status === AdjustmentStatus.APPROVED && adjustment.request_type === RequestType.CANCELLATION){
        // update booking status to cancelled
        // then refund the customer
        const booking = await this.bookingRepository.findOne({ where: { id: adjustment.booking.id } });
        booking.status = BookingStatus.CANCELLED;
        await this.bookingRepository.save(booking);
        // refund the customer
         refund_data = await this.refundService.createRefund(booking, adjustment.reason, queryRunner);

      }else if(status === AdjustmentStatus.APPROVED && adjustment.request_type === RequestType.RESCHEDULE){

      }

      await queryRunner.manager.update(BookingAdjustments, { id }, { status });
      await queryRunner.commitTransaction();
      if(refund_data){
        return { message: `Booking adjustment ${status} successfully`, data:{
          refund:{
            refund_method: refund_data.method,
            refund_amount: refund_data.amount,
            refund_status: refund_data.status,
          },
          booking:{
            status: refund_data.booking.status,
          },
          adjustment:{
            request_type: adjustment.request_type,
            status: status,
            reason: adjustment.reason,
          }
        } };
      }
      return { message: `Booking adjustment ${status} successfully`, data:{
        adjustment:{
          request_type: adjustment.request_type,
          status: status,
          reason: adjustment.reason,
        }
      } };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }



}