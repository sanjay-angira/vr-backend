// cms-section.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsSection } from '../entities/CMS/cmsSettings.entity';
import { Product } from '../entities/product/product.entity';
import { ProductVariant } from '../entities/product/product-variants.entity';
import { Category } from '../entities/productCategory/category.entity';
import { BlogPost } from '../entities/blog/blog-posts.entity';
import { Offer } from '../entities/product/offer.entity';
import { Faq } from '../entities/product/faq.entity';
import { Banner } from '../entities/CMS/banner.entity';
import { CmsSectionController } from './cms-section.controller';
import { CmsSectionService } from './cms-section.service';
import { Review } from 'src/entities/product/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CmsSection,

      Product,
      ProductVariant,
      Category,
      BlogPost,
      Offer,
      Faq,
      Banner,
      Review,
    ]),
  ],
  controllers: [CmsSectionController],
  providers: [CmsSectionService],
  exports: [CmsSectionService],
})
export class CmsSectionModule {}
