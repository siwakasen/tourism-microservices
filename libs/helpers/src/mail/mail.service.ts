import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import resetPasswordTemplate from './mail-template/reset.password';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async requestResetPassword(payload: {
    url: string;
    email: string;
  }): Promise<void> {
    try {
      const { url, email } = payload;

      const htmlTemplate = `${resetPasswordTemplate(url)}`;

      this.mailerService.sendMail({
        to: email,
        subject: 'Reset Password Anda',
        html: htmlTemplate,
        attachments: [
          {
            filename: 'lock-icon.png',
            path: 'apps/employees-service/images/email/image-1.png',
            cid: 'lockIcon',
          },
        ],
      });

      console.log(`Email sent to ${email}`);
    } catch (error) {
      console.error(`Error sending email to `, error);
      throw error;
    }
  }
}
