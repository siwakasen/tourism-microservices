import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cars } from 'libs/entities';
import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';

import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { JwtStrategy } from '@app/helpers/auth/user/auth.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cars]),
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
        name: 'EMP_AUTH_PACKAGE',
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: 'contract/auth-employee-api.proto', // Ensure this path is correct
            url: config.get<string>('EMP_AUTH_CLIENT'),
          },
        }),
      },
    ]),
  ],
  controllers: [CarsController],
  providers: [CarsService, JwtStrategy, {
    provide: AuthHelper,
    useFactory: (jwt: JwtService, clientEmp: ClientGrpc) => {
      return new AuthHelper(jwt, clientEmp);
    },
    inject: [JwtService, 'EMP_AUTH_PACKAGE'],
  }],
})
export class CarsModule {}
