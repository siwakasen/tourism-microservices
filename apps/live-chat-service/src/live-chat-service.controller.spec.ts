import { Test, TestingModule } from '@nestjs/testing';
import { LiveChatServiceController } from './live-chat-service.controller';
import { LiveChatServiceService } from './live-chat-service.service';

describe('LiveChatServiceController', () => {
  let liveChatServiceController: LiveChatServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [LiveChatServiceController],
      providers: [LiveChatServiceService],
    }).compile();

    liveChatServiceController = app.get<LiveChatServiceController>(LiveChatServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(liveChatServiceController.getHello()).toBe('Hello World!');
    });
  });
});
