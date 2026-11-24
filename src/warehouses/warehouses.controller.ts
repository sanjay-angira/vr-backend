import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { CreateWarehouseDto, UpdateWarehouseDto } from 'src/dto/warehouse.dto';
import { WarehousesService } from './warehouses.service';
import { AdminApi } from 'src/commonServices/admin-api.decorator';

class WarehouseStatusDto {
  @IsBoolean()
  isActive!: unknown;
}

@Controller('admin')
@AdminApi()
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post('warehouses')
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @Get('warehouses')
  findAll(@Query('registeredOnly') registeredOnly?: string) {
    return this.warehousesService.findAll(registeredOnly === 'true');
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
