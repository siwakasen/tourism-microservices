import {
  Injectable,
  Inject,
  OnModuleInit,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmployeeServiceClient, Customer, Employee, CustomerServiceClient } from 'libs/entities';
import { ClientGrpc } from '@nestjs/microservices';
import * as crypto from 'crypto';

@Injectable()
export class AuthHelper implements OnModuleInit {
  private employeeService?: EmployeeServiceClient;
  private customerService?: CustomerServiceClient;

  onModuleInit() {
    try {
      if (this.clientEmp) {
        this.employeeService = this.clientEmp.getService<EmployeeServiceClient>('EmployeeGrpcService');
        if (!this.employeeService) {
          throw new Error('Failed to initialize employee service');
        }
      }
      if (this.clientCus) {
        this.customerService = this.clientCus.getService<CustomerServiceClient>('CustomerGrpcService');
        if (!this.customerService) {
          throw new Error('Failed to initialize customer service');
        }
      }
    } catch (error) {
      console.error('Failed to initialize gRPC services:', error);
      throw error;
    }
  }

  private readonly jwt: JwtService;

  constructor(
    jwt: JwtService,
    @Inject('EMP_AUTH_CLIENT') private clientEmp?: ClientGrpc,
    @Inject('CUS_AUTH_CLIENT') private clientCus?: ClientGrpc,
  ) {
    this.jwt = jwt;
  }

  // Decoding the JWT Token
  public async decode(token: string): Promise<unknown> {
    return this.jwt.decode(token, null);
  }

  public async validateTokenExpiration(exp: number): Promise<boolean> { 
    if(exp < Math.floor(Date.now() / 1000)) {
      return false;

    }
    return true;
  }

  // Get User by User ID we get from decode()
  public async validateUser(decoded: any): Promise<Employee | Customer> {
    try {
      if (this.employeeService && decoded.type === 'emp') {
        const employee = await this.employeeService.getEmployee({ id: decoded.sub }).toPromise();
        return employee;
      }else{
        const customer = await this.customerService.getCustomer({ id: decoded.sub }).toPromise();
        return customer;
      }
    } catch (error) {
      return null;
    }
  }


  public generateResetPwToken = (email: string) => {
    return this.jwt.sign(
      { 
        sub: email,
        iat: Math.floor(Date.now() / 1000)
       },
      {
        algorithm: 'HS256',
        secret: process.env.JWT_KEY,
        expiresIn: '4h',
      },
    );
  };

  public verifyResetPwToken = (token: string) => {
    return this.jwt.verify<{ email: string; iat: number }>(token);
  };

  // Generate JWT Token
  public async generateToken(user: Employee | Customer): Promise<string> {
    return this.jwt.signAsync({
      sub: user.id.toString(), // subject claim for user ID
      type: user instanceof Employee ? 'emp' : 'cus',
      jti: crypto.randomUUID(), // unique token ID
      iat: Math.floor(Date.now() / 1000), // issued at timestamp
    },{
      algorithm: 'HS256',
      secret: process.env.JWT_KEY,
      expiresIn: '12h',
    });
  }

  // Validate User's password
  public async isPasswordValid(
    storedPassword: string,
    suppliedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(suppliedPassword, storedPassword);
  }

  // Encode User's password
  public async hashingPassword(password: string): Promise<string> {
    const saltRounds = 12; 
    return bcrypt.hash(password, saltRounds);
  }
}
