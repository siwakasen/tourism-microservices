import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrpcService } from './grpc.service';
import { GrpcController } from './grpc.controller';
import { AuthRedisService } from '../employees/redis.service';
import {  EmployeeModule } from '../employees/employees.module';
import { Employee, EmployeeToken, Roles } from 'libs/entities';

@Module({
  imports: [
    EmployeeModule,
    TypeOrmModule.forFeature([Employee, EmployeeToken, Roles]),

  ],
  controllers: [GrpcController],
  providers: [GrpcService, AuthRedisService],
})
export class GrpcModule {}
