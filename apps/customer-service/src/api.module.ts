import { getEnvPath } from "apps/employees-service/src/common/helper/env.helper";
import { LoggerMiddleware } from "libs/helpers/middleware/logger.midleware";
import { CustomerModule } from "./api/customer/customer.module";
import { GrpcCustomerModule } from "./api/grpc-customer/grpc-customer.module";
import { MiddlewareConsumer, Module,NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmConfigService } from "apps/employees-service/src/shared/typeorm/typeorm.service";


const envFilePath: string = getEnvPath(`${__dirname}/common/helper`);
console.log('envFilePath:', getEnvPath(`${__dirname}`));

const CustomersLogger = new LoggerMiddleware({
  fileName: 'customers.log',
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