import {
  Controller,
  Get,
  UseGuards,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { LiveChatService } from './live-chat.service';
import { Roles } from '@app/helpers/auth/decorators/auth.decorator';
import { UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Live Chat')
@Controller('live-chat')
export class LiveChatController {
  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  async ping() {
    return { message: 'pong' };
  }
}
