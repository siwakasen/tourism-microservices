import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Bookings } from "libs/entities";
import { BookingGrpcController } from "./booking-grpc.controller";
import { BookingGrpcService } from "./booking-grpc.service";



@Module({
    imports: [
        TypeOrmModule.forFeature([Bookings]),
    ],
    controllers: [BookingGrpcController],
    providers: [BookingGrpcService],
})
export class BookingGrpcModule {}