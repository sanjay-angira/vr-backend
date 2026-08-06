// resend.service.ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const response = await this.resend.emails.send({
        from: 'info@vrindavanrasa.com', // Change after domain verification
        to,
        subject,
        html,
      });
      return response;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
}
