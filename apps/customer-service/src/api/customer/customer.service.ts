import { Injectable } from '@nestjs/common';
import { RegisterCustomerDto } from './customer.dto';

@Injectable()
export class CustomerService {
  getHello(): string {
    return 'Hello World!';
  }

  public async registerCustomer(body: RegisterCustomerDto) {
    const { email, password, name } = body;
  }
}
