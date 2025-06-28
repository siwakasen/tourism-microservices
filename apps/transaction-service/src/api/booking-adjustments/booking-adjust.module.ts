import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookingAdjustments, Bookings, Payment, Refunds } from "libs/entities";
import { BookingAdjustmentController } from "./booking-adjust.controller";
import { BookingAdjustmentService } from "./booking-adjust.service";
import { PassportModule } from "@nestjs/passport";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ClientGrpc, ClientsModule, Transport } from "@nestjs/microservices";
import { AuthHelper } from "@app/helpers/auth/user/auth.helper";
import { JwtStrategy } from "@app/helpers/auth/user/auth.strategy";
import { RefundService } from "../refunds/refund.service";


@Module({
    imports: [
        TypeOrmModule.forFeature([BookingAdjustments, Refunds, Bookings, Payment]),
        PassportModule.register({ defaultStrategy: 'user', property: 'user' }),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_KEY'),
                signOptions: { expiresIn: config.get('JWT_EXPIRES') },
            }),
        }),
          ClientsModule.registerAsync([
            {
                inject: [ConfigService],
                name: 'EMP_AUTH_CLIENT',
                useFactory: (config: ConfigService) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'authemp',
                        protoPath: 'contract/auth-employee-api.proto',
                        url: config.get<string>('EMP_AUTH_CLIENT'),
                        loader: {
                            keepCase: true,
                        },
                    },
                }),
            },
        ]),
    ],
    
    controllers: [BookingAdjustmentController],
    providers: [BookingAdjustmentService, JwtStrategy, RefundService,{
        provide: AuthHelper,
        useFactory: (jwt: JwtService,  empAuthClient: ClientGrpc) => {
          return new AuthHelper(jwt, empAuthClient  );
        },
        inject: [JwtService, 'EMP_AUTH_CLIENT'],
      }],
})
export class BookingAdjustmentModule {}