import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Employee, EmployeeToken, Roles } from 'libs/entities';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      replication: {
        master: {
          url: this.config.get<string>('DATABASE_URL'),
        },
        slaves: [
          {
            url: this.config.get<string>('SLAVE_DATABASE_URL'),
          },
        ],
      },
      entities: [Employee, EmployeeToken, Roles],
      migrations: ['dist/migrations/*.{ts,js}'],
      migrationsTableName: 'typeorm_migrations',
      logger: 'advanced-console',
      logging: ['error'],
      synchronize: this.config.get<boolean>('SYNCHRONIZE'), // NEVER USE TRUE IN PRODUCTION
    };
  }
}
