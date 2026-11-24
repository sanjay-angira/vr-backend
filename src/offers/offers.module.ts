import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { Offer } from '../entities/product/offer.entity';
import { CommonModule } from '../commonServices/common.module';
import { Category } from '../entities/productCategory/category.entity';
import { Product } from 'src/entities/product/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, Category, Product]),
    CommonModule,
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
