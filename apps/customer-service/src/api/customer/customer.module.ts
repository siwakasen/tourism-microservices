import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import {  ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { MailModule } from '@app/helpers/mail/mail.module';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { JwtStrategy } from '@app/helpers/auth/user/auth.strategy';
import { Customer, CustomerToken } from 'libs/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerToken]),
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
        name: 'CUS_AUTH_CLIENT',
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'authcus',
            protoPath: 'contract/auth-customer-api.proto',
            url: config.get<string>('CUS_AUTH_CLIENT'),
            loader: {
              keepCase: true,
            },
          },
        }),
      },
    ]),
    MailModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService, JwtStrategy, {
    provide: AuthHelper,
    useFactory: (jwt: JwtService, clientCus: ClientGrpc) => {
      console.log('[CustomerModule] Initializing AuthHelper with customer GRPC client');
      return new AuthHelper(jwt, undefined, clientCus);
    },
    inject: [JwtService, 'CUS_AUTH_CLIENT'],
  }],
  exports: [CustomerService, AuthHelper, JwtStrategy],
})
export class CustomerModule {}
