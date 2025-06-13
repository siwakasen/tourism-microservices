import { HttpStatus, HttpException, Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { LoginReqDto, RegisterCustomerDto, requestResetPasswordDto, ResetPasswordDto } from './customer.dto';
import { Customer } from 'libs/entities/customer/customer.entity';
import {  Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { ClientGrpc } from '@nestjs/microservices';
import { CustomerServiceClient } from 'libs/entities/grpc-interfaces/customer-grpc.interface';

import { CustomerToken } from 'libs/entities/customer/customer.token.entity';
import { MailService } from '@app/helpers/mail/mail.service';

@Injectable()
export class CustomerService implements OnModuleInit {

  @Inject('CUS_PACKAGE')
  private clientCus: ClientGrpc;

  private customerGrpcService: CustomerServiceClient;

  onModuleInit() {
    this.customerGrpcService = this.clientCus.getService<CustomerServiceClient>('CustomerGrpcService');
  }

  @InjectRepository(Customer)
  private readonly repository: Repository<Customer>;

  @InjectRepository(CustomerToken)
  private readonly CustomerTokenRepo: Repository<CustomerToken>;

  @Inject(AuthHelper)
  private readonly helper: AuthHelper;

  @Inject(MailService)
  private readonly mailService: MailService;

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

  public async requestResetPassword(payload: requestResetPasswordDto) {
    try {
      const { email } = payload;
      const user = await this.repository.findOne({ where: { email } });
      if (!user) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }
      const hashedEmail = this.helper.generateResetPwToken(email);
      const url = `${process.env.FRONTEND_URL}/reset-password/` + hashedEmail;
      this.mailService.requestResetPassword({
        email: email,
        url: url,
      });
      const currentDate = new Date();
      await this.CustomerTokenRepo.save({
        token: hashedEmail,
        created_at: currentDate,
      });
      return {
        success: true,
        message: 'Link to reset password has been sent to your email',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async changePassword(payload: ResetPasswordDto) {
    const { token, password }: ResetPasswordDto = payload;
    try {
      const tokenData = await this.helper.decode(token);
      if (!tokenData) {
        throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
      }
      
      if(tokenData['exp'] < Math.floor(Date.now() / 1000)) {
        throw new HttpException('Token Expired', HttpStatus.BAD_REQUEST);
      }
      
      const checkToken = await this.CustomerTokenRepo.findOne({ where: { token } });
      if (!checkToken) {
        throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
      }
      if(checkToken.used) {
        throw new HttpException('Token already used', HttpStatus.BAD_REQUEST);
      }

      

      const user = await this.repository.findOne({ where: { email: tokenData['email'] } });
      if (!user) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }
      const hashedPassword = await this.helper.hashingPassword(password);
      user.password = hashedPassword;
      await this.repository.save(user);

      checkToken.used = true;
      await this.CustomerTokenRepo.save(checkToken);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }




  public async registerCustomerGrpc(body: RegisterCustomerDto) {
    try {
      const {id,jwtToken} = await this.customerGrpcService.registerCustomer({
        email: body.email,
        password: body.password,
        name: body.name,
        phoneNumber: body.phone_number ,
        countryOrigin: body.country_origin,
      }).toPromise();
      return {
        success: true,
        data: {
          message: 'Customer registered successfully',
          token: jwtToken,
          id: id,
        },
      };
    } catch (error) {
      throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  
}
