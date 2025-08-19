import { Controller, Inject } from "@nestjs/common";
import { BookingGrpcService } from "./booking-grpc.service";
import { GrpcMethod } from "@nestjs/microservices";


@Controller('grpc-booking')
export class BookingGrpcController {
    @Inject(BookingGrpcService)
    private readonly bookingGrpcService: BookingGrpcService;

    @GrpcMethod('BookingsGrpcService', 'GetCarIdsByBookingDateRange')
    async getCarIdsByBookingDateRange(data: { start_date: string, end_date: string }) {
        return await this.bookingGrpcService.getCarIdsByBookingDateRange(data.start_date, data.end_date);
    }

    @GrpcMethod('BookingsGrpcService', 'GetEmployeesByBookingDateRange')
    async getEmployeesByBookingDateRange(data: { start_date: string, end_date: string, booking_id: number }) {
        return await this.bookingGrpcService.getEmployeesByBookingDateRange(data.start_date, data.end_date, data.booking_id);
    }
}
