import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Expense } from 'libs/entities';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { CreateUpdateExpenseDto, PaginationDto } from './expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly repository: Repository<Expense>,
    private readonly dataSource: DataSource,
  ) {}

  public async getAllExpenses(paginationDto: PaginationDto) {
    try {
      const { page = 1, limit = 10, search = '' } = paginationDto;
      const queryBuilder = this.repository
        .createQueryBuilder('expense')
        .orderBy('expense.created_at', 'DESC');
        
      const conditions:string[] = [];
      const parameters: Record<string, any> = {};

      if (search) {
        conditions.push(`expense.expense_name ILIKE :search`);
        conditions.push(`CAST(expense.expense_amount AS TEXT) ILIKE :search`);
        conditions.push(`CAST(expense.created_by AS TEXT) ILIKE :search`);
        conditions.push(`CAST(expense.expense_date AS TEXT) ILIKE :search`);
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

  public async getExpenseById(id: number) {
    try {
      const queryBuilder = this.repository.createQueryBuilder('expense');

      const expense = await queryBuilder.where('expense.id = :id', { id }).getOne();

      if (!expense) {
        throw new Error('Expense not found');
      }

      return {
        data: expense,
        message: 'Successfully get data expense by id',
      };
    } catch (error) {
      if (error.message === 'Expense not found') {
        throw new HttpException(
          {
            message: ['Expense not found'],
            error: 'Expense not found',
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

  public async createExpense(payload: CreateUpdateExpenseDto, created_by: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const expense: Expense = this.repository.create({
        ...payload,
        expense_date: new Date(payload.expense_date),
        created_by,
      });

      await queryRunner.manager.save(expense);
      await queryRunner.commitTransaction();

      return {
        data: expense,
        message: 'Successfully create data expense',
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

  public async updateExpense(id: number, payload: CreateUpdateExpenseDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const expense = await this.repository.findOneBy({ id });

      if (!expense) {
        throw new Error('Expense not found');
      }
      
      this.repository.merge(expense, payload);

      await queryRunner.manager.save(expense);
      await queryRunner.commitTransaction();

      return {
        data: expense,
        message: 'Successfully update data expense',
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

  public async deleteExpense(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const expense = await this.repository.findOneBy({ id });

      if (!expense) {
        throw new Error('Expense not found');
      }

      await queryRunner.manager.softDelete(Expense, id);
      await queryRunner.commitTransaction();

      return {
        data: expense,
        message: 'Successfully delete data expense',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.message === 'Expense not found') {
        throw new HttpException(
          {
            message: ['Expense not found'],
            error: 'Expense not found',
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
