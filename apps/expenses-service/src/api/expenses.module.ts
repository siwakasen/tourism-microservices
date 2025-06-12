import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expenses } from 'libs/entities';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { AuthHelper } from '@app/helpers/auth/user/auth.helper';
import { JwtStrategy } from '@app/helpers/auth/user/auth.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expenses]),
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
        name: 'EMP_PACKAGE',
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
  controllers: [ExpensesController],
  providers: [ExpensesService, JwtStrategy, {
    provide: AuthHelper,
    useFactory: (jwt: JwtService, clientEmp: ClientGrpc) => {
        return new AuthHelper(jwt, clientEmp);
      },
      inject: [JwtService, 'EMP_PACKAGE'],
    }],
})
export class ExpensesModule {}
