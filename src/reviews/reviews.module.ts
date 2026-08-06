import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review } from '../entities/product/review.entity';
import { Product } from '../entities/product/product.entity';
import { User } from '../entities/user/user.entity';
import { CommonModule } from '../commonServices/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Product, User]), CommonModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
