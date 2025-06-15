import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Cars } from "libs/entities";
import { GrpcCarController } from "./grpc-car.controller";
import { GrpcCarService } from "./grpc-car.service";


@Module({
    imports: [
        TypeOrmModule.forFeature([Cars]),
    ],
    controllers: [GrpcCarController],
    providers: [GrpcCarService],
})
export class GrpcCarModule {}  