import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { promisify } from 'util';
import { randomBytes, scrypt } from 'crypto';
import { Employee } from 'libs/entities/employees';
import { Customer } from 'libs/entities/customer/customer.entity';
import { AuthServiceClient } from 'libs/entities/grpc-interfaces/auth-grpc.interface';
import { ClientGrpc } from '@nestjs/microservices';
import * as crypto from 'crypto';

@Injectable()
export class AuthHelper implements OnModuleInit {
  private employeeService: AuthServiceClient;
  private customerService: AuthServiceClient;

  onModuleInit() {
    this.employeeService = this.client.getService<AuthServiceClient>('EmployeeService');
    // this.customerService = this.client.getService<AuthServiceClient>('CustomerService');
  }

  private readonly jwt: JwtService;
  private readonly scryptAsync = promisify(scrypt);

  constructor(
    jwt: JwtService,
    @Inject('AUTH_PACKAGE') private client: ClientGrpc,
  ) {
    this.jwt = jwt;
  }

  // Decoding the JWT Token
  public async decode(token: string): Promise<unknown> {
    return this.jwt.decode(token, null);
  }

  // Get User by User ID we get from decode()
  public async validateUser(decoded: any): Promise<Employee> {
    try {
      const employee = await this.employeeService.getEmployee({ id: decoded.sub }).toPromise();
      return employee;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  // Get Customer by Customer ID we get from decode()
  // public async validateCustomer(decoded: any): Promise<Customer> {
  //   try {
  //     return await this.customerService.getCustomer({ id: decoded.id }).toPromise();
  //   } catch (error) {
  //     console.error(error);
  //     return null;
  //   }
  // }

  public generateResetPwToken = (email: string) => {
    return this.jwt.sign(
      { email },
      {
        expiresIn: '1d',
      },
    );
  };

  public verifyResetPwToken = (token: string) => {
    return this.jwt.verify<{ email: string; iat: number }>(token);
  };

  // Generate JWT Token
  public async generateToken( user: Employee | Customer): Promise<string> {
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
    const [hashedPassword, salt] = storedPassword.split('.');
    const buf = await this.scryptAsync(suppliedPassword, salt, 64);

    return buf.toString() === hashedPassword;
  }

  // Encode User's password
  public async encodePassword(password: string): Promise<string> {
    const salt = randomBytes(8).toString('hex');
    const buf = await this.scryptAsync(password, salt, 64);

    return `${buf.toString()}.${salt}`;
  }

  // Generate OTP
  //unused
  public generateOTP(): string {
    switch (process.env.NODE_ENV) {
      case 'test':
        return '0000';
      case 'development':
        return '0000';
      default:
        return `${this.randomNumber()}${this.randomNumber()}${this.randomNumber()}${this.randomNumber()}`;
    }
  }

  private randomNumber(): number {
    return Math.floor(Math.random() * 10);
  }

  // Validate JWT Token, throw forbidden error if JWT Token is invalid
  public async validateToken(token: string): Promise<boolean> {
    try{
      const decoded: unknown = this.jwt.verify(token);
      if (!decoded) {
        throw new UnauthorizedException();
      }
  
      const user = await this.validateUser(decoded);
      // const customer = await this.validateCustomer(decoded);
      
      if (!user) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }

      return true;
    } catch(e) {
      return false;
    }
  }
}
