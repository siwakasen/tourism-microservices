// booking-grpc.service.ts
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Bookings, BookingStatus } from 'libs/entities';
import {
  Between,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';

@Injectable()
export class BookingGrpcService {
  @InjectRepository(Bookings)
  private readonly repository: Repository<Bookings>;

  public async getCarIdsByBookingDateRange(
    start_date: string,
    end_date: string
  ): Promise<{ car_ids: number[] }> {
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    try {
      const bookings = await this.repository.find({
        where: {
          car_id: Not(IsNull()),
          status: In([BookingStatus.CONFIRMED, BookingStatus.ONGOING]),
          start_date: LessThanOrEqual(endDate),
          end_date: MoreThanOrEqual(startDate),
        },
      });
      // Get bookings with WAITING_CONFIRMATION and PaymentStatus.SUCCESS
      const waitingBookings = await this.repository.find({
        where: {
          car_id: Not(IsNull()),
          status: BookingStatus.WAITING_CONFIRMATION,
          start_date: LessThanOrEqual(endDate),
          end_date: MoreThanOrEqual(startDate),
        },
        relations: ['payments'],
      });
      const waitingConfirmedCarIds = waitingBookings
        .filter(
          (b) =>
            Array.isArray((b as any).payments) &&
            (b as any).payments.some((p: any) => p.status === 'SUCCESS')
        )
        .map((b) => b.car_id);
      // Merge and deduplicate car_ids
      const car_ids = Array.from(
        new Set([...bookings.map((b) => b.car_id), ...waitingConfirmedCarIds])
      );
      return { car_ids };
    } catch (error: any) {
      throw new RpcException(
        'Error getting car ids by booking date range:' + error.message
      );
    }
  }

  public async getEmployeesByBookingDateRange(
    start_date: string,
    end_date: string,
    booking_id: number
  ): Promise<{ employee_ids: number[] }> {
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    try {
      const bookings = await this.repository.find({
        where: {
          start_date: Between(startDate, endDate),
          status: In([BookingStatus.CONFIRMED, BookingStatus.ONGOING]),
          id: Not(booking_id),
        },
      });
      const employee_ids = bookings.map((b) => b.employee_id);
      return { employee_ids };
    } catch (error: any) {
      console.log('error', error);
      throw new RpcException(
        'Error getting employees by booking date range:' + error.message
      );
    }
  }
}
