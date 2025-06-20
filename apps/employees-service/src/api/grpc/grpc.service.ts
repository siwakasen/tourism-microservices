import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Employee } from 'libs/entities';
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
        throw new RpcException('Employee not Found');
      }

      const transformedEmployee = {
        id: employee.id,
        name: employee.name,
        roleId: employee.role.id,
        email: employee.email,
      };

      return transformedEmployee;
    } catch (error) {
      throw new RpcException(error.error);
    }
  };
}
