import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariant } from 'src/entities/product/product-variants.entity';
import { Warehouse } from 'src/entities/product/warehouse.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([ProductVariant, Warehouse])],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
