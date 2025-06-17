import { Controller, Inject } from '@nestjs/common';
import { GrpcCustomerService } from './grpc-customer.service';
import { GrpcMethod } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { ServerUnaryCall } from '@grpc/grpc-js';
import { RegisterCustomerDto } from './grpc-customer.dto';

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

  @GrpcMethod('CustomerGrpcService', 'DeleteCustomer')
  async deleteCustomer(body: { id: number }) {
    const response = await this.grpcCustomerService.deleteCustomerGrpc(body.id);
    return response;
  }
}
