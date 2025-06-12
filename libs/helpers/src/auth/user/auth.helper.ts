import {
  Injectable,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Employee } from 'libs/entities/employees';
import { Customer } from 'libs/entities/customer/customer.entity';
import { AuthServiceClient } from 'libs/entities/grpc-interfaces/auth-grpc.interface';
import { ClientGrpc } from '@nestjs/microservices';
import * as crypto from 'crypto';

@Injectable()
export class AuthHelper implements OnModuleInit {
  private employeeService?: AuthServiceClient;
  private customerService?: AuthServiceClient;

  onModuleInit() {
    if (this.clientEmp) {
      this.employeeService = this.clientEmp.getService<AuthServiceClient>('EmployeeGrpcService');
    }
    if (this.clientCus) {
      this.customerService = this.clientCus.getService<AuthServiceClient>('CustomerGrpcService');
    }
  }

  private readonly jwt: JwtService;

  constructor(
    jwt: JwtService,
    @Inject('EMP_PACKAGE') private clientEmp?: ClientGrpc,
    @Inject('CUS_PACKAGE') private clientCus?: ClientGrpc,
  ) {
    this.jwt = jwt;
  }

  // Decoding the JWT Token
  public async decode(token: string): Promise<unknown> {
    console.log('token', token);
    return this.jwt.decode(token, null);
  }

  // Get User by User ID we get from decode()
  public async validateUser(decoded: any): Promise<Employee | Customer> {
    try {
      if (this.employeeService) {
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
      { email },
      {
        expiresIn: 2000,
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
      jti: crypto.randomUUID(), // unique token ID
      iat: Math.floor(Date.now() / 1000), // issued at timestamp
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
