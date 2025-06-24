import { Controller, Inject } from "@nestjs/common";
import { BookingGrpcService } from "./booking-grpc.service";
import { GrpcMethod } from "@nestjs/microservices";


@Controller('grpc-booking')
export class BookingGrpcController {
    @Inject(BookingGrpcService)
    private readonly bookingGrpcService: BookingGrpcService;

    @GrpcMethod('BookingsGrpcService', 'GetCarIdsByBookingDateRange')
    async getCarIdsByBookingDateRange(data: { start_date: string, end_date: string }) {
        console.log('data', data);
        const carIds = await this.bookingGrpcService.getCarIdsByBookingDateRange(data.start_date, data.end_date);
        return carIds;
    }
}