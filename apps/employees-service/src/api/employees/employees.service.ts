import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  LoginReqDto,
  PaginationEmployeeDto,
  RegisterOwnerDto,
  RegisterOwnerResponseDto,
  requestResetPasswordDto,
  ResetPasswordDto,
  AvailableEmployeesDto,
} from './employees.dto';
import { AuthRedisService } from './redis.service';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { MailService } from '@app/helpers/mail/mail.service';
import { FormatErrorInterceptor } from 'libs/helpers/interceptors/exeption.interceptor';
import { Employee, EmployeeToken, Roles } from 'libs/entities';
import { BookingsServiceClient } from 'libs/entities/grpc-interfaces/bookings.interface';
import { ClientGrpc } from '@nestjs/microservices';

@Injectable()
@UseInterceptors(FormatErrorInterceptor)
export class EmployeeService implements OnModuleInit {
  constructor(
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}
  @InjectRepository(Roles)
  private readonly roleRepository: Repository<Roles>;
  @InjectRepository(Employee)
  private readonly repository: Repository<Employee>;
  @Inject(AuthHelper)
  private readonly helper: AuthHelper;
  @InjectRepository(EmployeeToken)
  private readonly EmployeeTokenRepo: Repository<EmployeeToken>;

  @Inject('BOOKINGS_CLIENT')
  private clientBookings: ClientGrpc;
  private bookingsGrpcService: BookingsServiceClient;

  onModuleInit() {
    this.bookingsGrpcService =
      this.clientBookings.getService<BookingsServiceClient>(
        'BookingsGrpcService',
      );
  }

  public async registerOwner(
    body: RegisterOwnerDto,
  ): Promise<RegisterOwnerResponseDto> {
    const { email, password, name, role_id }: RegisterOwnerDto = body;
    const user: Employee = await this.repository.findOne({
      where: { role: { id: 1 } },
    });

    if (user) {
      throw new HttpException('Owner already exist', HttpStatus.CONFLICT);
    }

    const role = await this.roleRepository.findOne({ where: { id: role_id } });

    const hashedPassword = await this.helper.hashingPassword(password);
    const owner = new Employee();
    owner.email = email;
    owner.name = name;
    owner.role = role;
    owner.password = hashedPassword;

    await this.repository.save(owner);

    return {
      message: 'Owner registered successfully',
    };
  }

  public login = async (body: LoginReqDto) => {
    const { email, password }: LoginReqDto = body;
    const user = await this.repository.findOne({
      where: {
        email: email,
      },
      relations: {
        role: true,
      },
    });

    if (!user) {
      throw new HttpException(`Email or password may be incorrect`, HttpStatus.BAD_REQUEST);
    }

    const passwordMatched = await this.helper.isPasswordValid(
      user.password,
      password,
    );

    if (!passwordMatched) {
      throw new HttpException(`Email or password may be incorrect`, HttpStatus.UNAUTHORIZED);
    }

    // delete user.password;
    return {
      data: {
        message: 'Login success',
        token: await this.helper.generateToken(user),
      },
    };
  };

