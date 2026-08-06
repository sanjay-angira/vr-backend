import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomerAuthService } from './customerAuth.service';
import {
  CompleteProfileDto,
  ResendEmailOtpDto,
  SendWhatsAppOtpDto,
  VerifyEmailOtpDto,
  VerifyWhatsAppOtpDto,
} from 'src/dto/customer.dto';

@ApiTags('Customer Auth')
@Controller('customer/auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('send-whatsapp-otp')
  @ApiBody({
    type: SendWhatsAppOtpDto,
    examples: {
      example1: {
        value: {
          phoneNumber: '918859569922',
        },
      },
    },
  })
  async sendWhatsAppOtp(@Body() sendWhatsAppOtpDto: SendWhatsAppOtpDto) {
    return this.customerAuthService.sendWhatsAppOtp(sendWhatsAppOtpDto);
  }

  @Post('verify-whatsapp-otp')
  @ApiBody({
    type: VerifyWhatsAppOtpDto,
    examples: {
      example1: {
        value: {
          phoneNumber: '918859569922',
          otp: '123456',
        },
      },
    },
  })
  async verifyWhatsAppOTP(@Body() verifyWhatsAppOtpDto: VerifyWhatsAppOtpDto) {
    return this.customerAuthService.verifyWhatsAppOTP(verifyWhatsAppOtpDto);
  }

  @Post('complete-profile')
  @ApiOperation({
    summary:
      'Save name + email after phone OTP. Sends email OTP; login tokens only after emailVerified.',
  })
  @ApiBody({
    type: CompleteProfileDto,
    examples: {
      example1: {
        value: {
          phoneNumber: '8859569922',
          firstName: 'Radha',
          lastName: 'Sharma',
          email: 'radha@example.com',
        },
      },
    },
  })
  async completeProfile(@Body() completeProfileDto: CompleteProfileDto) {
    return this.customerAuthService.completeProfile(completeProfileDto);
  }

  @Post('verify-email-otp')
  @ApiOperation({
    summary:
      'Verify email OTP. Issues login tokens only when profile is fully complete.',
  })
  @ApiBody({
    type: VerifyEmailOtpDto,
    examples: {
      example1: {
        value: {
          phoneNumber: '8859569922',
          otp: '123456',
        },
      },
    },
  })
  async verifyEmailOtp(@Body() verifyEmailOtpDto: VerifyEmailOtpDto) {
    return this.customerAuthService.verifyEmailOtp(verifyEmailOtpDto);
  }

  @Post('resend-email-otp')
  @ApiBody({
    type: ResendEmailOtpDto,
    examples: {
      example1: {
        value: {
          phoneNumber: '8859569922',
        },
      },
    },
  })
  async resendEmailOtp(@Body() resendEmailOtpDto: ResendEmailOtpDto) {
    return this.customerAuthService.resendEmailOtp(resendEmailOtpDto);
  }
}
