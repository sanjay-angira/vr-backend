import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Banner } from '../entities/CMS/banner.entity';
import { BannerImage } from '../entities/CMS/banner-image.entity';
import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';

@Module({
  imports: [TypeOrmModule.forFeature([Banner, BannerImage])],
  controllers: [BannerController],
  providers: [BannerService],
})
export class BannerModule {}
