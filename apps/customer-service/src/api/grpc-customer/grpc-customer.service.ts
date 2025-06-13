import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from 'libs/entities/customer/customer.entity';
import { RpcException } from '@nestjs/microservices';
import { RegisterCustomerDto } from '../customer/customer.dto';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';

@Injectable()
export class GrpcCustomerService {

  @InjectRepository(Customer)
  private readonly repository: Repository<Customer>;

  @Inject(AuthHelper)
  private readonly helper: AuthHelper;

  public getCustomerGrpc = async (id: number) => {
    try {
      const customer = await this.repository.findOne({ where: { id } });
      return customer;
    } catch (error) {
      console.error(error);
      throw new RpcException(error.message);
    }
  }

  public registerCustomerGrpc = async (body: RegisterCustomerDto) => {
    try {
      const customer: Customer = await this.repository.findOne({ where: { email: body.email } });
      if (customer) {
        throw new RpcException('Customer already exists');
      }

      const hashedPassword = await this.helper.hashingPassword(body.password);

      const newCustomer = await this.repository.save({
        ...body,
        password: hashedPassword,
      });
      return {
        id: newCustomer.id,
        jwtToken: await this.helper.generateToken(newCustomer),
      };
      
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
