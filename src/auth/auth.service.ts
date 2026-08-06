import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user/user.entity';
import { UserRole } from '../entities/user/userRole.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/entities/user/role.entity';
import { PasswordService } from 'src/commonServices/password.service';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { UserTokenService } from 'src/commonServices/userToken.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NodemailerService } from 'src/commonServices/nodemailer.service';
import { ResendService } from 'src/commonServices/resend.service';
import { EmailTemplate } from 'src/commonServices/emailTempaltes/Emailtemplate';
import {
  ChangePasswordDto,
  ResetPasswordDto,
  SendOtpDto,
  SignInDto,
  VerifyOtpDto,
} from 'src/dto/auth.dto';
import { NotFoundError } from 'rxjs';
import { UserPermissionsService } from 'src/permissions/user-permissions.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRolesRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private passwordService: PasswordService,
    private userTokenService: UserTokenService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private nodemailerService: NodemailerService,
    private emailTemplate: EmailTemplate,
    private userPermissionsService: UserPermissionsService,
    private resendService: ResendService,
  ) {}

  async login(signInDto: SignInDto): Promise<any> {
    try {
      const user = await this.findByEmail(signInDto.email);
      if (!user) {
        throw new NotFoundException('User Not Found');
      }
      const isPasswordValid = await this.passwordService.decode(
        signInDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        return errorResponse('Invalid credentials', 400);
      }
      const accessToken = this.userTokenService.generateAccessToken(user);
      const refreshToken = this.userTokenService.generateRefreshToken(user);
      return successResponse(
        { user, accessToken, refreshToken },
        'Login successful',
      );
    } catch (error) {
      throw error;
    }
  }

  async checkEmailExists(email: string): Promise<any> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    return successResponse(user, 'User found', 200);
  }

  async geAuthrizedUserById(id: number): Promise<any> {
    const user = await this.findById(id);
    if (!user || !user.emailVerified) {
      throw new Error('User not found');
    }
    return successResponse(user, 'User found', 200);
  }

  async sendOtp(sendOtpDto: SendOtpDto): Promise<any> {
    const { email } = sendOtpDto;
    try {
      const user = await this.usersRepository.findOne({
        where: { email, isActive: true },
      });
      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Set expiration time (10 minutes from now)
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 10);

      // Save OTP and expiration to user
      user.emailOTP = otp;
      user.emailOTPExpires = expires;
      await this.usersRepository.save(user);

      // Send OTP via email using the dedicated template
      const emailHtml = this.emailTemplate.forgotPasswordOtpTemplate({
        title: 'Password Reset OTP',
        heading: 'Password Reset Request',
        otp: otp,
        expirationTime: '10 minutes',
      });

      try {
        const response = await this.resendService.sendEmail(
          user.email,
          'Password Reset OTP',
          emailHtml,
        );
        // await this.nodemailerService.sendMail({
        //     to: user.email,
        //     subject: 'Password Reset OTP',
        //     html: emailHtml
        // });
      } catch (mailError) {
        console.error('Failed to send password reset email:', mailError);
        throw mailError;
      }
    } catch (error) {
      throw error;
    }
  }

  async verifyOTP(verifyOtpDto: VerifyOtpDto): Promise<any> {
    const { email, emailOtp } = verifyOtpDto;
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Check if OTP matches and hasn't expired
      if (Number(user.emailOTP) !== Number(emailOtp)) {
        return errorResponse('Invalid OTP', 400);
      }

      const now = new Date();
      if (!user.emailOTPExpires || user.emailOTPExpires < now) {
        return errorResponse('OTP has expired', 400);
      }

      const accessToken = this.userTokenService.generateAccessToken(user);

      return successResponse(
        { user, accessToken },
        'OTP verified successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
    const { token, password, confirmPassword } = resetPasswordDto;
    try {
      if (password !== confirmPassword) {
        return errorResponse('Passwords do not match', 400);
      }

      const decodedToken = this.userTokenService.verifyAccessToken(token);
      const userId = decodedToken?.userRes?.id || decodedToken?.id;

      if (!userId) {
        return errorResponse('Invalid token payload', 401);
      }

      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        return errorResponse('User not found', 404);
      }

      const hashedPassword = await this.passwordService.encode(password);
      user.password = hashedPassword;

      user.emailOTP = null;
      user.emailOTPExpires = null;
      user.emailVerified = true;
      await this.usersRepository.save(user);

      return successResponse(null, 'Password reset successfully', 200);
    } catch (error) {
      throw error;
    }
  }

  async changePassword(
    authorization: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<any> {
    const { password, confirmPassword } = changePasswordDto;
    try {
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return errorResponse('Authorization token is required', 401);
      }

      if (password !== confirmPassword) {
        return errorResponse('Passwords do not match', 400);
      }

      const token = authorization.split(' ')[1];
      const decodedToken = this.userTokenService.verifyAccessToken(token);
      const userId = decodedToken?.userRes?.id || decodedToken?.id;

      if (!userId) {
        return errorResponse('Invalid token payload', 401);
      }

      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        return errorResponse('User not found', 404);
      }

      const hashedPassword = await this.passwordService.encode(password);
      user.password = hashedPassword;
      await this.usersRepository.save(user);

      return successResponse(null, 'Password changed successfully', 200);
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({
      where: { email: email, emailVerified: true, isActive: true },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) {
      return undefined;
    }

    user.userRoles = user.userRoles.map((userRole) => {
      return {
        ...userRole,
        roleId: userRole.role.id,
        roleName: userRole.role.roleName,
      };
    });
    (user as any).permissions =
      await this.userPermissionsService.getPermissionsForUser(user.id);
    return user || undefined;
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({
      where: { id: id, isActive: true, userRoles: { role: { roleId: 1 } } },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) {
      return undefined;
    }

    user.userRoles = user.userRoles.map((userRole) => {
      return {
        ...userRole,
        roleId: userRole.role.id,
        roleName: userRole.role.roleName,
      };
    });
    (user as any).permissions =
      await this.userPermissionsService.getPermissionsForUser(user.id);
    return user || undefined;
  }
}
