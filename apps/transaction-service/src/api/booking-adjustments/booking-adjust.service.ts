import { AdjustmentStatus, BookingAdjustments,  Payment, PaymentMethod, PaymentStatus, Refunds, RequestType } from "libs/entities/transactions";
import { Between, DataSource, In, LessThanOrEqual, MoreThanOrEqual, Not, QueryRunner, RemoveOptions, Repository, SaveOptions } from "typeorm";
import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { Bookings, BookingStatus } from "libs/entities/transactions/bookings.entity";
import { InjectRepository } from "@nestjs/typeorm";
import {   ApprovementRescheduleDto, PaginationDto, RescheduleBookingReqDto } from "./booking-adjust.dto";
import { RefundService } from "../refunds/refund.service";
import { ClientGrpc } from "@nestjs/microservices";
import {  Customer, CustomerServiceClient, EmployeeServiceClient } from "libs/entities";
import { ApiTags } from "@nestjs/swagger";
import { MailService } from "libs/helpers/src/mail/mail.service";
import { PaymentService } from "../payments/payment.service";

@Injectable()
export class BookingAdjustmentService implements OnModuleInit {
    constructor(
      private readonly dataSource: DataSource,
      private readonly refundService: RefundService,
      private readonly paymentService: PaymentService
      
    ) {}
    @InjectRepository(Bookings)
    private readonly bookingRepository: Repository<Bookings>;
    
    @InjectRepository(BookingAdjustments)
    private readonly repository: Repository<BookingAdjustments>;
    @Inject('EMP_AUTH_CLIENT')
    private clientEmp: ClientGrpc;
    private employeeGrpcService: EmployeeServiceClient;

    @Inject('CUS_AUTH_CLIENT')
    private clientCus: ClientGrpc;
    private customerGrpcService: CustomerServiceClient;

    @Inject(MailService)

  private readonly mailService: MailService;
    
    onModuleInit() {
        this.employeeGrpcService = this.clientEmp.getService<EmployeeServiceClient>('EmployeeGrpcService');
        this.customerGrpcService = this.clientCus.getService<CustomerServiceClient>('CustomerGrpcService');
    }

    private async getCustomerGrpc(customer_id: number) {
        const response = await this.customerGrpcService
          .getCustomer({
            id: customer_id,
          })
          .toPromise();
        return response;

    }
    
    // FROM CONTROLLER ACCESS
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
        
