import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/commonServices/common.module';
import { Order } from 'src/entities/order/order.entity';
import { OrderItem } from 'src/entities/order/order-item.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), CommonModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
