// grpc-car.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cars } from 'libs/entities';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class GrpcCarService {
  constructor(
    @InjectRepository(Cars)
    private readonly repository: Repository<Cars>
  ) {}

  public async getCar(id: number) {
    try {
      const car = await this.repository.findOneBy({ id });
      if (!car) {
        throw new Error('Car not found');
      }
      return {
        pricePerDay: car.price_per_day,
        carName: car.car_name,
      };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
