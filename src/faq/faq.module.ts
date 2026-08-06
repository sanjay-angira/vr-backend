import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';
import { Faq } from '../entities/product/faq.entity';
import { Product } from '../entities/product/product.entity';
import { CommonModule } from '../commonServices/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Faq, Product]), CommonModule],
  controllers: [FaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}
