import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { Brand } from '../entities/product/brand.entity';
import { Category } from '../entities/productCategory/category.entity';
import { Offer } from '../entities/product/offer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Brand, Category, Offer])],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
