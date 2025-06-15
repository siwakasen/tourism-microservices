import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { BookingRegisterReqDto, BookingRegisterResDto, BookingResDto, PaginationDto } from './booking.dto';
import { RegisterCustomerDto } from './booking.dto';
import { Bookings, BookingStatus, CustomerServiceClient } from 'libs/entities';
import { ClientGrpc } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { CarServiceClient, TravelPackageServiceClient } from 'libs/entities';

@Injectable()
export class BookingService implements OnModuleInit {

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
      return {
        token: jwtToken,
        customer_id: id,
      };
    } catch (error) {
      throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getPackageGrpc(payload: BookingRegisterReqDto) {
    try {

      const data = await this.travelPackageGrpcService.getTravelPackage({
        id: payload.package_id,
      }).toPromise();
      return data;
    } catch (error) {
      throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getCarGrpc(payload: BookingRegisterReqDto) {
    try {
      const data = await this.carGrpcService.getCar({
        id: payload.car_id,
      }).toPromise();
      return data;
    } catch (error) {
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

  public async createBooking(payload: BookingRegisterReqDto, customer_id: number){
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if(payload.package_id && payload.car_id){
        throw new HttpException('Cannot booking both package and car at the same time', HttpStatus.BAD_REQUEST);
      }


      if(payload.package_id){
        const {packagePrice, duration} = await this.getPackageGrpc(payload);
        let endDate: Date;
        const day = duration / 12;
        const startDate = new Date(payload.start_date);
        if(day > 1){
          endDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
        }else{
          endDate = new Date(startDate.getTime() + 1 * 60 * 1000);
          }
         const booking = await queryRunner.manager.save(Bookings, {
          package_id: payload.package_id,
            total_price: packagePrice,
            start_date: startDate,
            end_date: endDate,
            customer_id: customer_id,
            status: BookingStatus.WAITING_PAYMENT,
            pickup_location: payload.pickup_location || null,
            pickup_time: payload.pickup_time || null
        });
        console.log(booking);
        await queryRunner.commitTransaction();
        return{
          success: true,
        }
      }else if(payload.car_id){
        const {pricePerDay} = await this.getCarGrpc(payload);
        console.log(pricePerDay);
        const startDate = new Date(payload.start_date);
        const endDate = new Date(payload.end_date);
        const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const totalPrice = pricePerDay * days;
        const booking = await queryRunner.manager.save(Bookings, {
          car_id: payload.car_id,
          total_price: totalPrice,
          start_date: startDate,
          end_date: endDate,
          customer_id: customer_id,
          status: BookingStatus.WAITING_PAYMENT,
          pickup_location: payload.pickup_location || null,
          pickup_time: payload.pickup_time || null,
          with_driver: payload.with_driver || false,
        });
        console.log(booking);
        await queryRunner.commitTransaction();
        return{
          success: true,
        }
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
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
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;

      console.log(result);
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
      throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
