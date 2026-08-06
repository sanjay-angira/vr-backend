import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

export interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class NodemailerService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'sanjayangira007@gmail.com',
        pass: 'ssqswcaqdbyukdfn',
      },
      tls: {
        rejectUnauthorized: false, // <-- this line allows self-signed certificates
      },
    });
  }

  async sendMail(options: MailOptions): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: 'sanjayangira007@gmail.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }
}
