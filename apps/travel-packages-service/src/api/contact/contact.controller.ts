import { Controller, Inject, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { sentContactDto } from './contact.dto';
import { Body } from '@nestjs/common';

@ApiTags('Contact')
@Controller('/contact')
export class ContactController {
  @Inject(ContactService)
  private readonly contactService: ContactService;

  @ApiResponse({
    status: 200,
    description: 'Successfuly sent contact',
  })
  @Post('sent')
  async sentContact(@Body() body: sentContactDto) {
    return await this.contactService.sentContact(body);
  }
}
