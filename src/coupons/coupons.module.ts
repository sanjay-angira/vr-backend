import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { Coupon } from '../entities/user/coupon.entity';
import { User } from '../entities/user/user.entity';
import { CommonModule } from '../commonServices/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, User]), CommonModule],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
