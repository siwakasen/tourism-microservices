import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import resetPasswordTemplate from './mail-template/reset.password';
import registrationTemplate from './mail-template/register';
import cancelApprovedTemplate from './mail-template/cancel-approved';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async requestResetPassword(payload: {
    url: string;
    email: string;
    pathImage: string;
  }): Promise<void> {
    try {
      const { url, email, pathImage } = payload;

      const htmlTemplate = `${resetPasswordTemplate(url)}`;

      this.mailerService.sendMail({
        to: email,
        subject: 'Reset Password Anda',
        html: htmlTemplate,
        attachments: [
          {
            filename: 'lock-icon.png',
            path: pathImage,
            cid: 'lockIcon',
          },
        ],
      });
    } catch (error) {
      console.error(`Error sending email to `, error);
      throw error;
    }
  }

  async sendRegisterCustomer(payload: {
    email: string;
    name: string;
  }): Promise<void> {
    const { email, name } = payload;

    const htmlTemplate = `${registrationTemplate(name)}`;

    this.mailerService.sendMail({
      to: email,
      subject: 'Account Registration',
      html: htmlTemplate,
    });
  }

  async sendCancelApproved(payload: {
    email: string;
    name: string;
    url: string;
  }): Promise<void> {
    const { email, name, url } = payload;
    const htmlTemplate = `${cancelApprovedTemplate(name, url)}`;
    this.mailerService.sendMail({
      to: email,
      subject: 'Booking Cancellation Approved',
      html: htmlTemplate,
    });
  }
}
