import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationDto } from 'src/dto/common.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all orders for admin' })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.ordersService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail with products for admin' })
  @ApiParam({ name: 'id', required: true, type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }
}
