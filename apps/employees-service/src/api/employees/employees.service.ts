import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from 'libs/entities/employees/employee.entity';
import { DataSource, Repository } from 'typeorm';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  LoginReqDto,
  PaginationEmployeeDto,
  RegisterOwnerDto,
  RegisterOwnerResponseDto,
  requestResetPasswordDto,
  ResetPasswordDto,
} from './employees.dto';
import { AuthRedisService } from './redis.service';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { EmployeeToken } from 'libs/entities';
import { MailService } from '@app/helpers/mail/mail.service';
import { FormatErrorInterceptor } from 'libs/helpers/interceptors/exeption.interceptor';
import { Role } from 'libs/entities/role/role.entity';

@Injectable()
@UseInterceptors(FormatErrorInterceptor)
export class EmployeeService {
  constructor(
    private readonly redisService: AuthRedisService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}
  @InjectRepository(Role)
  private readonly roleRepository: Repository<Role>;
  @InjectRepository(Employee)
  private readonly repository: Repository<Employee>;
  @Inject(AuthHelper)
  private readonly helper: AuthHelper;
  @InjectRepository(EmployeeToken)
  private readonly EmployeeTokenRepo: Repository<EmployeeToken>;

  public async registerOwner(body: RegisterOwnerDto): Promise<RegisterOwnerResponseDto> {
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

    return{
      success: true,
      message: 'Owner registered successfully',
    }
  }

  public login = async (body: LoginReqDto) => {
    const { email, password }: LoginReqDto = body;
    const user = await this.repository.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new HttpException(
        `Email not registered or not verified`,
        HttpStatus.NOT_FOUND,
      );
    }

    const passwordMatched = await this.helper.isPasswordValid(
      user.password,
      password,
    );

    if (!passwordMatched) {
      throw new HttpException(
        `Invalid Credentials`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    delete user.password;
    return {
      success: true,
      data: { message: 'Login success', token: await this.helper.generateToken(user) },
    };
  };

  public async requestResetPassword(
    payload: requestResetPasswordDto,
  ): Promise<void> {
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
    
    const url = `${process.env.FRONTEND_URL}/reset-password/` + hashedEmail;
    this.mailService.requestResetPassword({
      email: email,
      url: url,
    });
    const currentDate = new Date();
    await this.EmployeeTokenRepo.save({
      token: hashedEmail,
      expiredAt: currentDate,
    });
  }


  public async changePassword(payload: ResetPasswordDto) {
    const { token, password }: ResetPasswordDto = payload;

    try {
      const tokenData = await this.helper.decode(token);
      if (!tokenData) {
        throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
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
      return {
        success: true,
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
          'role.role_name'
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
        }
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

      const employee = await queryBuilder.where('employees.id = :id', { id })
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
        'role.role_name'
      ]).getOne();

      if (!employee) {
        throw new Error('Not Found');
      }
      return{
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

  public async createEmployee(payload: CreateEmployeeDto) {
    console.log(payload);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if(payload.role_id == 1) {
        throw new HttpException('New Owner cannot be created', HttpStatus.BAD_REQUEST);
      }
      const role = await this.roleRepository.findOne({ where: { id: payload.role_id } });
      const hashedPassword = await this.helper.hashingPassword(payload.password);

      const employee: Employee = this.repository.create({
        ...payload,
        role: role,
        password: hashedPassword
      });

      const user = await this.repository.findOne({
        where: { email: payload.email },
      });

      if (user) {
        throw new HttpException(
          `Email already registered`,
          HttpStatus.BAD_REQUEST,
        );
      }

      await queryRunner.manager.save(employee);
      await queryRunner.commitTransaction();

      return {
        success: true,
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
      if(payload.role_id == 1) {
        throw new HttpException('Cannot change admin into owner', HttpStatus.BAD_REQUEST);
      }
      const newRole = await this.roleRepository.findOne({ where: { id: payload.role_id } });
      if(!newRole) {
        throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
      }

      const employee = await this.repository.findOne({ where: { id }, relations: ['role'] });
      if (!employee) {
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }

      
      this.repository.merge(employee, payload);
      if(payload.role_id) {
        const role = await this.roleRepository.findOne({ where: { id: payload.role_id } });
        employee.role = role;
      }
      await queryRunner.manager.save(employee);
      await queryRunner.commitTransaction();
      return {
        success: true,
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
      const employee = await this.repository.findOne({ where: { id }, relations: ['role'] });

      if(!employee) {
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }
      if(employee.role.id == 1) {
        throw new HttpException('Cannot delete owner', HttpStatus.BAD_REQUEST);
      }
      await queryRunner.manager.softDelete(Employee, id);
      await queryRunner.commitTransaction();
      return {
        success: true,
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
}