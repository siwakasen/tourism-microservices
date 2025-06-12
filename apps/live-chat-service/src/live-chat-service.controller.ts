import { Controller, Get } from '@nestjs/common';
import { LiveChatServiceService } from './live-chat-service.service';

@Controller()
export class LiveChatServiceController {
  constructor(private readonly liveChatServiceService: LiveChatServiceService) {}

  @Get()
  getHello(): string {
    return this.liveChatServiceService.getHello();
  }
}
