import { HttpStatus, HttpException, Injectable, Inject } from '@nestjs/common';
import { LoginReqDto, RegisterCustomerDto } from './customer.dto';
import { Customer } from 'libs/entities/customer/customer.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';

@Injectable()
export class CustomerService {

  @InjectRepository(Customer)
  private readonly repository: Repository<Customer>;

  @Inject(AuthHelper)
  private readonly helper: AuthHelper;

  public async registerCustomer(body: RegisterCustomerDto) {
    try {
    const { email, password, name } = body;

    const user: Customer = await this.repository.findOne({
      where: { email },
    });

    if (user) {
      throw new HttpException('Customer already exists', HttpStatus.CONFLICT);
    }

    const hashedPassword = await this.helper.hashingPassword(password);

    const customer = new Customer();
    customer.email = email;
    customer.password = hashedPassword;
    customer.name = name; 

    await this.repository.save(customer);

    return {
      success: true,
        message: 'Customer registered successfully',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async login(body: LoginReqDto) {
    try {
    const { email, password } = body;

    const user: Customer = await this.repository.findOne({
      where: { email },
    });

    if (!user) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    const passwordMatched = await this.helper.isPasswordValid(user.password, password);
    
    if (!passwordMatched) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    delete user.password;
    return {
      success: true,
      data: { 
        message: 'Login success',
        token: await this.helper.generateToken(user),
      },
    };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  public async getMyData(id: number) {
    try {
    const user: Customer = await this.repository.findOne({
      where: { id },
    });

    if (!user) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    delete user.password;
    return {
      success: true,
      data: user,
    };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
