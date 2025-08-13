import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bookings, Payment, BookingAdjustments } from 'libs/entities';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { JwtStrategy } from '@app/helpers/auth/user/auth.strategy';
import { PaymentService } from '../payments/payment.service';
import { AuthRedisService } from '../payments/redis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bookings, Payment, BookingAdjustments]),
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
        name: 'TRAVEL_PACKAGE_CLIENT',
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'travelpackage',
            protoPath: 'contract/travel-package-api.proto',
            url: config.get<string>('TRAVEL_PACKAGE_CLIENT'),
            loader: {
              keepCase: true,
            },
          },
        }),
      },
    ]),
    ClientsModule.registerAsync([
      {
        inject: [ConfigService],
        name: 'CAR_CLIENT',
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'car',
            protoPath: 'contract/rent-car-api.proto',
            url: config.get<string>('CAR_CLIENT'),
            loader: {
              keepCase: true,
            },
          },
        }),
      },
    ]),
    ClientsModule.registerAsync([
      {
        inject: [ConfigService],
        name: 'CUS_AUTH_CLIENT',
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'authcus',
            protoPath: 'contract/auth-customer-api.proto',
            url: config.get<string>('CUS_AUTH_CLIENT'),
          },
        }),
      },
    ]),
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
  controllers: [BookingController],
  providers: [BookingService, PaymentService, AuthRedisService, JwtStrategy, {
    provide: AuthHelper,
    useFactory: (jwt: JwtService, cusAuthClient: ClientGrpc, empAuthClient: ClientGrpc) => {
      return new AuthHelper(jwt, empAuthClient, cusAuthClient);
    },
    inject: [JwtService, 'CUS_AUTH_CLIENT', 'EMP_AUTH_CLIENT'],
  },
],
})
export class BookingModule {}
