import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {  Bookings, BookingAdjustments, Payment, Refunds, Ratings, Expenses, Employee, Roles } from 'libs/entities';

@Injectable()
export class TransactionTypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      name: 'primary', 
      type: 'postgres',
      host: this.config.get<string>('DATABASE_HOST'),
      port: this.config.get<number>('DATABASE_PORT'),
      database: this.config.get<string>('DATABASE_NAME'),
      username: this.config.get<string>('DATABASE_USER'),
      password: this.config.get<string>('DATABASE_PASSWORD'),
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
      host: this.config.get<string>('SECONDARY_DATABASE_HOST'),
      port: this.config.get<number>('SECONDARY_DATABASE_PORT'),
      database: this.config.get<string>('SECONDARY_DATABASE_NAME'),
      username: this.config.get<string>('SECONDARY_DATABASE_USER'),
      password: this.config.get<string>('SECONDARY_DATABASE_PASSWORD'),
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
      host: this.config.get<string>('THIRD_DATABASE_HOST'),
      port: this.config.get<number>('THIRD_DATABASE_PORT'),
      database: this.config.get<string>('THIRD_DATABASE_NAME'),
      username: this.config.get<string>('THIRD_DATABASE_USER'),
      password: this.config.get<string>('THIRD_DATABASE_PASSWORD'),
      entities: [Employee, Roles],
      migrations: ['dist/migrations/*.{ts,js}'],
      migrationsTableName: 'typeorm_migrations',
      logger: 'advanced-console',
      logging: ['error'],
      synchronize: this.config.get<boolean>('THIRD_SYNCHRONIZE'), 
    };
  }
}
