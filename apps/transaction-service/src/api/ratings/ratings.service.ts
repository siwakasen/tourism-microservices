import { Bookings, BookingStatus, Ratings } from 'libs/entities';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRatingDto, PaginationDto } from './ratings.dto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Ratings)
    private readonly ratingsRepository: Repository<Ratings>,
    @InjectRepository(Bookings)
    private readonly bookingRepository: Repository<Bookings>
  ) {}

  @Inject(DataSource)
  private readonly dataSource: DataSource;

  public async createRating(payload: CreateRatingDto, customer_id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const booking = await this.bookingRepository.findOne({
        where: { id: payload.booking_id },
      });
      if (!booking) {
        throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
      }
      if (booking.status !== BookingStatus.COMPLETED) {
        throw new HttpException(
          'Booking not completed',
          HttpStatus.BAD_REQUEST
        );
      }
      if (booking.customer_id !== customer_id) {
        throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
      }
      const rating = this.ratingsRepository.create({
        ...payload,
        booking: booking,
        customer_id: customer_id,
      });
      await queryRunner.manager.save(rating);
      await queryRunner.commitTransaction();
      return {
        message: 'Rating created successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to create rating',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async getRatings(query: PaginationDto) {
    try {
      // add pagination
      const { page, limit, search } = query;

      const queryBuilder = this.ratingsRepository
        .createQueryBuilder('ratings')
        .leftJoinAndSelect('ratings.booking', 'booking');

      const conditions = [];
      const parameters: Record<string, any> = {};
      if (search) {
        conditions.push('ratings.description ILIKE :search');
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
        error.message || 'Failed to fetch ratings',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
