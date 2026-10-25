import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtModule, JwtService } from '@nestjs/jwt';
import { UtilityService } from './utility.service';
import { NodemailerService } from './nodemailer.service';
import { EmailTemplate } from './emailTempaltes/Emailtemplate';
import { PasswordService } from './password.service';
import { UserTokenService } from './userToken.service';
import { MigrationService } from './migration.service';
import { CronService } from './cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from 'src/entities/user/user.entity';
import { Visitor } from 'src/entities/user/visitors.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResendService } from './resend.service';
import { OfferPricingService } from './offer-pricing.service';
import { RazorpayService } from './razorpay.service';
import { Category } from 'src/entities/productCategory/category.entity';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([User, Visitor, Category]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [
    UtilityService,
    NodemailerService,
    EmailTemplate,
    PasswordService,
    UserTokenService,
    MigrationService,
    CronService,
    ResendService,
    OfferPricingService,
    RazorpayService,
  ],
  exports: [
    UtilityService,
    JwtModule,
    NodemailerService,
    EmailTemplate,
    PasswordService,
    UserTokenService,
    MigrationService,
    ResendService,
    OfferPricingService,
    RazorpayService,
  ],
})
export class CommonModule {}
