import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { TravelPackagesModule } from './api/travel-packages/travel-packages.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { LoggerMiddleware } from 'libs/helpers/middleware/logger.midleware';
import { GrpcTravelPackagesModule } from './api/grpc-travel-packages/grpc-travel.module';

const envFilePath: string = getEnvPath(`${__dirname}`);
console.log('envFilePath [FOR DEV]:', getEnvPath(`${__dirname}`));
const TravelPackagesLogger = new LoggerMiddleware({
  directory: 'dist/apps/travel-packages-service/logs/travel-packages-logs',
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
      serveRoot: '/public',
    }),
    TravelPackagesModule,
    GrpcTravelPackagesModule,
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TravelPackagesLogger.use.bind(TravelPackagesLogger))
      .forRoutes('travel-packages');
  }
}
