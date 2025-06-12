import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Customer } from "libs/entities/customer/customer.entity";
import { GrpcCustomerController } from "./grpc-customer.controller";
import { GrpcCustomerService } from "./grpc-customer.service";
import { ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "@app/helpers/auth/user/auth.strategy";
import { CustomerService } from "../customer/customer.service";
import { CustomerModule } from "../customer/customer.module";


@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'user', property: 'user' }),
    CustomerModule,
    JwtModule.registerAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
            secret: config.get('JWT_KEY'),
            signOptions: { expiresIn: config.get('JWT_EXPIRES') },
        }),
    }),
    TypeOrmModule.forFeature([Customer]),
    ClientsModule.registerAsync([
      {
        inject: [ConfigService],
        name: 'CUS_PACKAGE',
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: 'contract/auth-customer-api.proto',
            url: config.get<string>('CUS_AUTH_SERVICE'),
          },
        }),
      },
    ]),
  ],
  controllers: [GrpcCustomerController],
  providers: [GrpcCustomerService, CustomerService],
})
export class GrpcCustomerModule {}