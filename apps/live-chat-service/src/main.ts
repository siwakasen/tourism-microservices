import { NestFactory } from '@nestjs/core';
import { LiveChatServiceModule } from './live-chat-service.module';

async function bootstrap() {
  const app = await NestFactory.create(LiveChatServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
