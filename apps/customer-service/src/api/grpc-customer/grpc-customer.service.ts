import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from 'libs/entities/customer/customer.entity';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class GrpcCustomerService {
  @InjectRepository(Customer)
  private readonly repository: Repository<Customer>;

  public getCustomerGrpc = async (id: number) => {
    try {
      const customer = await this.repository.findOne({ where: { id } });
      return customer;
    } catch (error) {
      console.error(error);
      throw new RpcException(error.message);
    }
  }
}
