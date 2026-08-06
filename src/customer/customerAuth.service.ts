import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { Not, Repository } from 'typeorm';
import {
  CompleteProfileDto,
  ResendEmailOtpDto,
  SendWhatsAppOtpDto,
  VerifyEmailOtpDto,
  VerifyWhatsAppOtpDto,
} from 'src/dto/customer.dto';
import { User } from 'src/entities/user/user.entity';
import { UserTokenService } from 'src/commonServices/userToken.service';
import { Visitor } from 'src/entities/user/visitors.entity';
import { ResendService } from 'src/commonServices/resend.service';
import { EmailTemplate } from 'src/commonServices/emailTempaltes/Emailtemplate';

type AuthNextStep = 'profile' | 'email_otp' | null;

@Injectable()
export class CustomerAuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Visitor)
    private readonly visitorsRepository: Repository<Visitor>,
    private userTokenService: UserTokenService,
    private resendService: ResendService,
    private emailTemplate: EmailTemplate,
  ) {}

  /**
   * Profile is complete only when all 5 are set:
   * phoneNumberVerified, firstName, lastName, email, emailVerified
   */
  private isProfileCompleted(user: User): boolean {
    return Boolean(
      user.phoneNumberVerified &&
        user.firstName?.trim() &&
        user.lastName?.trim() &&
        user.email?.trim() &&
        user.emailVerified,
    );
  }

  private getNextStep(user: User): AuthNextStep {
    if (!user.phoneNumberVerified) {
      return 'profile';
    }

    if (
      !user.firstName?.trim() ||
      !user.lastName?.trim() ||
      !user.email?.trim()
    ) {
      return 'profile';
    }

    if (!user.emailVerified) {
      return 'email_otp';
    }

    return null;
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      email: user.email || null,
      phoneNumberVerified: Boolean(user.phoneNumberVerified),
      emailVerified: Boolean(user.emailVerified),
      profileImage: user.profileImage || null,
    };
  }

  private buildAuthResponse(user: User, message: string) {
    const profileCompleted = this.isProfileCompleted(user);
    const nextStep = this.getNextStep(user);

    if (!profileCompleted) {
      return successResponse(
        {
          profileCompleted: false,
          nextStep,
          user: this.toPublicUser(user),
        },
        message,
      );
    }

    const accessToken = this.userTokenService.generateAccessToken(user);
    const refreshToken = this.userTokenService.generateRefreshToken(user);

    return successResponse(
      {
        profileCompleted: true,
        nextStep: null,
        user: this.toPublicUser(user),
        accessToken,
        refreshToken,
      },
      message,
    );
  }

  private generateOtp(): string {
    // Keep deterministic OTP for local/dev (same as WhatsApp OTP flow).
    return true
      ? '123456'
      : Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async issueEmailOtp(user: User): Promise<void> {
    const otp = this.generateOtp();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    user.emailOTP = otp;
    user.emailOTPExpires = expires;
    await this.usersRepository.save(user);

    if (!user.email) {
      return;
    }

    try {
      const emailHtml = this.emailTemplate.forgotPasswordOtpTemplate({
        title: 'Email Verification OTP',
        heading: 'Verify your email',
        otp,
        expirationTime: '10 minutes',
      });

      await this.resendService.sendEmail(
        user.email,
        'Verify your email - Vrindavan Rasa',
        emailHtml,
      );
    } catch (mailError) {
      // Do not block onboarding if mail provider fails; OTP is still stored.
      console.error('Failed to send customer email OTP:', mailError);
    }
  }

  async sendWhatsAppOtp(dto: SendWhatsAppOtpDto): Promise<any> {
    const { phoneNumber } = dto;

    try {
      const now = new Date();

      const user = await this.usersRepository.findOne({
        where: { phoneNumber },
      });

      if (user) {
        if (user.isBlockedUntil && user.isBlockedUntil > now) {
          return errorResponse(
            'Too many OTP requests. Try again after 24 hours.',
            429,
          );
        }

        if (user.isBlockedUntil && user.isBlockedUntil <= now) {
          user.otpRequestCount = 0;
          user.isBlockedUntil = null;
        }

        if (user.otpRequestCount >= 3) {
          const blockUntil = new Date();
          blockUntil.setHours(blockUntil.getHours() + 24);

          user.isBlockedUntil = blockUntil;
          await this.usersRepository.save(user);

          return errorResponse(
            'Maximum OTP requests reached. Try again after 24 hours.',
            429,
          );
        }

        const otp = this.generateOtp();
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 5);

        user.phoneNumberOTP = otp;
        user.phoneNumberOTPExpires = expires;
        user.otpRequestCount = (user.otpRequestCount || 0) + 1;
        user.lastOtpRequestedAt = now;

        await this.usersRepository.save(user);

        return successResponse(
          null,
          `OTP sent successfully (${user.otpRequestCount}/3)`,
        );
      }

      let visitor = await this.visitorsRepository.findOne({
        where: { phoneNumber },
      });

      if (!visitor) {
        visitor = this.visitorsRepository.create({
          phoneNumber,
          otpRequestCount: 0,
        });
      }

      if (visitor.isBlockedUntil && visitor.isBlockedUntil > now) {
        return errorResponse(
          'Too many OTP requests. Try again after 24 hours.',
          429,
        );
      }

      if (visitor.isBlockedUntil && visitor.isBlockedUntil <= now) {
        visitor.otpRequestCount = 0;
        visitor.isBlockedUntil = null;
      }

      if (visitor.otpRequestCount >= 3) {
        const blockUntil = new Date();
        blockUntil.setHours(blockUntil.getHours() + 24);

        visitor.isBlockedUntil = blockUntil;
        await this.visitorsRepository.save(visitor);

        return errorResponse(
          'Maximum OTP requests reached. Try again after 24 hours.',
          429,
        );
      }

      const otp = this.generateOtp();
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 5);

      visitor.phoneNumberOTP = otp;
      visitor.phoneNumberOTPExpires = expires;
      visitor.otpRequestCount += 1;
      visitor.lastOtpRequestedAt = now;

      await this.visitorsRepository.save(visitor);

      return successResponse(
        null,
        `OTP sent successfully (${visitor.otpRequestCount}/3)`,
      );
    } catch (error) {
      throw error;
    }
  }

  async verifyWhatsAppOTP(dto: VerifyWhatsAppOtpDto): Promise<any> {
    const { phoneNumber, otp } = dto;

    try {
      const now = new Date();

      let user = await this.usersRepository.findOne({
        where: { phoneNumber },
      });

      if (user) {
        if (user.phoneNumberOTP !== otp) {
          return errorResponse('Invalid OTP', 400);
        }

        if (!user.phoneNumberOTPExpires || user.phoneNumberOTPExpires < now) {
          return errorResponse('OTP expired', 400);
        }

        user.phoneNumberOTP = null;
        user.phoneNumberOTPExpires = null;
        user.otpRequestCount = 0;
        user.isBlockedUntil = null;
        user.phoneNumberVerified = true;

        await this.usersRepository.save(user);

        const nextStep = this.getNextStep(user);

        if (nextStep === 'email_otp') {
          await this.issueEmailOtp(user);
        }

        return this.buildAuthResponse(
          user,
          this.isProfileCompleted(user)
            ? 'OTP verified successfully'
            : nextStep === 'email_otp'
              ? 'OTP verified. Please verify your email to continue.'
              : 'OTP verified. Please complete your profile to continue.',
        );
      }

      const visitor = await this.visitorsRepository.findOne({
        where: { phoneNumber },
      });

      if (!visitor) {
        return errorResponse('OTP not requested', 404);
      }

      if (visitor.phoneNumberOTP !== otp) {
        return errorResponse('Invalid OTP', 400);
      }

      if (
        !visitor.phoneNumberOTPExpires ||
        visitor.phoneNumberOTPExpires < now
      ) {
        return errorResponse('OTP expired', 400);
      }

      user = this.usersRepository.create({
        phoneNumber,
        phoneNumberVerified: true,
      });

      await this.usersRepository.save(user);
      await this.visitorsRepository.delete({ phoneNumber });

      return this.buildAuthResponse(
        user,
        'OTP verified. Please complete your profile to continue.',
      );
    } catch (error) {
      throw error;
    }
  }

  async completeProfile(dto: CompleteProfileDto): Promise<any> {
    const phoneNumber = dto.phoneNumber?.trim();
    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();
    const email = dto.email?.trim().toLowerCase();

    try {
      const user = await this.usersRepository.findOne({
        where: { phoneNumber },
      });

      if (!user) {
        return errorResponse(
          'User not found. Please verify your phone number first.',
          404,
        );
      }

      if (!user.phoneNumberVerified) {
        return errorResponse(
          'Phone number is not verified. Please verify OTP first.',
          400,
        );
      }

      const emailOwner = await this.usersRepository.findOne({
        where: { email, id: Not(user.id) },
      });

      if (emailOwner) {
        // Allow reclaim only when the other account never verified this email.
        if (emailOwner.emailVerified) {
          return errorResponse(
            'This email is already registered with another account. Please use a different email.',
            409,
          );
        }

        emailOwner.email = null!;
        emailOwner.emailVerified = false;
        emailOwner.emailOTP = null;
        emailOwner.emailOTPExpires = null;
        await this.usersRepository.save(emailOwner);
      }

      const emailChanged =
        (user.email || '').trim().toLowerCase() !== email || !user.emailVerified;

      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;

      if (emailChanged) {
        user.emailVerified = false;
      }

      await this.usersRepository.save(user);

      if (!user.firstName?.trim() || !user.lastName?.trim() || !user.email?.trim()) {
        return errorResponse(
          'Profile is incomplete. First name, last name, and email are required.',
          400,
        );
      }

      if (!user.emailVerified) {
        await this.issueEmailOtp(user);
        return this.buildAuthResponse(
          user,
          'Profile saved. Please verify your email OTP to continue.',
        );
      }

      return this.buildAuthResponse(user, 'Profile completed successfully');
    } catch (error) {
      throw error;
    }
  }

  async verifyEmailOtp(dto: VerifyEmailOtpDto): Promise<any> {
    const phoneNumber = dto.phoneNumber?.trim();
    const otp = dto.otp?.trim();

    try {
      const user = await this.usersRepository.findOne({
        where: { phoneNumber },
      });

      if (!user) {
        return errorResponse('User not found', 404);
      }

      if (!user.phoneNumberVerified) {
        return errorResponse('Phone number is not verified', 400);
      }

      if (!user.email?.trim()) {
        return errorResponse('Email is required before email OTP verification', 400);
      }

      if (String(user.emailOTP) !== String(otp)) {
        return errorResponse('Invalid email OTP', 400);
      }

      const now = new Date();
      if (!user.emailOTPExpires || user.emailOTPExpires < now) {
        return errorResponse('Email OTP expired', 400);
      }

      user.emailOTP = null;
      user.emailOTPExpires = null;
      user.emailVerified = true;

      await this.usersRepository.save(user);

      if (!this.isProfileCompleted(user)) {
        return this.buildAuthResponse(
          user,
          'Email verified. Please complete remaining profile details.',
        );
      }

      return this.buildAuthResponse(user, 'Email verified successfully');
    } catch (error) {
      throw error;
    }
  }

  async resendEmailOtp(dto: ResendEmailOtpDto): Promise<any> {
    const phoneNumber = dto.phoneNumber?.trim();

    try {
      const user = await this.usersRepository.findOne({
        where: { phoneNumber },
      });

      if (!user) {
        return errorResponse('User not found', 404);
      }

      if (!user.phoneNumberVerified) {
        return errorResponse('Phone number is not verified', 400);
      }

      if (!user.email?.trim()) {
        return errorResponse('Please save your email first', 400);
      }

      if (user.emailVerified) {
        return this.buildAuthResponse(user, 'Email is already verified');
      }

      await this.issueEmailOtp(user);

      return successResponse(
        {
          profileCompleted: false,
          nextStep: 'email_otp',
          user: this.toPublicUser(user),
        },
        'Email OTP sent successfully',
      );
    } catch (error) {
      throw error;
    }
  }
}
