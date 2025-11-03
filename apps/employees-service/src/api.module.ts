import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { EmployeeModule } from './api/employees/employees.module';
import { GrpcModule } from './api/grpc-employees/grpc-employees.module';
import { LoggerMiddleware } from 'libs/helpers/middleware/logger.midleware';

const envFilePath: string = getEnvPath(`${__dirname}`);
console.log('envFilePath:', getEnvPath(`${__dirname}`));

const EmployeesLogger = new LoggerMiddleware({
  directory: 'dist/apps/employees-service/logs/employees-logs',
});

@Module({
  imports: [
    ConfigModule.forRoot({ ignoreEnvFile: true, isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    EmployeeModule,
    GrpcModule,
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(EmployeesLogger.use.bind(EmployeesLogger))
      .forRoutes('employees');
  }
}
