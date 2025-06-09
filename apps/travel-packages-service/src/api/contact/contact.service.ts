import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MailService } from '@app/helpers/mail/mail.service';
import { sentContactDto } from './contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly mailService: MailService) {}

  public async sentContact(payload: sentContactDto) {
    try {
      this.mailService.sentContact(payload);
      return {
        message: 'Success sent contact',
      };
    } catch (error) {
      throw new HttpException(
        {
          message: [error.message || 'Failed to sent contact'],
          error: error.message || 'Internal server error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
