import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { BookingRegisterReqDto, BookingRegisterResDto, BookingReqDto, BookingResDto, PaginationDto } from './booking.dto';
import { RegisterCustomerDto } from './booking.dto';
import { Bookings, BookingStatus, Customer, CustomerServiceClient, Payment, PaymentMethod, PaymentStatus } from 'libs/entities';
import { ClientGrpc } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { CarServiceClient, TravelPackageServiceClient } from 'libs/entities';
import { PaymentService } from '../payments/payment.service';

@Injectable()
export class BookingService implements OnModuleInit {
  constructor(private readonly paymentService: PaymentService) {}

  @Inject('CUS_AUTH_CLIENT')
  private clientCus: ClientGrpc;

  @Inject('TRAVEL_PACKAGE_CLIENT')
  private clientTravelPackage: ClientGrpc;

  @Inject('CAR_CLIENT')
  private clientCar: ClientGrpc;

  private customerGrpcService: CustomerServiceClient;
  private travelPackageGrpcService: TravelPackageServiceClient;
  private carGrpcService: CarServiceClient;
  @Inject(DataSource)
  private readonly dataSource: DataSource;
  onModuleInit() {
    this.customerGrpcService = this.clientCus.getService<CustomerServiceClient>('CustomerGrpcService');
    this.travelPackageGrpcService = this.clientTravelPackage.getService<TravelPackageServiceClient>('TravelPackageGrpcService');
    this.carGrpcService = this.clientCar.getService<CarServiceClient>('CarGrpcService');
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

  public async deleteCustomerGrpc(customer_id: number) {
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

  // public async assignEmployeeGrpc(payload: BookingRegisterReqDto) {
  //   try {
  //     const employee = await this.employeeGrpcService.assignEmployee({
  //       id: payload.employee_id,
  //     }).toPromise();
  //   }
  // }

  public async createBooking(payload: BookingReqDto, customer: Customer, isRegister: boolean) : Promise<{
    success: boolean,
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
            status: BookingStatus.WAITING_PAYMENT,
            pickup_location: payload.pickup_location,
            pickup_time: payload.pickup_time 
        });
      }else if(payload.car_id){
        /*

        RENT CAR

        */
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
        total_price = pricePerDay * days + driverPrice * days;

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
        success: true,
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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }

  public async getBookings(customer_id: number, paginationDto: PaginationDto) : Promise<BookingResDto> {
    try {
      const {page, limit} = paginationDto;
      const queryBuilder = this.dataSource.manager.createQueryBuilder(Bookings, 'bookings')
        .where('bookings.customer_id = :customer_id', {customer_id})
        .orderBy('bookings.created_at', 'DESC');
        
        const [result, total] = await queryBuilder.skip((page - 1) * limit).take(limit).getManyAndCount();
        const newResult = [];
        for(const booking of result){
          // Get payments for this booking
          const payments = await this.dataSource.manager.find(Payment, {
            where: { booking_id: booking.id }
          });

          if(booking.package_id){
            const {packageName} = await this.getPackageGrpc({
              package_id: booking.package_id
            });
            newResult.push({
              ...booking,
              payments,
              package_name: packageName,
            });
          }else if(booking.car_id){
            const {carName} = await this.getCarGrpc({
              car_id: booking.car_id,
            });
            newResult.push({
              ...booking,
              payments,
              car_name: carName,
            });
          }
        }
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;

      return {
        data : newResult,
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

      throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async getAllBookings(paginationDto: PaginationDto) : Promise<BookingResDto> {
    try {
      const {page, limit} = paginationDto;
      const queryBuilder = this.dataSource.manager.createQueryBuilder(Bookings, 'bookings')
        .orderBy('bookings.created_at', 'DESC');

      const [result, total] = await queryBuilder.skip((page - 1) * limit).take(limit).getManyAndCount();
      const newResult = [];
        for(const booking of result){
          // Get payments for this booking
          const payments = await this.dataSource.manager.find(Payment, {
            where: { booking_id: booking.id }
          });

          if(booking.package_id){
            const {packageName} = await this.getPackageGrpc({
              package_id: booking.package_id
            });
            newResult.push({
              ...booking,
              payments,
              package_name: packageName,
            });
          }else if(booking.car_id){
            const {carName} = await this.getCarGrpc({
              car_id: booking.car_id,
            });
            newResult.push({
              ...booking,
              payments,
              car_name: carName,
            });
          }
        }
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;

      return {
        data : newResult,
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

}
