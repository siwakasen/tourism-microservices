import { Module } from '@nestjs/common';
import { LiveChatGateway } from './live-chat.gateway';
import { LiveChatService } from './live-chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSessions, ChatMessages } from 'libs/entities';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { JwtStrategy } from '@app/helpers/auth/user/auth.strategy';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { LiveChatController } from './live-chat.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([ChatSessions, ChatMessages]),
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
  controllers: [LiveChatController],
  providers: [
    LiveChatGateway,
    LiveChatService,
    JwtStrategy,
    {
      provide: AuthHelper,
      useFactory: (
        jwt: JwtService,
        clientCus: ClientGrpc,
        clientEmp: ClientGrpc
      ) => {
        return new AuthHelper(jwt, clientEmp, clientCus);
      },
      inject: [JwtService, 'CUS_AUTH_CLIENT', 'EMP_AUTH_CLIENT'],
    },
  ],
})
export class LiveChatModule {}
