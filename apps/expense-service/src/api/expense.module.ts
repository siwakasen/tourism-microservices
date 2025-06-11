import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from 'libs/entities';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense]),
    PassportModule.register({ defaultStrategy: 'user', property: 'user' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_KEY'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES') },
      }),
    }),
    ClientsModule.registerAsync([
      {
        inject: [ConfigService],
        name: 'AUTH_PACKAGE',
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: 'contract/auth-employee-api.proto', // Ensure this path is correct
            url: config.get<string>('AUTH_SERVICE'),
          },
        }),
      },
    ]),
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule {}
