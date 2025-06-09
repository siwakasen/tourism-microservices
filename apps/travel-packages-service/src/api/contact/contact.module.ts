import { MailModule } from '@app/helpers/mail/mail.module';
import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { MailService } from '@app/helpers/mail/mail.service';

@Module({
  imports: [MailModule],
  controllers: [ContactController],
  providers: [ContactService, MailService],
})
export class ContactModule {}
