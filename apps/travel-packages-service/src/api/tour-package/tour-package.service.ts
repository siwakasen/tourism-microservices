import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TourPackage } from 'libs/entities';
import { Repository, DataSource } from 'typeorm';
import {
  PaginationDto,
  CreateUpdateTourPackageDto,
  updateStatusDto,
} from './tour-package.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TourPackageService {
  constructor(private readonly dataSource: DataSource) {}
  @InjectRepository(TourPackage)
  private readonly repository: Repository<TourPackage>;
  getHello(): string {
    return 'Hello World!';
  }

  public async getAllTourPackage(paginationDto: PaginationDto) {
    try {
      const { page = 1, limit = 10, search = '' } = paginationDto;
      const queryBuilder = this.repository
        .createQueryBuilder('tour_packages')
        .orderBy('tour_packages.created_at', 'DESC');

      // Mengelompokkan kondisi pencarian
      const conditions = [];
      const parameters: Record<string, any> = {};

      if (search) {
        conditions.push('tour_packages.package_name ILIKE :search');
        parameters['search'] = `%${search}%`;
      }

      // Menggabungkan semua kondisi jika ada
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
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getTourPackageById(id: string) {
    try {
      const tourPackage: TourPackage = await this.repository.findOneBy({ id });

      if (!tourPackage) {
        throw new Error('Tour package not found');
      }

      return {
        data: tourPackage,
        message: 'Successfully get data tour package by id',
      };
    } catch (error) {
      if (error.message === 'Tour package not found') {
        throw new HttpException(
          {
            message: ['Tour package not found'],
            error: 'Not Found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async createTourPackage(payload: CreateUpdateTourPackageDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tourPackage: TourPackage = this.repository.create({
        ...payload,
      });

      await queryRunner.manager.save(tourPackage);
      await queryRunner.commitTransaction();

      return {
        data: tourPackage,
        message: 'Tour package created successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.detail.includes('package_name')) {
        throw new HttpException(
          {
            message: ['Tour package name already exists'],
            error: 'Conflict',
            statusCode: HttpStatus.CONFLICT,
          },
          HttpStatus.CONFLICT,
        );
      }

      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async uploadImages(id: string, files: Express.Multer.File[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const tourPackage: TourPackage = await this.repository.findOneBy({ id });
      if (!tourPackage) {
        throw new Error('Tour package not found');
      }
      const images = [];
      const imagesUploaded = files.map((file) => file.filename);
      images.push(...imagesUploaded);

      if (tourPackage.images) {
        tourPackage.images.push(...images);
      } else {
        tourPackage.images = images;
      }
      await queryRunner.manager.save(tourPackage);

      await queryRunner.commitTransaction();
      return {
        data: tourPackage,
        message: 'Images uploaded successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.message === 'Tour package not found') {
        throw new HttpException(
          {
            message: ['Tour package not found'],
            error: 'Not Found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async updateThumbnail(id: string, file: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tourPackage: TourPackage = await this.repository.findOneBy({ id });

      if (!tourPackage) {
        throw new Error('Tour package not found');
      }
      const distPath = path.join(
        './dist/apps/tour-package-service/public/tour-images',
        tourPackage.images[0],
      );
      if (fs.existsSync(distPath)) {
        fs.unlinkSync(distPath);
        console.log(`Deleted public image: ${distPath}`);
      }
      tourPackage.images[0] = file.filename;

      await queryRunner.manager.save(tourPackage);

      await queryRunner.commitTransaction();
      return {
        data: tourPackage,
        message: 'Thumbnail updated successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.message === 'Tour package not found') {
        throw new HttpException(
          {
            message: ['Tour package not found'],
            error: 'Not Found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async deleteImage(id: string, imagePath: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const tourPackage: TourPackage = await this.repository.findOneBy({ id });

      if (!tourPackage) {
        throw new Error('Tour package not found');
      }

      const image = tourPackage.images.find((img) => img === imagePath);
      if (!image) {
        throw new Error('Image not found');
      }
      const filePath = path.join(
        './apps/tour-package-service/public/tour-images',
        image,
      );
      const distPath = path.join(
        './dist/apps/tour-package-service/public/tour-images',
        image,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted storage image: ${filePath}`);
      }
      if (fs.existsSync(distPath)) {
        fs.unlinkSync(distPath);
        console.log(`Deleted public image: ${distPath}`);
      }
      tourPackage.images = tourPackage.images.filter((img) => img !== image);

      await queryRunner.manager.save(tourPackage);

      await queryRunner.commitTransaction();
      return {
        data: tourPackage,
        message: 'Image deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.message === 'Tour package not found') {
        throw new HttpException(
          {
            message: ['Tour package not found'],
            error: 'Not Found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (error.message === 'Image not found') {
        throw new HttpException(
          {
            message: ['Image not found'],
            error: 'Not Found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async updateTourPackage(
    id: string,
    payload: CreateUpdateTourPackageDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tourPackage: TourPackage = await this.repository.findOneBy({ id });

      if (!tourPackage) {
        throw new Error('Tour package not found');
      }

      this.repository.merge(tourPackage, payload);
      await queryRunner.manager.save(tourPackage);
      await queryRunner.commitTransaction();

      return {
        data: tourPackage,
        message: 'Tour package updated successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.message === 'Tour package not found') {
        throw new HttpException(
          {
            message: ['Tour package not found'],
            error: 'Not Found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      if (error.detail.includes('package_name')) {
        throw new HttpException(
          {
            message: ['Tour package name already exists'],
            error: 'Conflict',
            statusCode: HttpStatus.CONFLICT,
          },
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async deleteTourPackage(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tourPackage: TourPackage = await this.repository.findOneBy({ id });

      if (!tourPackage) {
        throw new Error('Tour package not found');
      }

      await queryRunner.manager.softDelete(TourPackage, id);
      await queryRunner.commitTransaction();

      return {
        data: tourPackage,
        message: 'Tour package deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.message === 'Tour package not found') {
        throw new HttpException(
          {
            message: ['Tour package not found'],
            error: 'Not Found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async updateTourPackageStatus(id: string, payload: updateStatusDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tourPackage: TourPackage = await this.repository.findOneBy({ id });

      if (!tourPackage) {
        throw new Error('Tour package not found');
      }

      tourPackage.status = payload.status;
      await queryRunner.manager.save(tourPackage);
      await queryRunner.commitTransaction();

      return {
        data: tourPackage,
        message: 'Tour package status updated successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.message === 'Tour package not found') {
        throw new HttpException(
          {
            message: ['Tour package not found'],
            error: 'Not Found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
