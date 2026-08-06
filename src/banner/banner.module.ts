import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Banner } from '../entities/CMS/banner.entity';
import { CmsSection } from '../entities/CMS/cmsSettings.entity';

import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';

@Module({
  imports: [TypeOrmModule.forFeature([Banner])],
  controllers: [BannerController],
  providers: [BannerService],
})
export class BannerModule {}
