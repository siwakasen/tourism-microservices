import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employees.service';
import { EmployeeController } from './employees.controller';
import { AuthRedisService } from './redis.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { JwtStrategy } from '@app/helpers/auth/user/auth.strategy';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { MailModule } from '@app/helpers/mail/mail.module';
import { MailService } from '@app/helpers/mail/mail.service';
import { Employee, EmployeeToken, Roles } from 'libs/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, EmployeeToken, Roles]),
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
    MailModule,
  ],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    AuthRedisService,
    MailService,
    JwtStrategy,
    {
      provide: AuthHelper,
      useFactory: (jwt: JwtService, clientEmp: ClientGrpc) => {
        return new AuthHelper(jwt, clientEmp);
      },
      inject: [JwtService, 'EMP_AUTH_PACKAGE'],
    }
  ],
  exports: [
    EmployeeService,
    AuthHelper,
    MailService,
    JwtStrategy,
    AuthRedisService,
  ], // Export as needed
})
export class EmployeeModule {}
