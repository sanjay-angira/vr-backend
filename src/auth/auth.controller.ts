import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Headers,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ChangePasswordDto,
  SendOtpDto,
  VerifyOtpDto,
  SignInDto,
  ResetPasswordDto,
} from 'src/dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiBody({
    type: SignInDto,
    examples: {
      example1: {
        value: {
          email: 'sanjayangira007@gmail.com',
          password: 'password123',
        },
      },
    },
  })
  async login(@Body() signInDto: SignInDto) {
    return this.authService.login(signInDto);
  }

  @Get('checkEmailExists/:email')
  @ApiParam({ name: 'email', required: true })
  async checkEmailExists(@Param('email') email: string) {
    return this.authService.checkEmailExists(email);
  }

  @Post('send-otp')
  @ApiBody({
    type: SendOtpDto,
    examples: {
      example1: {
        value: {
          email: 'sanjayangira007@gmail.com',
        },
      },
    },
  })
  async forgetPassword(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Post('verify-otp')
  @ApiBody({
    type: VerifyOtpDto,
    examples: {
      example1: {
        value: {
          email: 'sanjayangira007@gmail.com',
          emailOtp: '123456',
        },
      },
    },
  })
  async verifyOTP(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOTP(verifyOtpDto);
  }

  @Post('reset-password')
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      example1: {
        value: {
          token: 'jwt-token-from-email-link',
          password: 'newpassword123',
          confirmPassword: 'newpassword123',
        },
      },
    },
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @ApiBearerAuth('access-token')
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      example1: {
        value: {
          password: 'newpassword123',
          confirmPassword: 'newpassword123',
        },
      },
    },
  })
  async changePassword(
    @Headers('authorization') authorization: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(authorization, changePasswordDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get authrized user by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.authService.geAuthrizedUserById(id);
  }
}
