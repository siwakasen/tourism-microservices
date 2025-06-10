import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { TourPackageModule } from './api/tour-package/tour-package.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ContactModule } from './api/contact/contact.module';
import { LoggerMiddleware } from '../../../libs/helpers/middleware/logger.midleware';

const envFilePath: string = getEnvPath(`${__dirname}/common/helper`);
console.log('envFilePath:', getEnvPath(`${__dirname}`));

const TourPackageLogger = new LoggerMiddleware({
  fileName: 'tour-package.log',
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Membuat config tersedia secara global
    }),
    ConfigModule.forRoot({ envFilePath, isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Adjusted for apps/tour-package-service/public
      serveRoot: '/public', // Optional: URL prefix for static files
    }),
    TourPackageModule,
    ContactModule,
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TourPackageLogger.use.bind(TourPackageLogger))
      .forRoutes('tour-package');
  }
}
