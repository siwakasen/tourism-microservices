import { getEnvPath } from './common/helper/env.helper';

import { Module, NestModule } from '@nestjs/common';
import { MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { LiveChatModule } from './api/live-chat.module';
import { LoggerMiddleware } from 'libs/helpers/middleware/logger.midleware';

const envFilePath: string = getEnvPath(`${__dirname}`);
console.log('envFilePath [FOR DEV] :', getEnvPath(`${__dirname}`));

const LiveChatLogger = new LoggerMiddleware({
  directory: 'dist/apps/live-chat-service/logs/live-chat-logs',
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: process.env.NODE_ENV === 'production' ? [] : envFilePath,
    }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    LiveChatModule,
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LiveChatLogger.use.bind(LiveChatLogger))
      .forRoutes('live-chat');
  }
}
