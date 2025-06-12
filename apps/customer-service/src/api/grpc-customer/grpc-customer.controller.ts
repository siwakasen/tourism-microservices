import { Controller, Inject } from '@nestjs/common';
import { GrpcCustomerService } from './grpc-customer.service';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class GrpcCustomerController {
  @Inject(GrpcCustomerService)
  private readonly grpcCustomerService: GrpcCustomerService;

  @GrpcMethod('CustomerGrpcService', 'GetCustomer')
  async getCustomer(body: { id: number }) {
    const customer = await this.grpcCustomerService.getCustomerGrpc(body.id);
    return customer;
  }
}
