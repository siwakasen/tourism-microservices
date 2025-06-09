import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GrpcService } from './grpc.service';
import { GrpcController } from './grpc.controller';
import { EmployeeService } from '../employees/employees.service';
import { AuthRedisService } from '../employees/redis.service';
import { AuthModule } from '../employees/employees.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Employee, EmployeeToken } from 'libs/entities';
import { Role } from 'libs/entities/role/role.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'user', property: 'user' }),
    AuthModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_KEY'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES') },
      }),
    }),
    TypeOrmModule.forFeature([Employee, EmployeeToken, Role]),

    ClientsModule.registerAsync([
      {
        inject: [ConfigService],
        name: 'AUTH_PACKAGE',
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: 'contract/auth-employee-api.proto', // Ensure this path is correct
            url: config.get<string>('AUTH_SERVICE'),
          },
        }),
      },
    ]),
  ],
  controllers: [GrpcController], // Only the controller
  providers: [GrpcService, EmployeeService, AuthRedisService],
})
export class GrpcModule {}
