import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { JwtStrategy } from '@app/helpers/auth/user/auth.strategy';

@Module({
  imports: [
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
  controllers: [ReportController],
  providers: [
    ReportService,
    JwtStrategy,
    {
      provide: AuthHelper,
      useFactory: (jwt: JwtService, clientEmp: ClientGrpc) => {
        return new AuthHelper(jwt, clientEmp);
      },
      inject: [JwtService, 'EMP_AUTH_CLIENT'],
    },
  ],
})
export class ReportModule {}
