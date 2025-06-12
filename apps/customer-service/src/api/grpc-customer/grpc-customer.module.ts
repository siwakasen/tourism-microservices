import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Customer } from "libs/entities/customer/customer.entity";
import { GrpcCustomerController } from "./grpc-customer.controller";
import { GrpcCustomerService } from "./grpc-customer.service";
import { CustomerModule } from "../customer/customer.module";
import { CustomerToken } from "libs/entities/customer/customer.token.entity";


@Module({
  imports: [
    CustomerModule,
    TypeOrmModule.forFeature([Customer, CustomerToken]),
  ],
  controllers: [GrpcCustomerController],
  providers: [GrpcCustomerService],
})
export class GrpcCustomerModule {}