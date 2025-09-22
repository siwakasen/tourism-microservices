// expenses.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Expenses } from 'libs/entities';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { CreateUpdateExpensesDto, PaginationExpensesDto } from './expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expenses)
    private readonly repository: Repository<Expenses>,
    private readonly dataSource: DataSource
  ) {}

  private formatDate = (dateStr: string) => {
    if (!dateStr) return undefined;
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  public async getAllExpensess(paginationDto: PaginationExpensesDto) {
    try {
      const {
        page = 1,
        limit = 200,
        search = '',
        start_date,
        end_date,
      } = paginationDto;
      const queryBuilder = this.repository
        .createQueryBuilder('expenses')
        .orderBy('expenses.created_at', 'DESC');

      const parameters: Record<string, any> = {};
      const searchConditions: string[] = [];
      const andConditions: string[] = [];

      if (search) {
        searchConditions.push(`expenses.expense_name ILIKE :search`);
        searchConditions.push(
          `CAST(expenses.expense_amount AS TEXT) ILIKE :search`
        );
        searchConditions.push(
          `CAST(expenses.created_by AS TEXT) ILIKE :search`
        );
        parameters['search'] = `%${search}%`;
      }

      if (start_date && end_date) {
        const formattedStartDate = this.formatDate(start_date);
        const formattedEndDate = this.formatDate(end_date);
        andConditions.push(
          `expenses.expense_date BETWEEN :start_date AND :end_date`
        );
        parameters['start_date'] = formattedStartDate;
        parameters['end_date'] = formattedEndDate;
      }

      const whereParts: string[] = [];
      if (searchConditions.length) {
        whereParts.push(`(${searchConditions.join(' OR ')})`);
      }
      if (andConditions.length) {
        whereParts.push(andConditions.join(' AND '));
      }

      if (whereParts.length) {
        queryBuilder.where(whereParts.join(' AND '), parameters);
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
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  public async getExpensesById(id: number) {
    try {
      const queryBuilder = this.repository.createQueryBuilder('expenses');

      const expenses = await queryBuilder
        .where('expenses.id = :id', { id })
        .getOne();

      if (!expenses) {
        throw new Error('Expenses not found');
      }

      return {
        data: expenses,
        message: 'Successfully get data expenses by id',
      };
    } catch (error) {
      if (error.message === 'Expenses not found') {
        throw new HttpException(
          {
            message: ['Expenses not found'],
            error: 'Expenses not found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  public async createExpenses(
    payload: CreateUpdateExpensesDto,
    created_by: number
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const expenses: Expenses = this.repository.create({
        ...payload,
        expense_date: new Date(payload.expense_date),
        created_by,
      });

      await queryRunner.manager.save(expenses);
      await queryRunner.commitTransaction();

      return {
        data: expenses,
        message: 'Successfully create data expenses',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async updateExpenses(id: number, payload: CreateUpdateExpensesDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const expenses = await this.repository.findOneBy({ id });

      if (!expenses) {
        throw new Error('Expenses not found');
      }

      this.repository.merge(expenses, payload);

      await queryRunner.manager.save(expenses);
      await queryRunner.commitTransaction();

      return {
        data: expenses,
        message: 'Successfully update data expenses',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      await queryRunner.release();
    }
  }

  public async deleteExpenses(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const expenses = await this.repository.findOneBy({ id });

      if (!expenses) {
        throw new Error('Expenses not found');
      }

      await queryRunner.manager.softDelete(Expenses, id);
      await queryRunner.commitTransaction();

      return {
        data: expenses,
        message: 'Successfully delete data expenses',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.message === 'Expenses not found') {
        throw new HttpException(
          {
            message: ['Expenses not found'],
            error: 'Expenses not found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      await queryRunner.release();
    }
  }
}
