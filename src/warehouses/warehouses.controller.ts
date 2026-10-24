import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { CreateWarehouseDto, UpdateWarehouseDto } from 'src/dto/warehouse.dto';
import { AdminWarehouseGuard } from './admin-warehouse.guard';
import { WarehousesService } from './warehouses.service';

class WarehouseStatusDto {
  @IsBoolean()
  isActive!: unknown;
}

@Controller('admin')
@UseGuards(AdminWarehouseGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post('brands/:brandId/warehouses')
  create(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.warehousesService.create(brandId, dto);
  }

  @Get('brands/:brandId/warehouses')
  findByBrand(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.warehousesService.findByBrand(brandId);
  }

  @Get('warehouses/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.warehousesService.findOne(id);
  }

  @Patch('warehouses/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(id, dto);
  }

  @Patch('warehouses/:id/default')
  setDefault(@Param('id', ParseIntPipe) id: number) {
    return this.warehousesService.setDefault(id);
  }

  @Patch('warehouses/:id/status')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: WarehouseStatusDto,
  ) {
    return this.warehousesService.setStatus(id, dto.isActive === true);
  }

  @Post('warehouses/:id/sync-delhivery')
  retryRegistration(@Param('id', ParseIntPipe) id: number) {
    return this.warehousesService.retryRegistration(id);
  }
}
