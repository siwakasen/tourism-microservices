import { Injectable } from '@nestjs/common';

@Injectable()
export class LiveChatServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
