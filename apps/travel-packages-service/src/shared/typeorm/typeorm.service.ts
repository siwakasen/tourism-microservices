import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TravelPackages } from 'libs/entities';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    console.log('DATABASE_HOST:', this.config.get<string>('DATABASE_HOST'));
    console.log(
      'SLAVE_DATABASE_HOST:',
      this.config.get<string>('SLAVE_DATABASE_HOST')
    );
    return {
      type: 'postgres',
      replication: {
        master: {
          host: this.config.get<string>('DATABASE_HOST'),
          port: this.config.get<number>('DATABASE_PORT'),
          database: this.config.get<string>('DATABASE_NAME'),
          username: this.config.get<string>('DATABASE_USER'),
          password: this.config.get<string>('DATABASE_PASSWORD'),
        },
        slaves: [
          {
            host: this.config.get<string>('SLAVE_DATABASE_HOST'),
            port: this.config.get<number>('SLAVE_DATABASE_PORT'),
            database: this.config.get<string>('SLAVE_DATABASE_NAME'),
            username: this.config.get<string>('SLAVE_DATABASE_USER'),
            password: this.config.get<string>('SLAVE_DATABASE_PASSWORD'),
          },
        ],
      },
      entities: [TravelPackages],
      migrations: ['dist/migrations/*.{ts,js}'],
      migrationsTableName: 'typeorm_migrations',
      logger: 'advanced-console',
      //   logging: ['query', 'error'],
      logging: ['error'],
      synchronize: this.config.get<boolean>('SYNCHRONIZE'), // NEVER USE TRUE IN PRODUCTION
    };
  }
}
