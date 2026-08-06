import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTagsController } from './product-tags.controller';
import { ProductTagsService } from './product-tags.service';
import { Tags } from '../entities/product/tags.entity';
import { Product } from '../entities/product/product.entity';
import { CommonModule } from '../commonServices/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tags, Product]), CommonModule],
  controllers: [ProductTagsController],
  providers: [ProductTagsService],
  exports: [ProductTagsService],
})
export class ProductTagsModule {}
