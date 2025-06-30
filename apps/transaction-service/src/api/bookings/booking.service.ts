import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BookingReqDto, BookingResDto, PaginationDto } from './booking.dto';
import { RegisterCustomerDto } from './booking.dto';
import { Bookings, BookingStatus, Customer, CustomerServiceClient, EmployeeServiceClient,   Payment, PaymentMethod, PaymentStatus } from 'libs/entities';
import { ClientGrpc } from '@nestjs/microservices';
import { Between, DataSource, In, LessThanOrEqual, MoreThanOrEqual, QueryRunner } from 'typeorm';
import { CarServiceClient, TravelPackageServiceClient } from 'libs/entities';
import { PaymentService } from '../payments/payment.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class BookingService implements OnModuleInit {
  constructor(private readonly paymentService: PaymentService) {}

  @Inject('CUS_AUTH_CLIENT')
  private clientCus: ClientGrpc;

  @Inject('TRAVEL_PACKAGE_CLIENT')
  private clientTravelPackage: ClientGrpc;

  @Inject('CAR_CLIENT')
  private clientCar: ClientGrpc;
  
  @Inject('EMP_AUTH_CLIENT')
  private clientEmp: ClientGrpc;

  private customerGrpcService: CustomerServiceClient;
  private travelPackageGrpcService: TravelPackageServiceClient;
  private carGrpcService: CarServiceClient;
  private employeeGrpcService: EmployeeServiceClient;

  private readonly logger = new Logger(BookingService.name);

  @Inject(DataSource)
  private readonly dataSource: DataSource;
  onModuleInit() {
    this.customerGrpcService = this.clientCus.getService<CustomerServiceClient>('CustomerGrpcService');
    this.travelPackageGrpcService = this.clientTravelPackage.getService<TravelPackageServiceClient>('TravelPackageGrpcService');
    this.carGrpcService = this.clientCar.getService<CarServiceClient>('CarGrpcService');
    this.employeeGrpcService = this.clientEmp.getService<EmployeeServiceClient>('EmployeeGrpcService');
  }

  public async registerCustomerGrpc(payload: RegisterCustomerDto) {
    try { 
      const {id,jwtToken} = await this.customerGrpcService.registerCustomer({
        email: payload.email,
        password: payload.password,
        name: payload.name,
        phoneNumber: payload.phone_number ,
        countryOrigin: payload.country_origin,
      }).toPromise();

      console.log('id', id);
      return {
        token: jwtToken,
        customer_id: id,
      };
    } catch (error) {
      throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async deleteCustomerGrpc(customer_id: number) {
    try {
      const response = await this.customerGrpcService.deleteCustomer({
        id: customer_id,
      }).toPromise();
      return response;
    } catch (error) {
      throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getPackageGrpc(payload: {package_id: number}) {
    try {

      const data = await this.travelPackageGrpcService.getTravelPackage({
        id: payload.package_id,
      }).toPromise();
      return data;
    } catch (error) {
      console.log(error.details);
      throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getCarGrpc(payload: {car_id: number}) {
    try {
      const data = await this.carGrpcService.getCar({
        id: payload.car_id,
      }).toPromise();
      return data;
    } catch (error) {
      console.log(error.details);
      throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  private async checkCarConflict(queryRunner : QueryRunner, car_id: number, new_start_date: Date, new_end_date: Date) {
    if (!car_id) return; 
    const startDate = new Date(new_start_date);
    const endDate = new Date(new_end_date);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    // Check for CONFIRMED or ONGOING
    const car_conflict = await queryRunner.manager.findOne(Bookings, {
      where: [
        {
          car_id,
          start_date: LessThanOrEqual(endDate),
          end_date: MoreThanOrEqual(startDate),
          status: In([BookingStatus.CONFIRMED, BookingStatus.ONGOING]),
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
          start_date: LessThanOrEqual(endDate),
          end_date: MoreThanOrEqual(startDate),
          status: BookingStatus.WAITING_CONFIRMATION,
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

  public async createBooking(payload: BookingReqDto, customer: Customer, isRegister: boolean) : Promise<{
    data:{
      message: string,
      redirect_url: string
    }
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let booking: Bookings;
      let product_name = '';
      let total_price = 0;
      let redirect_url = null;

      if(payload.package_id){
        /*

        BOOKING PACKAGE

        */
        const packageData = await this.getPackageGrpc(payload);
        if(!packageData){
          throw new HttpException('Package not found', HttpStatus.NOT_FOUND);
        }
        let endDate: Date;
        const day = packageData.duration / 12;
        const startDate = new Date(payload.start_date);
        if(day > 1){
          endDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
        }else{
          endDate = new Date(startDate.getTime() + 1 * 60 * 1000);
          }

        total_price = packageData.packagePrice * payload.number_of_persons;
        product_name = packageData.packageName;


         booking = await queryRunner.manager.save(Bookings, {
          package_id: payload.package_id,
            total_price: total_price,
            start_date: startDate,
            end_date: endDate,
            customer_id: customer.id,
            number_of_persons: payload.number_of_persons,
            status: BookingStatus.WAITING_PAYMENT,
            pickup_location: payload.pickup_location,
            pickup_time: payload.pickup_time 
        });
      }else if(payload.car_id){
        /*

        RENT CAR

        */
        await this.checkCarConflict(queryRunner, payload.car_id, payload.start_date, payload.end_date);
        const carData = await this.getCarGrpc(payload);
        if(!carData){
          throw new HttpException('Car not found', HttpStatus.NOT_FOUND);
        }
        const {pricePerDay, carName} = carData;
        product_name = carName;

        const startDate = new Date(payload.start_date);
        const endDate = new Date(payload.end_date);
        const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if(days < 1){
          throw new HttpException('End date must be greater than start date', HttpStatus.BAD_REQUEST);
        }
        let driverPrice = 0;
        if(payload.with_driver){
          driverPrice = 6;
        }
        total_price = (pricePerDay + driverPrice) * Number(days.toFixed(0));
        

        booking = await queryRunner.manager.save(Bookings, {
          car_id: payload.car_id,
          total_price: total_price,
          start_date: startDate,
          end_date: endDate,
          customer_id: customer.id,
          
          status: BookingStatus.WAITING_PAYMENT,
          pickup_location: payload.pickup_location,
          pickup_time: payload.pickup_time,
          with_driver: payload.with_driver || false,
        });
        
      }
      
      if(payload.payment_method === PaymentMethod.MIDTRANS){
        const {redirect_url : midtrans_redirect_url} = await this.paymentService.createTransactionMidtrans(booking, product_name, total_price, customer, queryRunner);
        redirect_url = midtrans_redirect_url;
      }else if(payload.payment_method === PaymentMethod.PAYPAL){
        const {redirect_url : paypal_redirect_url} = await this.paymentService.createOrderPaypal(booking, product_name, total_price, customer, queryRunner);
        redirect_url = paypal_redirect_url;
      }
      console.log('redirect_url', redirect_url);
      await queryRunner.commitTransaction();
      return {
        data: {
          message: 'Booking success',
          redirect_url: redirect_url,
        }
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if(isRegister){
        await this.deleteCustomerGrpc(customer.id);
      }
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }

  public async assignEmployee(booking_id: number, employee_id: number) {
     const queryRunner = this.dataSource.createQueryRunner();
     await queryRunner.connect();
     await queryRunner.startTransaction();
     try {
      const booking = await queryRunner.manager.findOne(Bookings, {
        where: { id: booking_id, status: BookingStatus.WAITING_CONFIRMATION },
      });
      if(!booking){
        throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
      }

      const employee =  await this.employeeGrpcService.getEmployee({ id: employee_id }).toPromise();

      if(!employee){
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }
      const requiredRole = booking.with_driver ? 4 : 3;
      
      if((employee as any).role_id != requiredRole){
        throw new HttpException('Employee role is not match with booking', HttpStatus.BAD_REQUEST);
      }

      const conflict = await queryRunner.manager.findOne(Bookings, {
        where: [
          {
            employee_id: employee_id,
            with_driver: booking.with_driver,
            start_date: Between(booking.start_date, booking.end_date),
            status: In([ BookingStatus.CONFIRMED, BookingStatus.ONGOING]),
          },
        ],
        select: ['id','status','car_id','package_id']
      });
      if(conflict){
        throw new HttpException('Employee is already assigned to another booking', HttpStatus.BAD_REQUEST);
      }

      await queryRunner.manager.update(Bookings, { id: booking_id }, { employee_id: employee_id, status: BookingStatus.CONFIRMED });
      const updatedBooking = await queryRunner.manager.findOne(Bookings, { where: { id: booking_id } });
      await queryRunner.commitTransaction();
      return {
        data: updatedBooking,
        message: 'Employee assigned to booking successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    } finally {
      await queryRunner.release();
    }
  }

  public async getBookings(customer_id: number, paginationDto: PaginationDto) : Promise<BookingResDto> {
    try {
      const {page, limit} = paginationDto;
      
      // Use a single query with left join to fetch bookings and payments
      const queryBuilder = this.dataSource.manager.createQueryBuilder(Bookings, 'bookings')
        .leftJoinAndSelect('bookings.payments', 'payments')
        .where('bookings.customer_id = :customer_id', {customer_id})
        .orderBy('bookings.created_at', 'DESC')
        .addOrderBy('payments.created_at', 'DESC')
        
        
      const [result, total] = await queryBuilder.skip((page - 1) * limit).take(limit).getManyAndCount();
      
      
      
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;

      return {
        data : result,
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
      throw new HttpException(error.details, error.status);
    }
  }

  public async getAllBookings(paginationDto: PaginationDto) : Promise<BookingResDto> {
    try {
      const {page, limit, search} = paginationDto;
      
      // Use a single query with left join to fetch bookings and payments
      const queryBuilder = this.dataSource.manager
        .createQueryBuilder(Bookings, 'bookings')
        .leftJoinAndSelect('bookings.payments', 'payments')
        .orderBy('bookings.created_at', 'DESC')
        .addOrderBy('payments.created_at', 'DESC');

      const conditions = [];
      const parameters: Record<string, any> = {};

      if(search){
        conditions.push('CAST(bookings.status AS TEXT) ILIKE :search');
        parameters['search'] = `%${search}%`;
      }

      if(conditions.length){
        queryBuilder.where(conditions.join(' OR '), parameters);
      }

      const [result, total] = await queryBuilder.skip((page - 1) * limit).take(limit).getManyAndCount();
      
      
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;

      return {
        data : result,
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
      throw new HttpException(error.message, error.status);
    }
  }

  public async finishBooking(booking_id: number, booking_status: BookingStatus.COMPLETED | BookingStatus.NO_SHOW) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const booking = await queryRunner.manager.findOne(Bookings, { where: { id: booking_id, status: BookingStatus.ONGOING } });
      if(!booking){
        throw new HttpException('Booking not found or not ongoing', HttpStatus.NOT_FOUND);
      }
      await queryRunner.manager.update(Bookings, { id: booking_id }, { status: booking_status });
      await queryRunner.commitTransaction();
      return {
        data: {
          ...booking,
          status: booking_status,
        },
        message: 'Booking status updated successfully',
      };
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, error.status);
    } finally {
      await queryRunner.release();
    }
  }

  @Cron('0 0 0 * * *',{
    name: 'set-booking-to-ongoing',
    timeZone: 'Asia/Jakarta',
  })
  async handleUpdateConfirmedBookingToOngoing() {
    this.logger.log(`Called at ${new Date(Date.now()+24*60*60*1000).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })}`);
    const jakartaDate = new Date(Date.now()+24*60*60*1000);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const bookings = await queryRunner.manager.find(Bookings, {
        where: { status: BookingStatus.CONFIRMED, 
          start_date: LessThanOrEqual(jakartaDate),
         }, 
      });
      this.logger.log(`Found ${bookings.length} bookings to set to ongoing`);
      for(const booking of bookings){
        this.logger.log(`Set booking ${booking.id} to ongoing`);
        await queryRunner.manager.update(Bookings, { id: booking.id }, { status: BookingStatus.ONGOING });
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, error.status);
    } finally {
      await queryRunner.release();
    }
  }

}
