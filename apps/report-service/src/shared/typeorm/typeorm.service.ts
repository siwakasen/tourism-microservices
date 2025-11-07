import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  Bookings,
  BookingAdjustments,
  Payment,
  Refunds,
  Ratings,
  Expenses,
  Employee,
  Roles,
} from 'libs/entities';

@Injectable()
export class TransactionTypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      name: 'primary',
      type: 'postgres',
      url: this.config.get<string>('DATABASE_URL'),
      entities: [Bookings, BookingAdjustments, Payment, Refunds, Ratings],
      migrations: ['dist/migrations/*.{ts,js}'],
      migrationsTableName: 'typeorm_migrations',
      logger: 'advanced-console',
      logging: ['error'],
      synchronize: this.config.get<boolean>('SYNCHRONIZE'),
    };
  }
}

// Separate service for secondary database
@Injectable()
export class ExpensesTypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      name: 'secondary', // Connection name
      type: 'postgres',
      url: this.config.get<string>('SECONDARY_DATABASE_URL'),
      entities: [Expenses], // Add entities for secondary database if needed
      migrations: ['dist/migrations/*.{ts,js}'],
      migrationsTableName: 'typeorm_migrations',
      logger: 'advanced-console',
      logging: ['error'],
      synchronize: this.config.get<boolean>('SECONDARY_SYNCHRONIZE'),
    };
  }
}

@Injectable()
export class EmployeeTypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      name: 'third',
      type: 'postgres',
      url: this.config.get<string>('THIRD_DATABASE_URL'),
      entities: [Employee, Roles],
      migrations: ['dist/migrations/*.{ts,js}'],
      migrationsTableName: 'typeorm_migrations',
      logger: 'advanced-console',
      logging: ['error'],
      synchronize: this.config.get<boolean>('THIRD_SYNCHRONIZE'),
    };
  }
}