              // ada case untuk report-service : status cancelled dengan payment PENDING tidak dihitung
              // auto cancel on booking
              await this.dataSource.manager.update(Bookings, { id: booking_id }, { status: BookingStatus.CANCELLED });
              await this.dataSource.manager.update(Payment, { booking: { id: booking_id }, status: PaymentStatus.PENDING }, { status: PaymentStatus.FAILED });
              return {
                data: booking,
                message: 'Booking cancelled successfully',
              };
            }
            
            // if booking starts in 24 hours or less then cannot cancel
            if(new Date(booking.start_date).getTime() - new Date().getTime() <= 1000 * 60 * 60 * 24){
              throw new HttpException('Booking cannot be cancelled within 24 hours of the start date', HttpStatus.BAD_REQUEST);
            }


            const hasAdjustment = await queryRunner.manager.findOne(BookingAdjustments, { where: { booking: {id: booking_id}, request_type: RequestType.CANCELLATION } });
            if(hasAdjustment){
                throw new HttpException('Booking already requested for cancellation', HttpStatus.BAD_REQUEST);
            }
            
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
                message: 'Booking cancellation request created successfully',
            };
            
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            await queryRunner.release();
        }
    }

    // FROM CONTROLLER ACCESS
    public async rescheduleBooking(booking_id:number, customer_id:number, payload: RescheduleBookingReqDto){
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try{
          const booking = await this.dataSource.manager.findOne(Bookings, { where: { id: booking_id, 
            customer_id,
            status: In([BookingStatus.WAITING_CONFIRMATION, BookingStatus.CONFIRMED])
          } });
          if(!booking){
            throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
          }

          if(new Date(booking.start_date).getTime() - new Date().getTime() <= 1000 * 60 * 60 * 24){
            throw new HttpException('Booking cannot be rescheduled within 24 hours of the start date', HttpStatus.BAD_REQUEST);
          }
          if(booking.package_id){
            const now = new Date().setHours(0,0,0,0);
            const new_start_date = new Date(payload.new_start_date).setHours(0,0,0,0);
            if(new_start_date <= now){
              throw new HttpException('New start date must be greater than today', HttpStatus.BAD_REQUEST);
            }
          }else{
            const startDate = new Date(payload.new_start_date);
            const endDate = new Date(payload.new_end_date);
            const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            if(days < 1){
              throw new HttpException('End date must be greater than start date', HttpStatus.BAD_REQUEST);
            }
            const old_start = new Date(booking.start_date).setHours(0,0,0,0);
            const new_start = new Date(payload.new_start_date).setHours(0,0,0,0);
            const new_end = new Date(payload.new_end_date).setHours(0,0,0,0);

            // if same start day, check end date is after
            if(new_start === old_start){
              if(new_end <= old_start){
                throw new HttpException('New end date must be greater than start date', HttpStatus.BAD_REQUEST);
              }
            }
            // if different start day, check end after new start
            else {
              if(new_end <= new_start){
                throw new HttpException('New end date must be greater than new start date', HttpStatus.BAD_REQUEST);
              }
            }
          }

          const hasAdjustment = await queryRunner.manager.findOne(BookingAdjustments, { where: { booking: {id: booking_id}, request_type: RequestType.RESCHEDULE } });
          if(hasAdjustment){
            throw new HttpException('Booking already requested for reschedule', HttpStatus.BAD_REQUEST);
          }

          if(booking.package_id){
            const bookingAdjustment = this.repository.create({
              booking: booking,
              request_type: RequestType.RESCHEDULE,
              status: AdjustmentStatus.PENDING,
              new_start_date: payload.new_start_date,
              new_end_date: payload.new_start_date,
              additional_price: 0,
            });

            await queryRunner.manager.save(bookingAdjustment);
            await queryRunner.commitTransaction();
            return {
              data: bookingAdjustment,
              message: 'Reschedule request created successfully',
            };
          }

        const startDate = new Date(payload.new_start_date);
        const endDate = new Date(payload.new_end_date);
        const new_range_days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const old_range_days = (booking.end_date.getTime() - booking.start_date.getTime()) / (1000 * 60 * 60 * 24);

        let additional_price = 0;
        if(new_range_days > old_range_days){
          if(booking.with_driver){
            const pricePerDay = (booking.total_price / old_range_days) - 10;
            const additional_days = new_range_days - old_range_days;
            additional_price = (pricePerDay + 10) * additional_days;
          }else{
            const pricePerDay = (booking.total_price / old_range_days);
            const additional_days = new_range_days - old_range_days;
            additional_price = pricePerDay * additional_days;
          }
        }

          const bookingAdjustment = this.repository.create({
            booking: booking,
            request_type: RequestType.RESCHEDULE,
            status: AdjustmentStatus.PENDING,
            new_start_date: payload.new_start_date,
            new_end_date: payload.new_end_date,
            additional_price: additional_price,
          });

          await queryRunner.manager.save(bookingAdjustment);
          await queryRunner.commitTransaction();
          return {
            data: bookingAdjustment,
            message: 'Reschedule request created successfully',
          };


      }catch(error){
        await queryRunner.rollbackTransaction();
        throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
      }finally{
        await queryRunner.release();
      }

    }

    // FROM CONTROLLER ACCESS
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

  // FROM CONTROLLER ACCESS
  public async approvementCancellation(id: number, status: AdjustmentStatus.APPROVED | AdjustmentStatus.REJECTED) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const adjustment = await queryRunner.manager.findOne(BookingAdjustments, { where: { id, request_type: RequestType.CANCELLATION }, relations: ['booking'] });
      if(!adjustment){
        throw new HttpException('Booking adjustment not found', HttpStatus.NOT_FOUND);
      }
      if(adjustment.status === AdjustmentStatus.APPROVED || adjustment.status === AdjustmentStatus.REJECTED){
        throw new HttpException(`Booking adjustment already ${adjustment.status}`, HttpStatus.BAD_REQUEST);
      }


      let refund_data : Refunds;
      // approve cancellation
      if(status === AdjustmentStatus.APPROVED){
          // update booking status to cancelled
        // then refund the customer
        const booking = await this.bookingRepository.findOne({ where: { id: adjustment.booking.id } });
        booking.status = BookingStatus.CANCELLED;

        const customer = await this.getCustomerGrpc(booking.customer_id);
        await this.bookingRepository.save(booking);
        await this.mailService.sendCancelApproved({
          email: customer.email,
          name: customer.name,
          url: `${process.env.FRONTEND_URL}/history-order/${booking.id}`,
        });
        // refund the customer
         refund_data = await this.refundService.createRefund(booking, adjustment.reason, queryRunner);

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

  private async validateEmployee(employee_id: number, requiredRole: number) {
    const employee = await this.employeeGrpcService.getEmployee({ id: employee_id }).toPromise();
    if (!employee) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }
    if ((employee as any).role_id !== requiredRole) {
      throw new HttpException('Employee role is not match with booking', HttpStatus.BAD_REQUEST);
    }
    return employee;
  }

  private async checkEmployeeConflict(queryRunner : QueryRunner, employee_id: number, with_driver: boolean, new_start_date: Date, new_end_date: Date, booking_id: number) {
    const employee_conflict = await queryRunner.manager.findOne(Bookings, {
      where: [
        {
          employee_id,
          with_driver,
          start_date: Between(new_start_date, new_end_date),
          status: In([BookingStatus.CONFIRMED, BookingStatus.ONGOING]),
          id: Not(booking_id),
        },
      ],
      select: ['id', 'status', 'car_id', 'package_id'],
    });
    if (employee_conflict) {
      throw new HttpException('Employee is already assigned to another booking', HttpStatus.BAD_REQUEST);
    }
  }

  private async checkCarConflict(queryRunner : QueryRunner, booking_id: number, car_id: number, new_start_date: Date, new_end_date: Date) {
    if (!car_id) return;
    // Check for CONFIRMED or ONGOING
    const car_conflict = await queryRunner.manager.findOne(Bookings, {
      where: [
        {
          car_id,
          start_date: LessThanOrEqual(new_end_date),
          end_date: MoreThanOrEqual(new_start_date),
          status: In([BookingStatus.CONFIRMED, BookingStatus.ONGOING]),
          id: Not(booking_id),
        },
      ],
      select: ['id', 'status', 'car_id', 'package_id'],
    });
    if (car_conflict) {
      throw new HttpException('Car is already assigned to another booking', HttpStatus.BAD_REQUEST);
    }
    // Check for WAITING_CONFIRMATION with successful payment
    const waiting_confirmed = await queryRunner.manager.findOne(Bookings, {
      where: [
        {
          car_id,
          start_date: LessThanOrEqual(new_end_date),
          end_date: MoreThanOrEqual(new_start_date),
          status: BookingStatus.WAITING_CONFIRMATION,
          id: Not(booking_id),
        },
      ],
      select: ['id', 'status', 'car_id', 'package_id'],
    });
    if (waiting_confirmed) {
      const payment = await queryRunner.manager.findOne(Payment, {
        where: {
          booking: { id: waiting_confirmed.id },
          status: PaymentStatus.SUCCESS,
        },
      });
      if (payment) {
        throw new HttpException('Car is already assigned to another booking (waiting confirmation with successful payment)', HttpStatus.BAD_REQUEST);
      }
    }
  }


  // FROM CONTROLLER ACCESS
  public async approvementReschedule(id: number, payload: ApprovementRescheduleDto) {
    const { status, employee_id } = payload;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const adjustment = await this.findAdjustmentForReschedule(queryRunner, id);

      if(!adjustment){
        throw new HttpException('Reschedule request not found', HttpStatus.NOT_FOUND);
      }
      
      if (status === AdjustmentStatus.REJECTED) {
        return await this.handleRejection(queryRunner, adjustment);
      }

      if (adjustment.booking.package_id) {
        if (!employee_id) {
          throw new HttpException('Employee ID is required', HttpStatus.BAD_REQUEST);
        }
        return await this.handleTravelPackageReschedule(queryRunner, adjustment, employee_id);
      } else if (adjustment.booking.with_driver) {
        return await this.handleCarWithDriverReschedule(queryRunner, adjustment, employee_id);
      } else {
        return await this.handleCarWithoutDriverReschedule(queryRunner, adjustment);
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }

  private async findAdjustmentForReschedule(queryRunner: QueryRunner, id: number): Promise<BookingAdjustments> {
    const adjustment = await queryRunner.manager.findOne(BookingAdjustments, {
      where: {
        id,
        request_type: RequestType.RESCHEDULE,
        status: In([AdjustmentStatus.PENDING, AdjustmentStatus.WAITING_REASSIGNMENT]),
      },
      relations: ['booking'],
    });

    
    if (!adjustment) {
      throw new HttpException('Booking adjustment not found', HttpStatus.NOT_FOUND);
    }
    
    return adjustment;
  }

  private async handleRejection(queryRunner: QueryRunner, adjustment: BookingAdjustments) {
    if (adjustment.status === AdjustmentStatus.PENDING) {
      adjustment.status = AdjustmentStatus.REJECTED;
      await queryRunner.manager.save(adjustment);
      await queryRunner.commitTransaction();
      
      return {
        message: `Booking adjustment ${AdjustmentStatus.REJECTED} successfully`,
        data: {
          adjustment: {
            request_type: adjustment.request_type,
            status: AdjustmentStatus.REJECTED,
          },
        },
      };
    } else if (adjustment.status === AdjustmentStatus.WAITING_PAYMENT) {
      throw new HttpException('Cannot reject adjustment that has waiting payment', HttpStatus.BAD_REQUEST);
    }
  }

  private async handleTravelPackageReschedule(
    queryRunner: QueryRunner, 
    adjustment: BookingAdjustments, 
    employee_id: number
  ) {
    const { booking } = adjustment;
    
    
    
    const effective_employee_id = employee_id || booking.employee_id;
    
    await this.validateEmployee(effective_employee_id, 3);
    await this.checkEmployeeConflict(queryRunner, effective_employee_id, false, adjustment.new_start_date, adjustment.new_end_date, booking.id);

    await this.updateBookingForApproval(queryRunner, adjustment, effective_employee_id);
    
    return this.createSuccessResponse(adjustment, AdjustmentStatus.APPROVED);
  }

  private async handleCarWithDriverReschedule(
    queryRunner: QueryRunner, 
    adjustment: BookingAdjustments, 
    employee_id?: number
  ) {
    const { booking } = adjustment;
    
    const effective_employee_id = employee_id || booking.employee_id;
    const new_start_date = adjustment.new_start_date;
    const new_end_date = adjustment.new_end_date;

    if (adjustment.status === AdjustmentStatus.PENDING) {
      return await this.handlePendingWithDriverReschedule(
        queryRunner, 
        adjustment, 
        booking, 
        new_start_date, 
        new_end_date,
        effective_employee_id, 
      );

      // AFTER PAYMENT APPROVAL/REAPPROVE 
    } else if (adjustment.status === AdjustmentStatus.WAITING_REASSIGNMENT) {
      if (!employee_id) {
        throw new HttpException('Employee ID is required', HttpStatus.BAD_REQUEST);
      }
      return await this.handleWaitingReassignWithDriverReschedule(
        queryRunner, 
        adjustment, 
        booking, 
        effective_employee_id, 
        new_start_date, 
        new_end_date
      );
    }
    throw new HttpException('Invalid adjustment status', HttpStatus.BAD_REQUEST);
  }

  private async handlePendingWithDriverReschedule(
    queryRunner: QueryRunner,
    adjustment: BookingAdjustments,
    booking: Bookings,
    new_start_date: Date,
    new_end_date: Date,
    employee_id?: number,
  ) {
    

    // WITH PAYMENT
    if (adjustment.additional_price > 0) {
      // CREATE PAYMENT HERE
      adjustment.status = AdjustmentStatus.WAITING_PAYMENT;
      await queryRunner.manager.save(adjustment);

      const payment = await queryRunner.manager.findOne(Payment, {
        where: {
          booking: { id: booking.id },
        },
      });
      if(payment.payment_method === PaymentMethod.MIDTRANS) {
      await this.paymentService.createTransactionMidtransAdjustment(
        booking, 
        `Reschedule booking #${booking.id}`, 
        adjustment.additional_price, 
        adjustment,
        queryRunner);
      }else{
        await this.paymentService.createOrderPaypalAdjustment(
          booking, 
          `Reschedule booking #${booking.id}`, 
          adjustment.additional_price, 
          adjustment,
          queryRunner);
      }
      await queryRunner.commitTransaction();
      
      return this.createSuccessResponse(adjustment, AdjustmentStatus.WAITING_PAYMENT);
    }
    if (!employee_id) {
      throw new HttpException('Employee ID is required', HttpStatus.BAD_REQUEST);
    }
    await this.validateEmployee(employee_id, 4);
    await this.checkEmployeeConflict(queryRunner, employee_id, true, new_start_date, new_end_date, booking.id);
    await this.checkCarConflict(queryRunner, booking.id, booking.car_id, new_start_date, new_end_date);

    // WITHOUT PAYMENT
    await this.updateBookingForApproval(queryRunner, adjustment, employee_id);
    await queryRunner.commitTransaction();

    return this.createSuccessResponse(adjustment, AdjustmentStatus.APPROVED);
  }

  private async handleWaitingReassignWithDriverReschedule(
    queryRunner: QueryRunner,
    adjustment: BookingAdjustments,
    booking: Bookings,
    employee_id: number,
    new_start_date: Date,
    new_end_date: Date
  ) {
    await this.validatePaymentSuccess(queryRunner, adjustment.id);
    await this.validateEmployee(employee_id, 4);
    await this.checkEmployeeConflict(queryRunner, employee_id, true, new_start_date, new_end_date, booking.id);
    await this.checkCarConflict(queryRunner, booking.id, booking.car_id, new_start_date, new_end_date);

    const new_total_price = await this.calculateNewTotalPrice(queryRunner, booking.id);
    
    await this.updateBookingForApprovalWithPrice(queryRunner, adjustment, employee_id, new_total_price);
    return this.createSuccessResponse(adjustment, AdjustmentStatus.APPROVED);
  }

  private async handleCarWithoutDriverReschedule(
    queryRunner: QueryRunner, 
    adjustment: BookingAdjustments
  ) {
    const { booking } = adjustment;
    const new_start_date = adjustment.new_start_date;
    const new_end_date = adjustment.new_end_date;

    if (adjustment.status === AdjustmentStatus.PENDING) {
      return await this.handlePendingWithoutDriverReschedule(
        queryRunner, 
        adjustment, 
        booking, 
        new_start_date, 
        new_end_date
      );
      // AFTER PAYMENT APPROVAL/REAPPROVE
    } else if (adjustment.status === AdjustmentStatus.WAITING_REASSIGNMENT) {
      return await this.handleWaitingPaymentWithoutDriverReschedule(
        queryRunner, 
        adjustment, 
        booking, 
        new_start_date, 
        new_end_date
      );
    }
    throw new HttpException('Invalid adjustment status', HttpStatus.BAD_REQUEST);
  }

  private async handlePendingWithoutDriverReschedule(
    queryRunner: QueryRunner,
    adjustment: BookingAdjustments,
    booking: Bookings,
    new_start_date: Date,
    new_end_date: Date
  ) {
    await this.checkCarConflict(queryRunner, booking.id, booking.car_id, new_start_date, new_end_date);

    // WITH PAYMENT
    if (adjustment.additional_price > 0) {
      // CREATE PAYMENT HERE
      adjustment.status = AdjustmentStatus.WAITING_PAYMENT;
      await queryRunner.manager.save(adjustment);
      const payment = await queryRunner.manager.findOne(Payment, {
        where: {
          booking: { id: booking.id },
        },
      });
      if(payment.payment_method === PaymentMethod.MIDTRANS) {
      await this.paymentService.createTransactionMidtransAdjustment(
        booking, 
        `Reschedule booking #${booking.id}`, 
        adjustment.additional_price, 
        adjustment,
        queryRunner);
      }else{
        await this.paymentService.createOrderPaypalAdjustment(
          booking, 
          `Reschedule booking #${booking.id}`, 
          adjustment.additional_price, 
          adjustment,
          queryRunner);
      }
      await queryRunner.commitTransaction();
      
      return this.createSuccessResponse(adjustment, AdjustmentStatus.WAITING_PAYMENT);
    }

    // WITHOUT PAYMENT
    await this.updateBookingForApproval(queryRunner, adjustment);
    return this.createSuccessResponse(adjustment, AdjustmentStatus.APPROVED);
  }

  private async handleWaitingPaymentWithoutDriverReschedule(
    queryRunner: QueryRunner,
    adjustment: BookingAdjustments,
    booking: Bookings,
    new_start_date: Date,
    new_end_date: Date
  ) {
    await this.validatePaymentSuccess(queryRunner, adjustment.id);
    await this.checkCarConflict(queryRunner, booking.id, booking.car_id, new_start_date, new_end_date);

    const new_total_price = await this.calculateNewTotalPrice(queryRunner, booking.id);
    
    await this.updateBookingForApprovalWithPrice(queryRunner, adjustment, null, new_total_price);
    return this.createSuccessResponse(adjustment, AdjustmentStatus.APPROVED);
  }

  private async validatePaymentSuccess(queryRunner: QueryRunner, adjustmentId: number) {
    const payment = await queryRunner.manager.findOne(Payment, {
      where: { modification: { id: adjustmentId } },
      relations: ['modification'],
    });
    
    if (!payment || payment.status !== PaymentStatus.SUCCESS) {
      throw new HttpException('Payment not found or not success', HttpStatus.BAD_REQUEST);
    }
  }

  private async calculateNewTotalPrice(queryRunner: QueryRunner, bookingId: number): Promise<number> {
    const payments = await queryRunner.manager.find(Payment, {
      where: { booking: { id: bookingId } },
    });
    
    return payments.reduce((total, payment) => total + payment.gross_amount, 0);
  }

  private async updateBookingForApproval(
    queryRunner: QueryRunner, 
    adjustment: BookingAdjustments, 
    employee_id?: number
  ) {
    const { booking } = adjustment;
    
    adjustment.status = AdjustmentStatus.APPROVED;
    booking.start_date = adjustment.new_start_date;
    booking.end_date = adjustment.new_end_date;
    booking.status = BookingStatus.CONFIRMED;
    
    if (employee_id) {
      booking.employee_id = employee_id;
    }
    
    await queryRunner.manager.save(adjustment);
    await queryRunner.commitTransaction();
  }

  private async updateBookingForApprovalWithPrice(
    queryRunner: QueryRunner, 
    adjustment: BookingAdjustments, 
    employee_id: number | null, 
    new_total_price: number
  ) {
    const { booking } = adjustment;
    
    adjustment.status = AdjustmentStatus.APPROVED;
    booking.start_date = adjustment.new_start_date;
    booking.end_date = adjustment.new_end_date;
    booking.status = BookingStatus.CONFIRMED;
    booking.total_price = new_total_price;
    
    if (employee_id) {
      booking.employee_id = employee_id;
    }
    
    await queryRunner.manager.save(adjustment);
    await queryRunner.commitTransaction();
  }

  private createSuccessResponse(adjustment: BookingAdjustments, status: AdjustmentStatus) {
    return {
      message: `Booking adjustment ${status} successfully`,
      data: {
        adjustment: {
          request_type: adjustment.request_type,
          status,
        },
      },
    };
  }
} 