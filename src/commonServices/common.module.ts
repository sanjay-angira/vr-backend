import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    JwtModule.register({
      secret: 'your_jwt_secret',
      signOptions: { expiresIn: '1d' },
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
