import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/commonServices/common.module';
import { Brand } from 'src/entities/product/brand.entity';
import { Warehouse } from 'src/entities/product/warehouse.entity';
import { AdminWarehouseGuard } from './admin-warehouse.guard';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Warehouse, Brand]),
    HttpModule,
    CommonModule,
  ],
  controllers: [WarehousesController],
  providers: [WarehousesService, AdminWarehouseGuard],
  exports: [WarehousesService],
})
export class WarehousesModule {}
