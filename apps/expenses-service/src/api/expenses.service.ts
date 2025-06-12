import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Expenses } from 'libs/entities';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { CreateUpdateExpensesDto, PaginationDto } from './expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expenses)
    private readonly repository: Repository<Expenses>,
    private readonly dataSource: DataSource,
  ) {}

  public async getAllExpensess(paginationDto: PaginationDto) {
    try {
      const { page = 1, limit = 10, search = '' } = paginationDto;
      const queryBuilder = this.repository
        .createQueryBuilder('expenses')
        .orderBy('expenses.created_at', 'DESC');
        
      const conditions:string[] = [];
      const parameters: Record<string, any> = {};

      if (search) {
        conditions.push(`expenses.expense_name ILIKE :search`);
        conditions.push(`CAST(expenses.expense_amount AS TEXT) ILIKE :search`);
        conditions.push(`CAST(expenses.created_by AS TEXT) ILIKE :search`);
        conditions.push(`CAST(expenses.expense_date AS TEXT) ILIKE :search`);
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
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getExpensesById(id: number) {
    try {
      const queryBuilder = this.repository.createQueryBuilder('expenses');

      const expenses = await queryBuilder.where('expenses.id = :id', { id }).getOne();

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

  public async createExpenses(payload: CreateUpdateExpensesDto, created_by: number) {
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
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
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
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
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
