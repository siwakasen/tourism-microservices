import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from 'libs/entities/';
import { RpcException } from '@nestjs/microservices';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { RegisterCustomerDto } from './grpc-customer.dto';

@Injectable()
export class GrpcCustomerService {
  @InjectRepository(Customer)
  private readonly repository: Repository<Customer>;

  @Inject(AuthHelper)
  private readonly helper: AuthHelper;

  public getCustomerGrpc = async (id: number) => {
    try {
      const customer = await this.repository.findOne({ where: { id }, withDeleted: true });
      if (!customer) {
        throw new RpcException('Customer not found');
      }
      return customer;
    } catch (error) {
      console.error(error);
      throw new RpcException(error.message);
    }
  };

  public async registerCustomerGrpc(body: RegisterCustomerDto) {
    try {
      const customer: Customer = await this.repository.findOne({
        where: { email: body.email },
        withDeleted: true,
      });
      if (customer) {
        throw new RpcException('Email already used');
      }

      const hashedPassword = await this.helper.hashingPassword(body.password);

      const newCustomer = new Customer();
      newCustomer.email = body.email;
      newCustomer.password = hashedPassword;
      newCustomer.name = body.name;
      newCustomer.phone_number = body.phoneNumber;
      newCustomer.country_origin = body.countryOrigin;

      const savedCustomer = await this.repository.save(newCustomer);

      const token = await this.helper.generateToken(savedCustomer);

      return {
        id: savedCustomer.id,
        jwtToken: token,
      };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  public async deleteCustomerGrpc(id: number) {
    try {
      await this.repository.delete(id);
      return { message: 'Customer deleted successfully' };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
