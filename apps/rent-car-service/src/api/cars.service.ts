import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cars } from 'libs/entities';
import {
  PaginationDto,
  CreateUpdateCarsDto
} from './cars.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CarsService {
  constructor(private readonly dataSource: DataSource) {}

  @InjectRepository(Cars)
  private readonly repository: Repository<Cars>;

  public async getAllCars(paginationDto: PaginationDto) {
    try {
      const { page = 1, limit = 10, search = '' } = paginationDto;
      const queryBuilder = this.repository
        .createQueryBuilder('cars')
        .orderBy('cars.created_at', 'DESC');

      const conditions: string[] = [];

      const parameters: Record<string, any> = {};
      if (search) {
        conditions.push(`cars.car_name ILIKE :search`);
        parameters['search'] = `%${search}%`;
      }

      if (conditions.length) {
        queryBuilder.where(conditions.join(' AND '), parameters);
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
          message: [error.message || 'Failed to fetch data cars'],
          error: error.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getCarById(id: number) {
    try {
      const queryBuilder = this.repository.createQueryBuilder('cars');

      const car = await queryBuilder.where('cars.id = :id', { id }).getOne();

      if (!car) {
        throw new Error('Car not found');
      }

      return {
        data: car,
        message: 'Successfully get data car by id',
      };
    } catch (error) {
      if (error.message === 'Car not found') {
        throw new HttpException(
          {
            message: ['Car not found'],
            error: 'Car not found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Failed to fetch car'],
          error: error.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async createCar(payload: CreateUpdateCarsDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const car: Cars = this.repository.create({
        ...payload,
      });

      await queryRunner.manager.save(car);
      await queryRunner.commitTransaction();

      return {
        data: {
          ...car,
        },
        message: 'Car created successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        {
          message: [error.message || 'Failed to create new car'],
          error: error.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async uploadImage(id: number, image: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const car: Cars = await this.repository.findOneBy({ id });

      if (!car) {
        throw new Error('Car not found');
      }
      if (car.car_image) {
        const distPath = path.join(
          './dist/apps/rent-car-service/public/car-images',
          car.car_image,
        );
        if (fs.existsSync(distPath)) {
          fs.unlinkSync(distPath);
          console.log(`Deleted public image: ${distPath}`);
        }
      }
      car.car_image = image.filename;
      await queryRunner.manager.save(car);
      await queryRunner.commitTransaction();

      return {
        data: car,
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.message === 'Car not found') {
        throw new HttpException(
          {
            message: ['Car not found'],
            error: 'Car not found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Failed to upload image'],
          error: error.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async updateCar(id: number, payload: CreateUpdateCarsDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const car: Cars = await this.repository.findOneBy({ id });

      if (!car) {
        throw new Error('Car not found');
      }

      this.repository.merge(car, payload);

      await queryRunner.manager.save(car);
      await queryRunner.commitTransaction();

      return {
        data: {
          ...car,
        },
        message: 'Car updated successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.message === 'Car not found') {
        throw new HttpException(
          {
            message: ['Car not found'],
            error: 'Car not found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Failed to update car'],
          error: error.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async deleteCar(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const car: Cars = await this.repository.findOneBy({ id });

      if (!car) {
        throw new Error('Car not found');
      }

      if (car.car_image) {
        const distPath = path.join(
          './dist/apps/rent-car-service/public/car-images',
          car.car_image,
        );
        if (fs.existsSync(distPath)) {
          fs.unlinkSync(distPath);
          console.log(`Deleted public image: ${distPath}`);
        }
      }

      await queryRunner.manager.softDelete(Cars, id);
      await queryRunner.commitTransaction();

      return {
        data: car,
        message: 'Car deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.message === 'Car not found') {
        throw new HttpException(
          {
            message: ['Car not found'],
            error: 'Car not found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Failed to delete car'],
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
