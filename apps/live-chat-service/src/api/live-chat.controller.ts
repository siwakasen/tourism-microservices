import { Controller, Get } from '@nestjs/common';
import { LiveChatService } from './live-chat.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Live Chat')
@Controller('live-chat')
export class LiveChatController {
  constructor(private readonly liveChatService: LiveChatService) {}

  @Get()
  async ping() {
    return { message: 'pong' };
  }
}
