import { getEnvPath } from "./common/helper/env.helper";
import { LoggerMiddleware } from "libs/helpers/middleware/logger.midleware";
import { CustomerModule } from "./api/customer/customer.module";
import { GrpcCustomerModule } from "./api/grpc-customer/grpc-customer.module";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmConfigService } from "./shared/typeorm/typeorm.service";

const envFilePath: string = getEnvPath(`${__dirname}/common/helper`);

const CustomersLogger = new LoggerMiddleware({
  directory: 'dist/apps/customer-service/logs',
});

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath, isGlobal: true }),
        TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
        CustomerModule,
        GrpcCustomerModule,
    ],
})
export class ApiModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(CustomersLogger.use.bind(CustomersLogger))
            .forRoutes('customers');
    }
}