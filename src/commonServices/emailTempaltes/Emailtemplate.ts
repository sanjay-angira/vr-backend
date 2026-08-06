import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailTemplate {
  mainTemplate = (
    options = {
      title: '',
      heading: '',
      message: '',
    },
  ) => {
    const {
      title = 'With love',
      heading = 'Hello!',
      message = 'Sending you a little ❤️ from our app.',
    } = options;

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${this.escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f6;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f6;padding:30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.06);">
                <!-- Header -->
                <tr>
                  <td style="padding:24px 30px 10px 30px;text-align:center;background:linear-gradient(90deg,#fff0f3,#fff6f8);">
                    <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#333;">${this.escapeHtml(heading)}</h1>
                  </td>
                </tr>
    
                <!-- Heart SVG -->
                <tr>
                  <td align="center" style="padding:18px 30px 6px 30px;">
                    <!-- SVG heart (inline for best email client support) -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="text-align:center;">
                          <svg width="92" height="80" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
                            <title>Heart</title>
                            <path d="M12 21s-7.5-4.94-10-8.12C-0.2 8.9 3.5 4 7.6 6.21 9.16 7.18 10 8.7 12 10.2c2-1.5 2.84-3.02 4.4-3.99C20.5 4 24.2 8.9 22 12.88 19.5 16.06 12 21 12 21z"
                              fill="#ff3b6b" />
                          </svg>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;
  };

  forgotPasswordOtpTemplate = (
    options = {
      title: '',
      heading: '',
      otp: '',
      expirationTime: '',
    },
  ) => {
    const {
      title = 'Password Reset OTP',
      heading = 'Password Reset Request',
      otp = '000000',
      expirationTime = '10 minutes',
    } = options;

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${this.escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f6;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f6;padding:30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.06);">
                <!-- Header -->
                <tr>
                  <td style="padding:24px 30px 10px 30px;text-align:center;background:linear-gradient(90deg,#fff0f3,#fff6f8);">
                    <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#333;">${this.escapeHtml(heading)}</h1>
                  </td>
                </tr>
    
                <!-- OTP Section -->
                <tr>
                  <td style="padding:30px;text-align:center;">
                    <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#555;margin:0 0 20px 0;">
                      You have requested to reset your password. Please use the following OTP to proceed:
                    </p>
                    
                    <!-- OTP Code -->
                    <div style="background:#f8f9fa;border:2px dashed #e9ecef;border-radius:8px;padding:20px;margin:25px 0;">
                      <h2 style="font-family:Arial,Helvetica,sans-serif;font-size:32px;color:#333;margin:0;letter-spacing:5px;">
                        ${this.escapeHtml(otp)}
                      </h2>
                    </div>
                    
                    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#777;margin:0 0 5px 0;">
                      This OTP will expire in <strong>${this.escapeHtml(expirationTime)}</strong>.
                    </p>
                    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#777;margin:0;">
                      If you didn't request this, please ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Security Note -->
                <tr>
                  <td style="padding:20px 30px;background:#f8f9fa;text-align:center;">
                    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#999;margin:0;">
                      For security reasons, please do not share this OTP with anyone.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;
  };

  userSetPasswordTemplate = (
    options = {
      title: '',
      heading: '',
      userName: '',
      setPasswordLink: '',
    },
  ) => {
    const {
      title = 'Set Your Password',
      heading = 'Welcome',
      userName = 'User',
      setPasswordLink = '#',
    } = options;

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${this.escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f6;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f6;padding:30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding:24px 30px 10px 30px;text-align:center;background:linear-gradient(90deg,#fff0f3,#fff6f8);">
                    <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#333;">${this.escapeHtml(heading)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;text-align:center;">
                    <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#555;margin:0 0 16px 0;">
                      Hello ${this.escapeHtml(userName)},
                    </p>
                    <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#555;margin:0 0 24px 0;">
                      Your account has been created. Use the button below to set your password.
                    </p>
                    <a href="${this.escapeAttr(setPasswordLink)}" style="display:inline-block;padding:14px 24px;border-radius:6px;background:#1f2937;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;">
                      Set Password
                    </a>
                    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#777;margin:24px 0 0 0;">
                      This link expires automatically based on the token lifetime.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;
  };

  /* Small helper functions to avoid HTML injection when interpolating user content */
  escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  escapeAttr(str = '') {
    return this.escapeHtml(str).replace(/\n/g, ' ');
  }
}
