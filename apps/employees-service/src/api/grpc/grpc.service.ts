import { Injectable } from '@nestjs/common';
import { AuthRedisService } from '../employees/redis.service';
import { RpcException } from '@nestjs/microservices';
import { Employee } from 'libs/entities/employees';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class GrpcService {

  @InjectRepository(Employee)
  private readonly repository: Repository<Employee>;

  public getEmployeeGrpc = async (id: number) => {
    try {
      const employee = await this.repository.findOne({ 
        where: { id },
        relations: ['role'],
        select: ['id', 'name', 'role', 'email']
      });
      
      if (!employee) {
        throw new RpcException('User not Found');
      }

      const transformedEmployee = {
        id: employee.id,
        name: employee.name,
        roleId: employee.role.id,
        email: employee.email,
      };

      return transformedEmployee;
    } catch (error) {
      console.error(error);
      throw new RpcException(error.message);
    }
  };
}
