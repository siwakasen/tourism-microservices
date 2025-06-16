import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { BookingModule } from './api/bookings/booking.module';
import { LoggerMiddleware } from 'libs/helpers/middleware/logger.midleware';
import { PaymentModule } from './api/payments/payment.module';

const envFilePath: string = getEnvPath(`${__dirname}/common/helper`);
console.log('envFilePath:', getEnvPath(`${__dirname}`));

const TransactionLogger = new LoggerMiddleware({
  fileName: 'transaction.log',
});

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath, isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    BookingModule, 
    PaymentModule,
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TransactionLogger.use.bind(TransactionLogger))
      .forRoutes('bookings');
  }
}