import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from '../entities/productCategory/category.entity';
import { CategorySeo } from '../entities/productCategory/category-seo.entity';
import { CommonModule } from '../commonServices/common.module';
import { Offer } from '../entities/product/offer.entity';
import { Product } from 'src/entities/product/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, CategorySeo, Offer, Product]),
    CommonModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
