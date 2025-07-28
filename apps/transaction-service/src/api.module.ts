import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { BookingModule } from './api/bookings/booking.module';
import { LoggerMiddleware } from 'libs/helpers/middleware/logger.midleware';
import { PaymentModule } from './api/payments/payment.module';
import { BookingGrpcModule } from './api/bookings/grpc/booking-grpc.module';
import { BookingAdjustmentModule } from './api/booking-adjustments/booking-adjust.module';
import { RefundModule } from './api/refunds/refund.module';
import { ScheduleModule } from '@nestjs/schedule';

const envFilePath: string = getEnvPath(`${__dirname}/common/helper`);
console.log('envFilePath:', getEnvPath(`${__dirname}`));

const TransactionLogger = new LoggerMiddleware({
  directory: 'dist/apps/transaction-service/logs',
});

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath, isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    ScheduleModule.forRoot(),
    BookingModule,
    PaymentModule,
    BookingGrpcModule,
    BookingAdjustmentModule,
    RefundModule,
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TransactionLogger.use.bind(TransactionLogger))
      .forRoutes('bookings', 'payments', 'booking-adjustments', 'refunds');
  }
}
