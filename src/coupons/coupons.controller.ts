import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto } from '../dto/coupon.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { IdDto, PaginationDto } from '../dto/common.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new coupon' })
  @ApiBody({
    type: CreateCouponDto,
    examples: {
      example1: {
        summary: 'Example coupon',
        value: {
          couponCode: 'HIRENRIDE50',
          image: 'https://cdn.example.com/coupons/hirenride-50.jpg',
          discountType: 'percentage',
          discountValue: 50,
          startDate: '2025-12-05',
          endDate: '2025-12-30',
          isActive: true,
          isUserSpecific: true,
          userIds: [108, 29],
        },
      },
    },
  })
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all coupons' })
  @ApiQuery({ name: 'pageNumber', required: false, type: String })
  @ApiQuery({ name: 'pageSize', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.couponsService.findAll(paginationDto);
  }

  @Get('code/:couponCode')
  @ApiOperation({ summary: 'Get a coupon by code' })
  @ApiParam({ name: 'couponCode', required: true, type: String })
  findByCode(@Param('couponCode') couponCode: string) {
    return this.couponsService.findByCode(couponCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a coupon by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  findOne(@Param() idDto: IdDto) {
    return this.couponsService.findOne(idDto);
  }

  
  @Put(':id')
  @ApiOperation({ summary: 'Update a coupon by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({
    type: UpdateCouponDto,
    examples: {
      example1: {
        summary: 'Example coupon update',
        value: {
          couponCode: 'HIRENRIDE50',
          image: 'https://cdn.example.com/coupons/hirenride-50.jpg',
          discountType: 'percentage',
          discountValue: 50,
          startDate: '2025-12-05',
          endDate: '2025-12-30',
          isActive: true,
          isUserSpecific: true,
          userIds: [108, 29],
        },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.couponsService.update(id, updateCouponDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a coupon by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  remove(@Param() idDto: IdDto) {
    return this.couponsService.remove(idDto);
  }
}
