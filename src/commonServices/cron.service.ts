import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { User } from 'src/entities/user/user.entity';
import { Visitor } from 'src/entities/user/visitors.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CronService {
  constructor(
    @InjectRepository(Visitor)
    private readonly visitorsRepository: Repository<Visitor>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  @Cron('*/5 * * * *') // every 5 minutes
  async clearExpiredOtps() {
    const now = new Date();

    // Clear from visitors
    await this.visitorsRepository
      .createQueryBuilder()
      .update()
      .set({
        phoneNumberOTPExpires: new Date(),
      })
      .where('phoneNumberOTPExpires < :now', { now })
      .execute();

    // Clear from users
    await this.usersRepository
      .createQueryBuilder()
      .update()
      .set({
        phoneNumberOTP: null,
        phoneNumberOTPExpires: null,
      })
      .where('phoneNumberOTPExpires < :now', { now })
      .execute();

    console.log('Expired OTPs cleaned');
  }

  @Cron('0 * * * *') // every hour
  async resetBlockedUsers() {
    const now = new Date();

    await this.usersRepository
      .createQueryBuilder()
      .update()
      .set({
        isBlockedUntil: null,
        otpRequestCount: 0,
      })
      .where('isBlockedUntil < :now', { now })
      .execute();
  }
}
