import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ExpenseModule } from './api/expense.module';

const envFilePath: string = getEnvPath(`${__dirname}/common/helper`);
console.log('envFilePath:', getEnvPath(`${__dirname}`));
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Membuat config tersedia secara global
    }),
    ConfigModule.forRoot({ envFilePath, isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public', // Optional: URL prefix for static files
    }),
    ExpenseModule,
  ],
})
export class ApiModule {}
