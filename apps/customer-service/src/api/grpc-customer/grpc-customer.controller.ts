import { Controller, Inject } from '@nestjs/common';
import { GrpcCustomerService } from './grpc-customer.service';
import { GrpcMethod } from '@nestjs/microservices';
import { RegisterCustomerDto } from '../customer/customer.dto';
import { Metadata } from '@grpc/grpc-js';
import { ServerUnaryCall } from '@grpc/grpc-js';

@Controller()
export class GrpcCustomerController {
  @Inject(GrpcCustomerService)
  private readonly grpcCustomerService: GrpcCustomerService;

  @GrpcMethod('CustomerGrpcService', 'GetCustomer')
  async getCustomer(body: { id: number }) {
    const customer = await this.grpcCustomerService.getCustomerGrpc(body.id);
    return customer;
  }

  @GrpcMethod('CustomerGrpcService', 'RegisterCustomer')
  async registerCustomer(data: RegisterCustomerDto, metadata: Metadata, call: ServerUnaryCall<any, any>) {
    const response = await this.grpcCustomerService.registerCustomerGrpc(data);
    return response;
  }
}
