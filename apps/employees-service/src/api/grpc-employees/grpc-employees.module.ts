import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrpcService } from './grpc-employees.service';
import { EmployeesGrpcController } from './grpc-employees.controller';
import { RedisService } from '../employees/redis.service';
import { EmployeeModule } from '../employees/employees.module';
import { Employee, EmployeeToken, Roles } from 'libs/entities';

@Module({
  imports: [
    EmployeeModule,
    TypeOrmModule.forFeature([Employee, EmployeeToken, Roles]),
  ],
  controllers: [EmployeesGrpcController],
  providers: [GrpcService, RedisService],
})
export class GrpcModule {}
