import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CarsModule } from './api/car/cars.module';
import { LoggerMiddleware } from 'libs/helpers/middleware/logger.midleware';
import { GrpcCarModule } from './api/grpc-car/grpc-car.module';

const envFilePath: string = getEnvPath(`${__dirname}`);

const CarLogger = new LoggerMiddleware({
  directory: 'dist/apps/rent-car-service/logs/rent-car-logs',
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      envFilePath: envFilePath
    }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public', // Optional: URL prefix for static files
    }),
    CarsModule,
    GrpcCarModule,
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CarLogger.use.bind(CarLogger)).forRoutes('cars');
  }
}
