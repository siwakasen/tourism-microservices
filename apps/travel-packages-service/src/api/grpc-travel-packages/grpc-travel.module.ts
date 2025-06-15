import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TravelPackages } from "libs/entities";
import { GrpcTravelPackagesController } from "./grpc-travel.controller";
import { GrpcTravelPackagesService } from "./grpc-travel.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([TravelPackages]),
  ],
  controllers: [GrpcTravelPackagesController],
  providers: [GrpcTravelPackagesService],
})
export class GrpcTravelPackagesModule {}