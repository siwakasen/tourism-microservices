import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Bookings, BookingStatus } from "libs/entities";
import { Between, In, IsNull, Not, Repository } from "typeorm";
 

@Injectable()
export class BookingGrpcService {

    @InjectRepository(Bookings)
    private readonly repository: Repository<Bookings>;

    public async getCarIdsByBookingDateRange(start_date: string, end_date: string): Promise<{ car_ids: number[] }> {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        console.log(startDate, endDate);
        const bookings = await this.repository.find({
            where: {
                car_id: Not(IsNull()),
                status: In([BookingStatus.CONFIRMED, BookingStatus.ONGOING]),
                start_date: Between(startDate, endDate)
            }
        });
        const car_ids = bookings.map(b => b.car_id);
        console.log('car_ids', car_ids);
        return { car_ids };
    }
}