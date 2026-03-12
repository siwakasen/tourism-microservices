import { ConfigModule } from '@nestjs/config';
import { getEnvPath } from 'apps/transaction-service/src/common/helper/env.helper';
import { LoggerMiddleware } from 'libs/helpers/middleware/logger.midleware';
import { Module } from '@nestjs/common';
import { NestModule } from '@nestjs/common';
import { MiddlewareConsumer } from '@nestjs/common';
import { ReportModule } from './api/report.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TransactionTypeOrmConfigService,
  ExpensesTypeOrmConfigService,
  EmployeeTypeOrmConfigService,
} from './shared/typeorm/typeorm.service';

const envFilePath: string = getEnvPath(`${__dirname}`);
console.log('envFilePath [FOR DEV] :', getEnvPath(`${__dirname}`));

const ReportLogger = new LoggerMiddleware({
  directory: 'dist/apps/report-service/logs/report-logs',
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      envFilePath: envFilePath
    }),
    // Primary database connection
    TypeOrmModule.forRootAsync({
      name: 'primary',
      useClass: TransactionTypeOrmConfigService,
    }),
    // Secondary database connection
    TypeOrmModule.forRootAsync({
      name: 'secondary',
      useClass: ExpensesTypeOrmConfigService,
    }),
    // Third database connection
    TypeOrmModule.forRootAsync({
      name: 'third',
      useClass: EmployeeTypeOrmConfigService,
    }),
    ReportModule,
  ],
  providers: [
    TransactionTypeOrmConfigService,
    ExpensesTypeOrmConfigService,
    EmployeeTypeOrmConfigService,
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ReportLogger.use.bind(ReportLogger)).forRoutes('report');
  }
}
