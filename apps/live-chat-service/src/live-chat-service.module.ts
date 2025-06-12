import { Module } from '@nestjs/common';
import { LiveChatServiceController } from './live-chat-service.controller';
import { LiveChatServiceService } from './live-chat-service.service';

@Module({
  imports: [],
  controllers: [LiveChatServiceController],
  providers: [LiveChatServiceService],
})
export class LiveChatServiceModule {}