  public async requestResetPassword(payload: requestResetPasswordDto) {
    const { email } = payload;

    const user = await this.repository.findOne({
      where: { email },
    });
    if (!user) {
      throw new HttpException(
        `User with email ${email} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const hashedEmail = this.helper.generateResetPwToken(email);

    const url =
      `${process.env.FRONTEND_URL}/forget-password/execute/` + hashedEmail;
    this.mailService.requestResetPassword({
      email: email,
      url: url,
    });
    const currentDate = new Date();
    await this.EmployeeTokenRepo.save({
      token: hashedEmail,
      expiredAt: currentDate,
    });

    return {
      message: 'Link to reset password has been sent to your email',
    };
  }

  public async changePassword(payload: ResetPasswordDto) {
    const { token, password }: ResetPasswordDto = payload;

    try {
      const tokenData = await this.helper.decode(token);
      if (!tokenData) {
        throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
      }

      if (tokenData['exp'] < Math.floor(Date.now() / 1000)) {
        throw new HttpException('Token Expired', HttpStatus.BAD_REQUEST);
      }

      const checkToken = await this.EmployeeTokenRepo.findOne({
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
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const hashedPassword = await this.helper.hashingPassword(password);
      user.password = hashedPassword;

      user.last_update_password = new Date();
      user.save();

      checkToken.used = true;
      await this.EmployeeTokenRepo.save(checkToken);

      return {
        message: 'Success change password',
      };
    } catch (e) {
      throw new HttpException(
        {
          message: [e.message || 'Failed to update password'],
          error: e.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getAllEmployees(paginationDto: PaginationEmployeeDto) {
    try {
      const { page = 1, limit = 10, search = '' } = paginationDto;
      const queryBuilder = this.repository
        .createQueryBuilder('employees')
        .leftJoinAndSelect('employees.role', 'role')
        .select([
          'employees.id',
          'employees.name',
          'employees.email',
          'employees.salary',
          'employees.last_update_password',
          'employees.created_at',
          'employees.updated_at',
          'employees.deleted_at',
          'role.id',
          'role.role_name',
        ])
        .orderBy('employees.created_at', 'DESC');

      const conditions: string[] = [];

      const parameters: Record<string, any> = {};
      if (search) {
        conditions.push(`employees.name ILIKE :search`);
        conditions.push(`employees.email ILIKE :search`);
        conditions.push(`role.role_name ILIKE :search`);
        conditions.push(`CAST(employees.salary AS TEXT) ILIKE :search`);
        parameters['search'] = `%${search}%`;
      }

      if (conditions.length) {
        queryBuilder.where(conditions.join(' OR '), parameters);
      }

      const [result, total] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;

      return {
        data: result,
        meta: {
          totalItems: total,
          currentPage: page,
          totalPages,
          limit,
          hasNextPage,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          message: [error.message || 'Failed to fetch employees'],
          error: error.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getEmployeeById(id: number) {
    try {
      const queryBuilder = this.repository.createQueryBuilder('employees');

      const employee = await queryBuilder
        .where('employees.id = :id', { id })
        .leftJoinAndSelect('employees.role', 'role')
        .select([
          'employees.id',
          'employees.name',
          'employees.email',
          'employees.salary',
          'employees.last_update_password',
          'employees.created_at',
          'employees.updated_at',
          'employees.deleted_at',
          'role.id',
          'role.role_name',
        ])
        .getOne();

      if (!employee) {
        throw new Error('Not Found');
      }
      return {
        data: employee,
        message: 'Successfully get data employee by id',
      };
    } catch (error) {
      if (error.message === 'Not Found') {
        throw new HttpException(
          {
            message: ['Employee not found'],
            error: 'Employee not found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Failed to fetch employee'],
          error: error.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getAvailableEmployees(payload: AvailableEmployeesDto) {
    const { start_date, end_date, role_id } = payload;
    const { employee_ids } = await this.bookingsGrpcService
      .getEmployeesByBookingDateRange({ start_date, end_date })
      .toPromise();
    const queryBuilder = this.repository
      .createQueryBuilder('employees')
      .leftJoinAndSelect('employees.role', 'role')
      .select([
        'employees.id',
        'employees.name',
        'employees.email',
        'employees.salary',
        'employees.last_update_password',
        'employees.created_at',
        'employees.updated_at',
        'employees.deleted_at',
        'role.id',
        'role.role_name',
      ])
      .orderBy('employees.created_at', 'DESC');
    if (employee_ids && role_id) {
      queryBuilder
        .where('employees.id NOT IN (:...employee_ids)', { employee_ids })
        .andWhere('role.id = :roleId', { roleId: role_id });
    } else if (employee_ids) {
      queryBuilder.where('employees.id NOT IN (:...employee_ids)', {
        employee_ids,
      });
    } else if (role_id) {
      queryBuilder.where('role.id = :roleId', { roleId: role_id });
    }

    const [result] = await queryBuilder.getManyAndCount();

    return {
      data: Array.isArray(result) ? result : [result],
      message: 'Successfully get available employees',
    };
  }

  public async createEmployee(payload: CreateEmployeeDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (payload.role_id == 1) {
        throw new HttpException(
          'New Owner cannot be created',
          HttpStatus.BAD_REQUEST,
        );
      }
      const role = await this.roleRepository.findOne({
        where: { id: payload.role_id },
      });
      const hashedPassword = await this.helper.hashingPassword(
        payload.password,
      );

      const user = await this.repository.findOne({
        where: { email: payload.email },
        withDeleted: true,
      });

      if (user) {
        throw new HttpException(`Email already used`, HttpStatus.CONFLICT);
      }



      const employee: Employee = this.repository.create({
        ...payload,
        role: role,
        password: hashedPassword,
      });
      await queryRunner.manager.save(employee);
      await queryRunner.commitTransaction();

      return {
        message: 'Successfully create employee',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        {
          message: [error.message || 'Failed to create employee'],
          error: error.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }
  public async updateEmployee(id: number, payload: UpdateEmployeeDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      
      const newRole = await this.roleRepository.findOne({
        where: { id: payload.role_id },
      });
      if (!newRole) {
        throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
      }

      const employee = await this.repository.findOne({
        where: { id },
        relations: ['role'],
      });
      if (!employee) {
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }
      if (payload.role_id == 1 && employee.role.id != 1) {
        throw new HttpException(
          'Cannot change admin into owner',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.repository.merge(employee, payload);
      if (payload.role_id) {
        const role = await this.roleRepository.findOne({
          where: { id: payload.role_id },
        });
        employee.role = role;
      }
      await queryRunner.manager.save(employee);
      await queryRunner.commitTransaction();
      return {
        message: 'Successfully update employee',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        {
          message: [error.message || 'Failed to update employee'],
          error: error.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async deleteEmployee(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const employee = await this.repository.findOne({
        where: { id },
        relations: ['role'],
      });

      if (!employee) {
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }
      if (employee.role.id == 1) {
        throw new HttpException('Cannot delete owner', HttpStatus.BAD_REQUEST);
      }
      await queryRunner.manager.softDelete(Employee, id);
      await queryRunner.commitTransaction();
      return {
        message: 'Successfully delete employee',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        {
          message: [error.message || 'Failed to delete employee'],
          error: error.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async verifyToken(token: string) {
    const tokenData = await this.helper.verifyResetPwToken(token);
    if (!tokenData) {
      throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
    }
    return tokenData;
  }
}
