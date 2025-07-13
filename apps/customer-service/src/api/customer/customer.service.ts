import {
  HttpStatus,
  HttpException,
  Injectable,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import {
  LoginReqDto,
  RegisterCustomerDto,
  RegisterCustomerResDto,
  requestResetPasswordDto,
  ResetPasswordDto,
  UploadIdentityFileDto,
} from './customer.dto';
import { Customer, CustomerToken, CustomerServiceClient } from 'libs/entities';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { ClientGrpc } from '@nestjs/microservices';
import { MailService } from '@app/helpers/mail/mail.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class CustomerService implements OnModuleInit {
  @Inject('CUS_AUTH_CLIENT')
  private clientCus: ClientGrpc;

  private customerGrpcService: CustomerServiceClient;

  onModuleInit() {
    this.customerGrpcService = this.clientCus.getService<CustomerServiceClient>(
      'CustomerGrpcService',
    );
  }

  @InjectRepository(Customer)
  private readonly repository: Repository<Customer>;

  @InjectRepository(CustomerToken)
  private readonly CustomerTokenRepo: Repository<CustomerToken>;

  @Inject(AuthHelper)
  private readonly helper: AuthHelper;

  @Inject(MailService)
  private readonly mailService: MailService;

  @Inject(DataSource)
  private readonly dataSource: DataSource;

  public async registerCustomer(body: RegisterCustomerDto) {
    try {
      const { email, password, name } = body;

      const user: Customer = await this.repository.findOne({
        where: { email },
      });

      if (user) {
        throw new HttpException(
          { email: 'Email already used' },
          HttpStatus.CONFLICT,
        );
      }

      const hashedPassword = await this.helper.hashingPassword(password);

      const customer = new Customer();
      customer.email = email;
      customer.password = hashedPassword;
      customer.name = name;

      await this.repository.save(customer);

      return {
        data: {
          token: await this.helper.generateToken(customer),
          message: 'Register success',
        },
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.response,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async login(body: LoginReqDto) {
    try {
      const { email, password } = body;

      const user: Customer = await this.repository.findOne({
        where: { email },
      });

      if (!user) {
        throw new HttpException(
          'Email or password may be incorrect',
          HttpStatus.NOT_FOUND,
        );
      }

      const passwordMatched = await this.helper.isPasswordValid(
        user.password,
        password,
      );

      if (!passwordMatched) {
        throw new HttpException(
          'Email or password may be incorrect',
          HttpStatus.UNAUTHORIZED,
        );
      }

      delete user.password;
      return {
        data: {
          message: 'Login success',
          token: await this.helper.generateToken(user),
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getCustomerById(id: number) {
    try {
      const user: Customer = await this.repository.findOne({
        where: { id },
      });

      if (!user) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      delete user.password;
      return {
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
        throw new HttpException(
          { email: 'Email not registered' },
          HttpStatus.NOT_FOUND,
        );
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
        message: 'Link to reset password has been sent to your email',
      };
    } catch (error) {
      throw new HttpException(error.response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async changePassword(payload: ResetPasswordDto) {
    const { token, password }: ResetPasswordDto = payload;
    try {
      const tokenData = await this.helper.decode(token);
      if (!tokenData) {
        throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
      }
      const isTokenExpired = await this.helper.validateTokenExpiration(
        tokenData['exp'],
      );
      if (!isTokenExpired) {
        throw new HttpException('Token Expired', HttpStatus.UNAUTHORIZED);
      }

      const checkToken = await this.CustomerTokenRepo.findOne({
        where: { token },
      });
      if (!checkToken) {
        throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
      }
      if (checkToken.used) {
        throw new HttpException('Token already used', HttpStatus.BAD_REQUEST);
      }

      const user = await this.repository.findOne({
        where: { email: tokenData['email'] },
      });
      if (!user) {
        throw new HttpException(
          'Email or password may be incorrect',
          HttpStatus.NOT_FOUND,
        );
      }
      const hashedPassword = await this.helper.hashingPassword(password);
      user.password = hashedPassword;
      await this.repository.save(user);

      checkToken.used = true;
      await this.CustomerTokenRepo.save(checkToken);

      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async uploadIdentityFile(files: Express.Multer.File[], id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const user = await this.repository.findOne({ where: { id } });
      if (!user) {
        throw new HttpException(
          'Email or password may be incorrect',
          HttpStatus.NOT_FOUND,
        );
      }
      if (user.identity_file) {
        const distPath = path.join(
          './dist/apps/customer-service/public/identity-files',
          user.identity_file[0],
        );
        const distPath2 = path.join(
          './dist/apps/customer-service/public/identity-files',
          user.identity_file[1].toString(),
        );
        console.log(distPath2);
        if (fs.existsSync(distPath) || fs.existsSync(distPath2)) {
          fs.unlinkSync(distPath);
          fs.unlinkSync(distPath2);
          console.log(`Deleted public image: ${distPath} and ${distPath2}`);
        }
      }

      user.identity_file = files.map((file) => file.filename);
      await this.repository.save(user);
      await queryRunner.commitTransaction();
      return {
        message: 'Driver license and identity card uploaded successfully',
      };
    } catch (error) {
      if (files[0]) {
        fs.unlinkSync(files[0].path);
      }
      if (files[1]) {
        fs.unlinkSync(files[1].path);
      }
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }

  public async registerCustomerGrpc(
    body: RegisterCustomerDto,
  ): Promise<RegisterCustomerResDto> {
    try {
      const { id, jwtToken } = await this.customerGrpcService
        .registerCustomer({
          email: body.email,
          password: body.password,
          name: body.name,
          phoneNumber: body.phone_number,
          countryOrigin: body.country_origin,
        })
        .toPromise();
      return {
        data: {
          message: 'Register success',
          token: jwtToken,
          id: id,
        },
      };
    } catch (error) {
      throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
