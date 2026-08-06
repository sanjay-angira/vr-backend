import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/entities/order/order.entity';
import { Product } from 'src/entities/product/product.entity';
import { ProductVariant } from 'src/entities/product/product-variants.entity';
import { User } from 'src/entities/user/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, ProductVariant, User]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
