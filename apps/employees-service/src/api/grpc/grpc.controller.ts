import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GrpcService } from './grpc.service';
import { Employee } from 'libs/entities/employees';

@Controller()
export class GrpcController {
  @Inject(GrpcService)
  private readonly grpcService: GrpcService;

  @GrpcMethod('EmployeeService', 'GetEmployee')
  async getEmployee(body: { id: number }) {
    const user = await this.grpcService.getEmployeeGrpc(body.id);
    return user;
  }
}
