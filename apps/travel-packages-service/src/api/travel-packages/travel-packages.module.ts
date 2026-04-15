import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TravelPackages } from 'libs/entities';
import { TravelPackagesController } from './travel-packages.controller';
import { TravelPackagesService } from './travel-packages.service';
import { ClientsModule, Transport, ClientGrpc } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { JwtStrategy } from '@app/helpers/auth/user/auth.strategy';
import { RedisService } from './redis.service';

@Module({
  imports: [
    // typeorm module
    TypeOrmModule.forFeature([TravelPackages]),

    // authentication module
    PassportModule.register({ defaultStrategy: 'user', property: 'user' }),

    // jwt module
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_KEY'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES') },
      }),
    }),

    // grpc module
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
  controllers: [TravelPackagesController],
  providers: [
    TravelPackagesService,
    JwtStrategy,
    RedisService,
    {
      provide: AuthHelper,
      useFactory: (jwt: JwtService, clientEmp: ClientGrpc) => {
        // Only pass the employee client, customer client is not needed
        return new AuthHelper(jwt, clientEmp, undefined);
      },
      inject: [JwtService, 'EMP_AUTH_CLIENT'],
    },
  ],
})
export class TravelPackagesModule {}
